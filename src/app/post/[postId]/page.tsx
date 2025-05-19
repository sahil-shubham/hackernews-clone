import { Suspense } from 'react'
import { notFound } from 'next/navigation'
// import { cookies } from 'next/headers' // No longer directly needed for these functions
import PostDetailPageClient from '@/components/post/PostDetailPageClient'
import { getServerSideUser } from '@/lib/authUtils'
import { prisma } from '@/lib/prisma' // Import Prisma client
import type { Post as PostType } from '@/types/post'
import type { Comment as CommentType } from '@/types/comment'
import type { VoteType as PrismaVoteType } from '@prisma/client'
import { PageContainer } from '@/components/ui/layout'

export const revalidate = 60; // Revalidate this page at most every 60 seconds

const LoadingSkeleton = () => (
  <PageContainer className="py-8">
    <div className="animate-pulse bg-card p-6 rounded-lg shadow border border-border">
      <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-muted rounded w-full mb-2"></div>
      <div className="h-4 bg-muted rounded w-full mb-4"></div>
      <div className="h-4 bg-muted rounded w-1/4"></div>
    </div>
    <div className="animate-pulse bg-card p-6 rounded-lg shadow mt-8 border border-border">
      <div className="h-6 bg-muted rounded w-1/3 mb-6"></div>
      <div className="h-10 bg-muted rounded w-full mb-4"></div>
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="p-4 border border-border rounded-md">
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
          </div>
        ))}
      </div>
    </div>
  </PageContainer>
)

async function fetchPostDetails(postId: string, currentUserId: string | null): Promise<PostType | null> {
  const postData = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: { id: true, username: true },
      },
      votes: {
        select: { userId: true, voteType: true },
      },
      _count: {
        select: { comments: true },
      },
    },
  })

  if (!postData) return null

  let currentUserVote: PrismaVoteType | undefined = undefined
  if (currentUserId) {
    const userVoteOnPost = postData.votes.find((vote) => vote.userId === currentUserId)
    if (userVoteOnPost) {
      currentUserVote = userVoteOnPost.voteType
    }
  }

  const points = postData.votes.reduce((acc, vote) => {
    if (vote.voteType === 'UPVOTE') return acc + 1
    if (vote.voteType === 'DOWNVOTE') return acc - 1
    return acc
  }, 0)

  return {
    id: postData.id,
    title: postData.title,
    url: postData.url,
    textContent: postData.textContent,
    points: points,
    author: postData.author,
    createdAt: postData.createdAt.toISOString(),
    commentCount: postData._count.comments,
    type: postData.type as "LINK" | "TEXT",
    voteType: currentUserVote,
    hasVoted: !!currentUserVote,
  }
}

async function fetchPostComments(postId: string, currentUserId: string | null): Promise<CommentType[]> {
  const commentsData = await prisma.comment.findMany({
    where: { postId: postId, parentId: null },
    include: {
      author: {
        select: { id: true, username: true },
      },
      votes: {
        select: { userId: true, voteType: true },
      },
      replies: {
        include: {
          author: { select: { id: true, username: true } },
          votes: { select: { userId: true, voteType: true } },
          replies: {
            include: {
              author: { select: { id: true, username: true } },
              votes: { select: { userId: true, voteType: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const transformComments = (prismaComments: any[]): CommentType[] => {
    return prismaComments.map((comment) => {
      let currentUserVoteOnComment: PrismaVoteType | undefined = undefined
      if (currentUserId) {
        const userVote = comment.votes.find((vote: any) => vote.userId === currentUserId)
        if (userVote) {
          currentUserVoteOnComment = userVote.voteType
        }
      }

      const points = comment.votes.reduce((acc: number, vote: any) => {
        if (vote.voteType === 'UPVOTE') return acc + 1
        if (vote.voteType === 'DOWNVOTE') return acc - 1
        return acc
      }, 0)

      return {
        id: comment.id,
        textContent: comment.textContent,
        author: comment.author,
        createdAt: comment.createdAt.toISOString(),
        points: points,
        voteType: currentUserVoteOnComment,
        hasVoted: !!currentUserVoteOnComment,
        replies: comment.replies ? transformComments(comment.replies) : [],
      }
    })
  }
  return transformComments(commentsData)
}

interface PostDetailPageProps {
  params: Promise<{ postId: string } | undefined>;
}

export default async function PostDetailPage({ params: paramsPromise }: PostDetailPageProps) {
  const params = await paramsPromise;
  if (!params) {
    notFound();
  }
  const { postId } = params;
  const currentUser = await getServerSideUser();

  // Fetch data in parallel
  const [postResult, commentsResult] = await Promise.allSettled([
    fetchPostDetails(postId, currentUser?.id || null),
    fetchPostComments(postId, currentUser?.id || null)
  ])

  const post = postResult.status === 'fulfilled' ? postResult.value : null
  // If fetching post details failed critically (not just 404), we might want to throw or show error page.
  if (postResult.status === 'rejected') {
    console.error("Failed to load post details:", postResult.reason)
    // Optionally, render an error page or throw to trigger Next.js error boundary
    // For now, if post is null, PostDetailPageClient will handle it (shows "Post not found").
  }
  
  if (!post) {
    notFound() // Triggers Next.js 404 page
  }

  const comments = commentsResult.status === 'fulfilled' ? commentsResult.value : []
  if (commentsResult.status === 'rejected') {
    console.error("Failed to load comments:", commentsResult.reason)
    // Comments failing to load might not be as critical as post failing.
    // We proceed with empty comments array and log error.
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PostDetailPageClient
        initialPost={post}
        initialComments={comments}
        currentUser={currentUser}
        postId={postId}
      />
    </Suspense>
  )
}
