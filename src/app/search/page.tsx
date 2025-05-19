import { Suspense } from 'react';
import { getServerSideUser } from '@/lib/authUtils';
import { prisma } from '@/lib/prisma';
import type { Post as PostType } from '@/types/post';
import type { VoteType as PrismaVoteType, PostType as PrismaPostType } from '@prisma/client';
import { PageContainer } from '@/components/ui/layout';
import SearchInputClient from '@/components/SearchInputClient';
import SearchResultsClient from '@/components/SearchResultsClient';

export const revalidate = 60;

interface FetchSearchResultsParams {
  query: string;
  page: number;
  sort: string;
  currentLoggedInUserId: string | null;
  limit?: number;
}

async function fetchSearchResults({
  query,
  page,
  sort,
  currentLoggedInUserId,
  limit = 20,
}: FetchSearchResultsParams): Promise<{ posts: PostType[]; pagination: any; query: string } | null> {
  if (!query.trim()) {
    return { posts: [], pagination: { page: 1, totalPages: 0, totalPosts: 0, limit }, query };
  }

  const offset = (page - 1) * limit;
  let orderBy: any = { createdAt: 'desc' };
  
  const whereClause: any = {
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { textContent: { contains: query, mode: 'insensitive' } },
    ],
  };

  if (sort === 'best') {
    orderBy = [{ votes: { _count: 'desc' } }, { comments: { _count: 'desc' } }, { createdAt: 'desc' }];
  }

  const postsData = await prisma.post.findMany({
    where: whereClause,
    include: {
      author: { select: { id: true, username: true } },
      votes: { select: { userId: true, voteType: true } },
      _count: { select: { comments: true } },
    },
    orderBy: sort === 'top' ? { createdAt: 'desc' } : orderBy,
    skip: offset,
    take: limit,
  });

  const totalPosts = await prisma.post.count({ where: whereClause });

  const processedPosts = postsData.map((post) => {
    const points = post.votes.reduce((acc, vote) => {
      if (vote.voteType === 'UPVOTE') return acc + 1;
      if (vote.voteType === 'DOWNVOTE') return acc - 1;
      return acc;
    }, 0);

    let currentUserVote: PrismaVoteType | undefined = undefined;
    if (currentLoggedInUserId) {
      const userVoteOnPost = post.votes.find((vote) => vote.userId === currentLoggedInUserId);
      if (userVoteOnPost) {
        currentUserVote = userVoteOnPost.voteType;
      }
    }
    return {
      id: post.id,
      title: post.title,
      url: post.url,
      textContent: post.textContent,
      points,
      author: post.author,
      createdAt: post.createdAt.toISOString(),
      commentCount: post._count.comments,
      type: post.type as PrismaPostType as 'LINK' | 'TEXT',
      voteType: currentUserVote,
      hasVoted: !!currentUserVote,
    };
  });

  if (sort === 'top') {
    processedPosts.sort((a, b) => b.points - a.points);
  }

  return {
    posts: processedPosts,
    pagination: {
      page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
      limit,
    },
    query,
  };
}

interface SearchPageProps {
  searchParams: Promise<{ 
    query?: string;
    page?: string;
    sort?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { query, page, sort } = await searchParams;

  const currentUser = await getServerSideUser();
  const searchResultsData = await fetchSearchResults({
    query: query || '',
    page: page ? Number(page) : 1,
    sort: sort || 'new',
    currentLoggedInUserId: currentUser?.id || null,
  });

  return (
    <PageContainer className="py-6 sm:py-8 max-w-5xl">
      <SearchInputClient initialQuery={query} />
      <Suspense fallback={<div className="text-center py-10">Loading search results...</div>}>
        {searchResultsData && (
          <SearchResultsClient
            initialPosts={searchResultsData.posts}
            initialPagination={searchResultsData.pagination}
            currentUser={currentUser}
            query={searchResultsData.query}
          />
        )}
        {!query && (
           <p className="text-center text-muted-foreground py-8">Enter a search term to begin.</p>
        )}
      </Suspense>
    </PageContainer>
  );
} 