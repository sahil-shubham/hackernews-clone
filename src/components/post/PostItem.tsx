'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  ChevronUp,
  ChevronDown,
  MessageSquare,
  ExternalLink,
  Share2 as CopyLink
} from 'lucide-react'
import { User } from '@/lib/authUtils'
import type { Post as PostType } from '@/types/post'
import { voteOnPost } from '@/app/actions/voteActions'
import { useTransition } from 'react'
import BookmarkButton from './BookmarkButton'
import { toast } from 'sonner'

interface PostItemProps {
  post: PostType
  index?: number
  user: User | null
  isBookmarked?: boolean
  onBookmarkChange?: (postId: string, isBookmarked: boolean) => void
}

const PostItem: React.FC<PostItemProps> = ({ post, user, isBookmarked = false, onBookmarkChange }) => {
  const [currentVote, setCurrentVote] = useState<'UPVOTE' | 'DOWNVOTE' | null>(null)
  const [displayPoints, setDisplayPoints] = useState(post.points)
  const [isPending, startTransition] = useTransition()
  const [baseUrl, setBaseUrl] = useState<string>('')

  // Effect to sync with prop changes (e.g., after parent re-fetches or on initial load post-revalidation)
  useEffect(() => {
    setDisplayPoints(post.points)
    setCurrentVote(post.voteType || null)
  }, [post.points, post.voteType])

  // Set base URL on client side only
  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  const handleVote = async (newVoteDirection: 'UPVOTE' | 'DOWNVOTE') => {
    if (!user) {
      console.warn('User not logged in. Vote attempt blocked.')
      return
    }

    const originalPoints = displayPoints
    const originalVote = currentVote

    // Optimistic update
    let newOptimisticPoints = displayPoints
    let newOptimisticVote = currentVote

    if (currentVote === newVoteDirection) {
      // Undoing vote
      newOptimisticPoints += (newVoteDirection === 'UPVOTE' ? -1 : 1) * (originalVote === newVoteDirection ? 1 : 0)
      if (post.voteType === newVoteDirection) {
        newOptimisticPoints = post.points + (newVoteDirection === 'UPVOTE' ? -1 : 1)
      } else {
        newOptimisticPoints = post.points
      }
      newOptimisticVote = null
    } else {
      // New vote or switching vote
      newOptimisticPoints = post.points + (newVoteDirection === 'UPVOTE' ? 1 : -1)
      if (originalVote && originalVote !== newVoteDirection) {
        newOptimisticPoints += (newVoteDirection === 'UPVOTE' ? 1 : -1)
      }
      newOptimisticVote = newVoteDirection
    }
    
    setDisplayPoints(newOptimisticPoints)
    setCurrentVote(newOptimisticVote)

    startTransition(async () => {
      try {
        const result = await voteOnPost(post.id, newVoteDirection)

        if (!result.success) {
          setDisplayPoints(originalPoints)
          setCurrentVote(originalVote)
          console.error("Failed to vote on post:", result.message)
        }
      } catch (error) {
        setDisplayPoints(originalPoints)
        setCurrentVote(originalVote)
        console.error('Exception during post vote transition:', error)
      }
    })
  }

  const handleShare = async () => {
    const contentToCopy = post.type === 'LINK' && post.url 
      ? post.url 
      : `${baseUrl}/post/${post.id}`
    
    try {
      await navigator.clipboard.writeText(contentToCopy)
      toast.success(
        post.type === 'LINK' ? 'Link copied to clipboard' : 'Post link copied to clipboard',
        {
          duration: 2000,
        }
      )
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const domain = post.url ? new URL(post.url).hostname.replace(/^www\./, '') : null
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
  const isAskHN = post.type === 'TEXT' // Determine if it's an "Ask HN" type post

  const postHref = post.url || `/post/${post.id}`
  const postLinkTarget = post.url ? '_blank' : undefined

  const focusRingClass = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded'

  return (
    <article className="overflow-hidden transition-all bg-card border border-border rounded-md shadow-sm hover:border-muted-foreground/20 mb-4">
      <div className="flex">
        {/* Left sidebar with voting */}
        <div className="flex flex-col items-center py-2 px-2.5 bg-muted/20 border-r border-border">
          <button
            onClick={() => handleVote('UPVOTE')}
            className={`p-1 rounded-full transition-colors ${focusRingClass} ${currentVote === 'UPVOTE' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted/50 disabled:text-gray-400'}`}
            aria-label="Upvote"
            disabled={!user || isPending}
          >
            <ChevronUp className="h-5 w-5" />
          </button>

          <span
            className={`text-sm font-medium tabular-nums ${currentVote === 'UPVOTE' ? 'text-primary' : currentVote === 'DOWNVOTE' ? 'text-destructive font-semibold' : 'text-foreground'}`}
          >
            {displayPoints}
          </span>

          <button
            onClick={() => handleVote('DOWNVOTE')}
            className={`p-1 rounded-full transition-colors ${focusRingClass} ${currentVote === 'DOWNVOTE' ? 'text-destructive bg-destructive/10' : 'text-muted-foreground hover:bg-muted/50 disabled:text-gray-400'}`}
            aria-label="Downvote"
            disabled={!user || isPending}
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col p-4 flex-grow">
          <div className="flex items-start gap-2 mb-1.5">
            {isAskHN && (
              <span className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/30 flex-shrink-0">
                Ask HN
              </span>
            )}
            <h3 className="text-base sm:text-lg font-medium leading-tight flex-grow">
              <Link
                href={postHref}
                passHref
                className={`${focusRingClass} -ml-0.5 px-0.5 ${post.url ? 'flex items-start gap-1.5' : ''}`}
              >
                {post.title}
                {post.url && <ExternalLink className="h-3 w-3 mt-[0.3rem] flex-shrink-0 text-muted-foreground" />}
              </Link>
            </h3>
            {domain && post.url && (
              <Link
                href={post.url}
                passHref
                className={`hidden sm:flex text-xs text-muted-foreground hover:underline items-center gap-1 mt-1 flex-shrink-0 ${focusRingClass} px-0.5`}
              >
                {domain}
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>

          <div className="flex items-center text-sm text-muted-foreground gap-x-3 gap-y-1 flex-wrap">
            <span>
              by{' '}
              <Link
                href={`/user/${post.author.username}`}
                passHref
                className={`hover:underline font-medium text-foreground/80 ${focusRingClass} px-0.5`}
              >
                {post.author.username}
              </Link>
            </span>
            <span>{timeAgo}</span>
            <Link
              href={`/post/${post.id}`}
              className={`flex items-center gap-1 hover:text-foreground transition-colors ${focusRingClass} px-0.5`}
              passHref
            >
              <MessageSquare className="h-4 w-4" />
              {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
            </Link>
            <button
              onClick={handleShare}
              className={`flex items-center gap-1 hover:text-foreground transition-colors ${focusRingClass} px-0.5`}
              aria-label="Share post"
            >
              <CopyLink className="h-4 w-4" />
              copy link
            </button>
            {user && (
              <BookmarkButton
                postId={post.id}
                isBookmarked={isBookmarked}
                user={user}
                onBookmarkChange={(isBookmarked) => onBookmarkChange?.(post.id, isBookmarked)}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export default PostItem
