'use client'

import React, { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import type { Comment as CommentType } from '@/types/comment'
import { User } from '@/lib/authUtils'
import { voteOnComment } from '@/app/actions/voteActions'
import { submitComment } from '@/app/actions/commentActions'
import { useTransition } from 'react'
import { ChevronUp, MessageCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { FlexContainer } from '../ui/layout'
import CommentForm from './CommentForm'
import Link from 'next/link'
import { Text } from '../ui/typography'
import { toast } from 'sonner'

interface CommentItemProps {
  comment: CommentType
  postId: string
  depth?: number
  maxDepth?: number
  currentUser: User | null
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  postId,
  depth = 0,
  maxDepth = 5,
  currentUser
}) => {
  const user = currentUser
  const [isReplying, setIsReplying] = useState(false)

  const [currentVote, setCurrentVote] = useState(comment.voteType || null)
  const [displayPoints, setDisplayPoints] = useState(comment.points)
  const [votePending, startVoteTransition] = useTransition()
  const [replyPending, startReplyTransition] = useTransition()

  useEffect(() => {
    setCurrentVote(comment.voteType || null)
    setDisplayPoints(comment.points)
  }, [comment.voteType, comment.points])

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })

  const handleVote = async (voteDirection: 'UPVOTE' | 'DOWNVOTE') => {
    if (!user) {
      console.warn('User not logged in. Comment vote attempt blocked.')
      return
    }

    const originalPoints = displayPoints
    const originalVote = currentVote

    let newOptimisticPoints = displayPoints
    let newOptimisticVote = currentVote

    if (currentVote === voteDirection) {
      newOptimisticPoints = comment.points + (voteDirection === 'UPVOTE' ? -1 : 1)
      if (comment.voteType !== voteDirection) {
        newOptimisticPoints = comment.points
      }
      newOptimisticVote = null
    } else {
      newOptimisticPoints = comment.points + (voteDirection === 'UPVOTE' ? 1 : -1)
      if (originalVote && originalVote !== voteDirection) {
        newOptimisticPoints += voteDirection === 'UPVOTE' ? 1 : -1
      }
      newOptimisticVote = voteDirection
    }

    setCurrentVote(newOptimisticVote)
    setDisplayPoints(newOptimisticPoints)

    startVoteTransition(async () => {
      try {
        const result = await voteOnComment(comment.id, voteDirection, postId)

        if (!result.success) {
          setCurrentVote(originalVote)
          setDisplayPoints(originalPoints)
          console.error('Comment vote failed:', result.message)
          toast.error(result.message || 'Failed to record comment vote.')
        } else {
          if (result.newVoteType === 'UPVOTE') {
            toast.success('Comment upvoted!');
          } else if (result.newVoteType === 'DOWNVOTE') {
            toast.success('Comment downvoted!');
          } else {
            toast.info('Comment vote removed.');
          }
        }
      } catch (error) {
        setCurrentVote(originalVote)
        setDisplayPoints(originalPoints)
        console.error('Exception during comment vote transition:', error)
        toast.error('An unexpected error occurred while voting on the comment.')
      }
    })
  }

  const handleReplySubmit = async (text: string) => {
    if (!user || !text.trim()) return

    startReplyTransition(async () => {
      try {
        const result = await submitComment(comment.id, text, postId)
        if (result.success) {
          setIsReplying(false)
        } else {
          console.error('Failed to submit reply:', result.message)
        }
      } catch (error) {
        console.error('Exception during reply submission:', error)
      }
    })
  }

  const containerPaddingClass = depth > 0 ? (depth === 1 ? 'pl-4 md:pl-6' : 'pl-3 md:pl-4') : ''
  const borderClass = depth > 0 ? 'border-l-2 border-border' : ''

  return (
    <div className={`py-1 relative ${containerPaddingClass} ${borderClass}`}>
      <div className={`bg-card p-3 rounded-md shadow-sm border border-border`}>
        <FlexContainer align="center" className="text-xs text-muted-foreground mb-1.5">
          <Link
            href={`/user/${comment.author.username}`}
            passHref
            className="hover:underline font-medium text-foreground/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded px-0.5"
          >
            {comment.author.username}
          </Link>
          <span>•</span>
          <Text size="sm" emphasis="low" className="ml-1.5 text-xs">
            {timeAgo}
          </Text>
        </FlexContainer>

        <>
          <div className="text-sm text-foreground mb-2 whitespace-pre-wrap break-words">{comment.textContent}</div>

          <FlexContainer align="center" className="text-xs text-muted-foreground">
            {user && (
              <FlexContainer align="center" className="mr-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleVote('UPVOTE')}
                  aria-label="Upvote comment"
                  className={`p-0.5 h-auto rounded ${currentVote === 'UPVOTE' ? 'text-primary' : 'hover:text-primary'}`}
                  disabled={votePending}
                >
                  <ChevronUp size={16} strokeWidth={currentVote === 'UPVOTE' ? 3 : 2} />
                </Button>
                <Text
                  size="sm"
                  className={`font-medium tabular-nums mx-1 text-xs ${currentVote ? 'text-foreground' : ''}`}
                >
                  {displayPoints}
                </Text>
              </FlexContainer>
            )}
            {!user && (
              <Text size="sm" className="mr-4 tabular-nums text-xs">
                {displayPoints} {comment.points !== 1 ? 'points' : 'point'}
              </Text>
            )}

            {user && depth < maxDepth && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(!isReplying)}
                disabled={replyPending}
                className="p-1 h-auto text-xs flex items-center"
              >
                <MessageCircle size={14} className="mr-1" />
                {isReplying ? 'Cancel' : (replyPending ? 'Submitting...' : 'Reply')}
              </Button>
            )}
          </FlexContainer>

          {isReplying && currentUser && (
            <div className="mt-3">
              <CommentForm
                postId={postId}
                user={currentUser}
                onAddComment={handleReplySubmit}
                placeholder={`Replying to ${comment.author.username}...`}
                parentId={comment.id}
                isSubmitting={replyPending}
              />
            </div>
          )}
        </>
      </div>

      {comment.replies && comment.replies.length > 0 && depth < maxDepth && (
        <div className="mt-1">
          {comment.replies
            .filter(reply => {
              if (!reply || typeof reply.id === 'undefined') {
                console.warn('Filtered out a malformed reply object:', reply);
                return false;
              }
              return true;
            })
            .map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              depth={depth + 1}
              maxDepth={maxDepth}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CommentItem
