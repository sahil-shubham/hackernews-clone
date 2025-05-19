'use client'

import { useState } from 'react'
import { User } from '@/lib/authUtils'
import type { Post as PostType } from '@/types/post'
import PostList from '@/components/post/PostList'
import { PageContainer } from '@/components/ui/layout'

interface BookmarksClientProps {
  initialPosts: PostType[]
  user: User
}

export default function BookmarksClient({ initialPosts, user }: BookmarksClientProps) {
  const [posts, setPosts] = useState<PostType[]>(initialPosts)

  const handleBookmarkChange = (postId: string, isBookmarked: boolean) => {
    if (!isBookmarked) {
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    }
  }

  return (
    <PageContainer className="py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Bookmarks</h1>
        <p className="text-muted-foreground">Posts you&apos;ve saved for later</p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">You haven&apos;t bookmarked any posts yet.</p>
          <p className="text-sm text-muted-foreground">Click the bookmark icon on any post to save it here.</p>
        </div>
      ) : (
        <PostList
          posts={posts.map((p) => ({ ...p, isBookmarked: true }))}
          user={user}
          onBookmarkChange={handleBookmarkChange}
        />
      )}
    </PageContainer>
  )
}
