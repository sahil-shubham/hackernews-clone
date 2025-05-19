import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getServerSideUser } from '@/lib/authUtils';
import type { Post as PostType } from '@/types/post';
import type { VoteType as PrismaVoteType, PostType as PrismaPostType } from '@prisma/client';
import UserProfileClient from '@/components/UserProfileClient';
import { PageContainer } from '@/components/ui/layout';

// Define ProfileDisplayUser here or import if it's moved to a types file
interface ProfileDisplayUser {
  id: string;
  username: string;
  // createdAt?: string; // Optional: if you want to show join date
}

export const revalidate = 60; // Revalidate this page at most every 60 seconds

interface FetchUserDataAndPostsParams {
  username: string;
  currentLoggedInUserId: string | null;
  page?: number;
  limit?: number;
}

async function fetchUserDataAndPosts({
  username,
  currentLoggedInUserId,
  page = 1,
  limit = 20, // Adjust limit as needed
}: FetchUserDataAndPostsParams): Promise<{ profileUser: ProfileDisplayUser | null; posts: PostType[]; pagination: any } | null> {
  const userRecord = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, createdAt: true },
  });

  if (!userRecord) {
    return null;
  }
  
  const profileUser: ProfileDisplayUser = {
      id: userRecord.id,
      username: userRecord.username,
      // createdAt: userRecord.createdAt.toISOString(), // If you add createdAt to ProfileDisplayUser
  };

  const offset = (page - 1) * limit;

  const postsData = await prisma.post.findMany({
    where: { authorId: userRecord.id },
    include: {
      author: { select: { id: true, username: true } }, // Should be the profileUser
      votes: { select: { userId: true, voteType: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: 'desc' }, // Default sort: newest first
    skip: offset,
    take: limit,
  });

  const totalPosts = await prisma.post.count({ where: { authorId: userRecord.id } });

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
      points: points,
      author: post.author, // This is { id: string, username: string }
      createdAt: post.createdAt.toISOString(),
      commentCount: post._count.comments,
      type: post.type as PrismaPostType as "LINK" | "TEXT",
      voteType: currentUserVote,
      hasVoted: !!currentUserVote,
    };
  });

  return {
    profileUser: profileUser, // Now correctly typed
    posts: processedPosts,
    pagination: {
      page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
      limit,
    },
  };
}

interface UserPageProps {
  params: Promise<{ username: string } | undefined>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined } | undefined>;
}

export default async function UserPage({ params: paramsPromise, searchParams: searchParamsPromise }: UserPageProps) {
  const params = await paramsPromise;
  if (!params) {
    notFound();
  }

  const { username } = params;
  const searchParams = await searchParamsPromise;
  const page = Number(searchParams?.page || '1');
  const loggedInUser = await getServerSideUser(); // This is type User | null

  const data = await fetchUserDataAndPosts({
    username: username,
    currentLoggedInUserId: loggedInUser?.id || null,
    page,
  });

  if (!data || !data.profileUser) {
    notFound(); // Triggers 404 page
  }

  const { profileUser, posts, pagination } = data;

  return (
    <PageContainer>
      <Suspense fallback={<div className="container mx-auto px-4 py-lg max-w-4xl">Loading user profile...</div>}>
        <UserProfileClient
          profileUser={profileUser} // No longer needs casting, type matches ProfileDisplayUser
          initialPosts={posts}
          initialPagination={pagination}
          currentUser={loggedInUser} // This is the full User type for the logged-in user
        />
      </Suspense>
    </PageContainer>
  );
} 