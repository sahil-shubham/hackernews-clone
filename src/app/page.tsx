import { Suspense } from 'react';
import HomePageClient from '@/components/HomePageClient';
import type { Post } from '@/types/post';
import { getServerSideUser } from '@/lib/authUtils';
import { prisma } from '@/lib/prisma'; // Import Prisma client
import type { VoteType as PrismaVoteType, PostType as PrismaPostType } from '@prisma/client'; // Import Prisma types
import { calculateScore } from './utils/ranking'; // Corrected import path

export const revalidate = 60; // Revalidate this page at most every 60 seconds

async function fetchPostsData(
  page: number,
  sort: string,
  searchQuery: string,
  currentUserId: string | null
) {
  const limit = 30;
  const offset = (page - 1) * limit;

  let orderBy: any = { createdAt: 'desc' }; // Default for 'new'
  const whereClause: any = {};

  if (searchQuery) {
    // Using OR for searching in title or textContent. 
    // For more advanced full-text search, you might need to adjust your Prisma schema and query structure.
    whereClause.OR = [
      { title: { contains: searchQuery, mode: 'insensitive' } }, 
      { textContent: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  // Note: For 'top' and 'best', Prisma doesn't directly support ordering by aggregated vote counts 
  // or a complex scoring formula in a single findMany efficiently without raw queries or views.
  // The approach here is to fetch more data than needed for 'top' and sort in application code,
  // or use a simpler multi-field sort for 'best'.

  if (sort === 'best') {
    // This orderBy on related counts might not be directly supported or performant in all Prisma versions/
    // If issues arise, we would fetch posts and sort them in the application layer after calculating scores.
    // For true 'best' like Hacker News, a more complex scoring algorithm considering time decay is needed.
    orderBy = [{ votes: { _count: 'desc' } }, { comments: { _count: 'desc' } }, { createdAt: 'desc' }];
  }
  // For 'top', we fetch recent posts and then sort by calculated score in application code.
  // So, we can keep the default createdAt: 'desc' or remove specific orderBy for 'top' at Prisma level if fetching a wider pool.
  // Let's fetch by createdAt: 'desc' to get a relevant pool for 'top' before applying score.

  const postsData = await prisma.post.findMany({
    where: whereClause,
    include: {
      author: { select: { id: true, username: true } },
      votes: { select: { userId: true, voteType: true } },
      _count: { select: { comments: true } },
      bookmarks: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false,
    },
    orderBy: orderBy, // Keep existing orderBy for 'new' and 'best' (initial pool for 'best')
    skip: offset,
    take: limit, // For 'top', consider fetching more if performance allows, then slicing after scoring
  });

  const totalPosts = await prisma.post.count({ where: whereClause });

  const scoredPosts = postsData.map((post) => {
    const points = post.votes.reduce((acc, vote) => {
      if (vote.voteType === 'UPVOTE') return acc + 1;
      if (vote.voteType === 'DOWNVOTE') return acc - 1;
      return acc;
    }, 0);

    let currentUserVote: PrismaVoteType | undefined = undefined;
    if (currentUserId) {
      const userVoteOnPost = post.votes.find((vote) => vote.userId === currentUserId);
      if (userVoteOnPost) {
        currentUserVote = userVoteOnPost.voteType;
      }
    }

    return {
      id: post.id,
      title: post.title,
      url: post.url,
      textContent: post.textContent,
      points: points,
      author: post.author,
      createdAt: post.createdAt.toISOString(), // Keep as ISO string for calculateScore
      commentCount: post._count.comments,
      type: post.type as PrismaPostType as "LINK" | "TEXT",
      voteType: currentUserVote,
      hasVoted: !!currentUserVote,
      isBookmarked: currentUserId ? (post.bookmarks && post.bookmarks.length > 0) : false,
      // Add score field, calculated only if needed for 'top'
      score: sort === 'top' ? calculateScore({ points, createdAt: post.createdAt }) : 0,
    };
  });

  if (sort === 'top') {
    scoredPosts.sort((a, b) => b.score - a.score); // Sort by score descending for 'top'
  }
  // For 'best', if the Prisma orderBy on counts isn't sufficient/performant, 
  // implement a custom scoring and sorting logic here.
  // Example simplified scoring for 'best' if Prisma orderBy on counts is problematic:
  // if (sort === 'best') {
  //   scoredPosts.sort((a, b) => {
  //     const scoreA = a.points * 2 + a.commentCount; // Arbitrary weights
  //     const scoreB = b.points * 2 + b.commentCount;
  //     if (scoreB !== scoreA) return scoreB - scoreA;
  //     return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Then by recency
  //   });
  // }

  return {
    posts: scoredPosts, // Return the (potentially re-sorted) scoredPosts
    page,
    totalPages: Math.ceil(totalPosts / limit),
    totalPosts,
  };
}

interface PageProps {
  // searchParams is now a Promise that resolves to the search parameters object
  searchParams: Promise<{ [key: string]: string | string[] | undefined } | undefined>;
}

// This is the main Server Component for the page
export default async function Page({ searchParams: searchParamsPromise }: PageProps) {
  const searchParams = await searchParamsPromise;

  // Handle single or array values for params, taking the first if it's an array
  const pageParam = searchParams?.page;
  const sortParam = searchParams?.sort;
  const searchParam = searchParams?.search;

  const page = Number((Array.isArray(pageParam) ? pageParam[0] : pageParam) || '1');
  const sort = (Array.isArray(sortParam) ? sortParam[0] : sortParam) || 'new';
  const searchQuery = (Array.isArray(searchParam) ? searchParam[0] : searchParam) || '';

  const initialUser = await getServerSideUser();

  let initialPosts: Post[] = [];
  let initialPagination = { page: 1, totalPages: 1, totalPosts: 0 };
  let initialError: string | null = null;

  try {
    const data = await fetchPostsData(page, sort, searchQuery, initialUser?.id || null);
    initialPosts = data.posts;
    initialPagination = { page: data.page, totalPages: data.totalPages, totalPosts: data.totalPosts };
  } catch (err: any) {
    console.error('Page level error fetching posts:', err);
    initialError = err.message || 'Failed to load posts.';
    initialPosts = [];
  }

  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-lg max-w-4xl">Loading...</div>}> 
      <HomePageClient
        initialPosts={initialPosts}
        initialPagination={initialPagination}
        initialError={initialError}
        initialUser={initialUser}
      />
    </Suspense>
  );
}