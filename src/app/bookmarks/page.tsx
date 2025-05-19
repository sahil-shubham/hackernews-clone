import { Suspense } from 'react'
import { getServerSideUser } from '@/lib/authUtils'
import { prisma } from '@/lib/prisma'
import { PageContainer } from '@/components/ui/layout'
import BookmarksClient from '@/components/bookmarks/BookmarksClient'
import type { Post as PostType } from '@/types/post'

async function fetchBookmarkedPosts(userId: string): Promise<PostType[]> {
  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId
    },
    include: {
      post: {
        include: {
          author: {
            select: {
              id: true,
              username: true
            }
          },
          votes: {
            select: {
              userId: true,
              voteType: true
            }
          },
          _count: {
            select: { comments: true }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return bookmarks.map((bookmark) => {
    const post = bookmark.post
    const points = post.votes.reduce((acc, vote) => {
      if (vote.voteType === 'UPVOTE') return acc + 1
      if (vote.voteType === 'DOWNVOTE') return acc - 1
      return acc
    }, 0)

    return {
      id: post.id,
      title: post.title,
      url: post.url,
      textContent: post.textContent,
      points,
      author: post.author,
      createdAt: post.createdAt.toISOString(),
      commentCount: post._count.comments,
      type: post.type as 'LINK' | 'TEXT',
      voteType: null, // We don't need vote info for bookmarks page
      hasVoted: false
    }
  })
}

export default async function BookmarksPage() {
  const user = await getServerSideUser()

  if (!user) {
    return (
      <PageContainer className="flex flex-col items-center justify-center py-12">
        <h1 className="text-2xl font-bold mb-4">Bookmarks</h1>
        <p className="text-muted-foreground">Please log in to view your bookmarks.</p>
      </PageContainer>
    )
  }

  const bookmarkedPosts = await fetchBookmarkedPosts(user.id)

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookmarksClient initialPosts={bookmarkedPosts} user={user} />
    </Suspense>
  )
}
