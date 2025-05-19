'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  ChevronUp,
  ChevronDown,
  MessageSquare,
  ExternalLink
  // Bookmark, // For future use
  // Share2, // For future use
} from 'lucide-react'
import { useAuthStore } from '@/hooks/useAuthStore'
import type { Post as PostType } from '@/types/post' // Renamed to avoid conflict with component
import { Button } from '@/components/ui/Button' // Our existing button

interface PostItemProps {
  post: PostType
  onVote: (postId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => Promise<PostType | null> // Expects updated post or null
  index?: number
  isExpanded: boolean
  onToggleExpand: (postId: string) => void
}

const PostItem: React.FC<PostItemProps> = ({ post, onVote, index, isExpanded, onToggleExpand }) => {
  const user = useAuthStore((state) => state.user)

  // Local state for optimistic UI updates based on V0 example
  const [currentVote, setCurrentVote] = useState<'UPVOTE' | 'DOWNVOTE' | null>(null)
  const [displayPoints, setDisplayPoints] = useState(post.points)

  // Effect to sync with prop changes (e.g., after parent re-fetches or on initial load)
  useEffect(() => {
    setDisplayPoints(post.points)
    setCurrentVote(post.voteType || null)
  }, [post.points, post.voteType])

  const handleVote = async (newVoteDirection: 'UPVOTE' | 'DOWNVOTE') => {
    if (!user) {
      alert('Please login to vote.')
      return
    }

    let newOptimisticPoints = displayPoints
    const originalPoints = post.points // Points before this vote action
    const originalVote = post.voteType || null // Vote state before this action

    if (currentVote === newVoteDirection) {
      // Clicking the same button (undo vote)
      newOptimisticPoints = originalPoints
      setCurrentVote(null)
    } else {
      // New vote or switching vote
      newOptimisticPoints =
        originalPoints +
        (newVoteDirection === 'UPVOTE' ? 1 : -1) * (originalVote && originalVote !== newVoteDirection ? 2 : 1)
      setCurrentVote(newVoteDirection)
    }
    setDisplayPoints(newOptimisticPoints)

    try {
      const updatedPostFromServer = await onVote(post.id, newVoteDirection)
      if (updatedPostFromServer) {
        // If server confirms, re-sync with server state if needed, though optimistic is usually fine
        // setDisplayPoints(updatedPostFromServer.points);
        // setCurrentVote(updatedPostFromServer.voteType || null);
      } else {
        // Rollback optimistic update if server call fails or returns null
        setDisplayPoints(post.points)
        setCurrentVote(post.voteType || null)
        alert('Failed to register vote. Please try again.')
      }
    } catch (error) {
      console.error('Failed to vote:', error)
      // Rollback optimistic update
      setDisplayPoints(post.points)
      setCurrentVote(post.voteType || null)
      alert('Failed to register vote. Please try again.')
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
            disabled={!user}
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
            disabled={!user}
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
                className={`text-xs text-muted-foreground hover:underline flex items-center gap-1 mt-1 flex-shrink-0 ${focusRingClass} px-0.5`}
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
            <button
              onClick={() => onToggleExpand(post.id)}
              className={`flex items-center gap-1 hover:text-foreground transition-colors ${focusRingClass} px-0.5`}
            >
              <MessageSquare className="h-4 w-4" />
              {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
            </button>
          </div>

          {isExpanded && post.textContent && (
            <div className="mt-3 text-sm text-foreground/90 border-l-2 border-muted pl-3 py-1 whitespace-pre-wrap break-words">
              {post.textContent}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default PostItem
