'use client'

import { useState } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { User } from '@/lib/authUtils'

interface BookmarkButtonProps {
  postId: string
  isBookmarked: boolean
  user: User | null
  onBookmarkChange?: (isBookmarked: boolean) => void
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  postId,
  isBookmarked: initialIsBookmarked,
  user,
  onBookmarkChange
}) => {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
  const [isPending, setIsPending] = useState(false)

  const handleBookmark = async () => {
    if (!user) {
      console.warn('User not logged in. Bookmark attempt blocked.')
      return
    }

    setIsPending(true)
    try {
      if (isBookmarked) {
        // First, get the bookmark ID for this post
        const bookmarkResponse = await fetch(`/api/bookmarks?postId=${postId}`)
        if (!bookmarkResponse.ok) {
          throw new Error('Failed to fetch bookmark')
        }
        const bookmarkData = await bookmarkResponse.json()
        
        if (!bookmarkData.bookmark?.id) {
          throw new Error('Bookmark not found')
        }

        const response = await fetch(`/api/bookmarks/${bookmarkData.bookmark.id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to remove bookmark')
        }
      } else {
        // Create bookmark
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ postId }),
        })

        if (!response.ok) {
          throw new Error('Failed to add bookmark')
        }
      }

      setIsBookmarked(!isBookmarked)
      onBookmarkChange?.(!isBookmarked)
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    } finally {
      setIsPending(false)
    }
  }

  const focusRingClass = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded'

  return (
    <button
      onClick={handleBookmark}
      disabled={!user || isPending}
      className={`p-1.5 rounded-full transition-colors ${focusRingClass} ${
        isBookmarked
          ? 'text-primary bg-primary/10'
          : 'text-muted-foreground hover:bg-muted/50 disabled:text-gray-400'
      }`}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      {isBookmarked ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
    </button>
  )
}

export default BookmarkButton 