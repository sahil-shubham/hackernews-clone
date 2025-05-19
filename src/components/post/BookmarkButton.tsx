'use client'

import { useState, startTransition } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { toast } from 'sonner'
import { User } from '@/lib/authUtils'
import {
  getBookmarkByPostIdAction,
  createBookmarkAction,
  deleteBookmarkAction,
} from '@/app/actions/bookmarkActions'

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
        const existingBookmark = await getBookmarkByPostIdAction(postId)

        if (!existingBookmark?.id) {
          console.warn('Attempted to delete a bookmark not found on server. Syncing state.')
          setIsBookmarked(false)
          onBookmarkChange?.(false)
          return
        }

        await deleteBookmarkAction(existingBookmark.id)
      } else {
        await createBookmarkAction(postId)
      }

      const newIsBookmarked = !isBookmarked
      setIsBookmarked(newIsBookmarked)
      onBookmarkChange?.(newIsBookmarked)
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    } finally {
      setIsPending(false)
    }
  }

  const handleBookmarkWithTransition = () => {
    if (!user) {
      console.warn('User not logged in. Bookmark attempt blocked.')
      toast.error('Please log in to bookmark posts.')
      return
    }
    startTransition(async () => {
      setIsPending(true)
      try {
        if (isBookmarked) {
          const existingBookmark = await getBookmarkByPostIdAction(postId)
          if (!existingBookmark?.id) {
            console.warn('Attempted to delete a bookmark not found on server. Syncing state.')
            setIsBookmarked(false)
            onBookmarkChange?.(false)
            setIsPending(false)
            return
          }
          await deleteBookmarkAction(existingBookmark.id)
          toast.success('Bookmark removed')
        } else {
          await createBookmarkAction(postId)
          toast.success('Bookmark added')
        }
        const newIsBookmarked = !isBookmarked
        setIsBookmarked(newIsBookmarked)
        onBookmarkChange?.(newIsBookmarked)
      } catch (error) {
        console.error('Error toggling bookmark:', error)
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
        if (errorMessage === 'Bookmark already exists') {
          toast.info('Post is already bookmarked.')
          if (!isBookmarked) {
            setIsBookmarked(true)
            onBookmarkChange?.(true)
          }
        } else if (errorMessage.includes('Unauthorized')) {
          toast.error('Authentication error. Please log in again.')
        } else {
          toast.error(`Failed to toggle bookmark: ${errorMessage}`)
        }
      } finally {
        setIsPending(false)
      }
    })
  }

  const focusRingClass = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded'

  return (
    <button
      onClick={handleBookmarkWithTransition}
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