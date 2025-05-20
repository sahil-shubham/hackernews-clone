'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { User } from '@/lib/authUtils'
import CommentForm from '@/components/comment/CommentForm'
import CommentList from '@/components/comment/CommentList'
import { PageContainer, FlexContainer } from '@/components/ui/layout'
import { Text, ErrorText } from '@/components/ui/typography'
import type { Vote } from '@/types/vote'
import type { Comment as CommentType } from '@/types/comment'
import type { Post as PostType } from '@/types/post'
import { submitComment } from '@/app/actions/commentActions'

interface PostDetailPageClientProps {
  initialPost: PostType | null;
  initialComments: CommentType[];
  currentUser: User | null;
  postId: string; // For actions like new comments
}

export default function PostDetailPageClient({
  initialPost,
  initialComments,
  currentUser,
  postId
}: PostDetailPageClientProps) {
  const effectiveUser = currentUser

  const [post, setPost] = useState<PostType | null>(initialPost)
  const [comments, setComments] = useState<CommentType[]>(initialComments)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  useEffect(() => {
    setPost(initialPost)
  }, [initialPost])

  useEffect(() => {
    setComments(initialComments)
  }, [initialComments])

  const updateCommentVoteState = (
    commentsList: CommentType[],
    commentId: string,
    newVoteType: Vote['voteType'] | null,
    newPoints: number
  ): CommentType[] => {
    return commentsList.map((comment) => {
      if (comment.id === commentId) {
        return { ...comment, voteType: newVoteType, points: newPoints, hasVoted: !!newVoteType }
      }
      if (comment.replies && comment.replies.length > 0) {
        return { ...comment, replies: updateCommentVoteState(comment.replies, commentId, newVoteType, newPoints) }
      }
      return comment
    })
  }

  const handleAddComment = async (text: string) => {
    if (!effectiveUser) {
      setActionError('You must be logged in to comment.')
      return
    }

    setIsSubmittingComment(true)
    setActionError(null)

    try {
      const result = await submitComment(null, text, postId)

      if (!result.success) {
        throw new Error(result.message)
      }

      // Update post's comment count
      if (post) {
        setPost((prevPost) => (prevPost ? { 
          ...prevPost, 
          commentCount: (prevPost.commentCount || 0) + 1 
        } : null))
      }

    } catch (err: any) {
      setActionError(err.message || 'Failed to post comment.')
      console.error('Error adding comment:', err)
    } finally {
      setIsSubmittingComment(false)
    }
  }


  const addReplyToCommentState = (
    commentsList: CommentType[],
    parentId: string,
    newReply: CommentType
  ): CommentType[] => {
    return commentsList.map((comment) => {
      if (comment.id === parentId) {
        return { ...comment, replies: [...(comment.replies || []), newReply] }
      }
      if (comment.replies && comment.replies.length > 0) {
        return { ...comment, replies: addReplyToCommentState(comment.replies, parentId, newReply) }
      }
      return comment
    })
  }

  if (!post) {
    // This case should ideally be handled by the server component sending an error or notFound()
    // But as a fallback for initialPost being null for some unexpected client reason:
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
        <ErrorText className="text-xl mb-4">Post not found.</ErrorText>
        <Link href="/" className="text-primary hover:underline">
          Back to home
        </Link>
      </PageContainer>
    )
  }

  const domain = post.url ? new URL(post.url).hostname.replace(/^www\./, '') : null
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })

  // The JSX from the original page.tsx will be moved here and adapted.
  // For brevity, this is a simplified structure.
  return (
    <PageContainer className="py-8 max-w-5xl">
      <article className="bg-card p-4 sm:p-6 rounded-lg shadow-md mb-8 border border-border">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">{post.title}</h1>

        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline break-all"
          >
            {domain ? `(${domain})` : post.url}
          </a>
        )}

        {post.textContent && (
          <div className="mt-4 text-foreground text-base">
            <pre className="whitespace-pre-wrap font-sans break-words">{post.textContent}</pre>
          </div>
        )}

        <FlexContainer align="center" gap="2" className="text-xs text-muted-foreground mt-4 flex-wrap">
          <Text size="sm">{post.points} points</Text>
          <span className="hidden sm:inline">•</span>
          <Text size="sm">
            by{' '}
            <Link href={`/user/${post.author.username}`} className="hover:underline text-foreground/80">
              {post.author.username}
            </Link>
          </Text>
          <span className="hidden sm:inline">•</span>
          <Text size="sm">{timeAgo}</Text>
          <span className="hidden sm:inline">•</span>
          <Text size="sm">
            {post.commentCount} comment{post.commentCount !== 1 ? 's' : ''}
          </Text>
        </FlexContainer>
      </article>

      {effectiveUser && postId && (
        <div className="mb-8">
          <CommentForm
            postId={postId}
            onAddComment={handleAddComment}
            user={effectiveUser}
            isSubmitting={isSubmittingComment}
            error={actionError}
          />
        </div>
      )}
      {!effectiveUser && (
        <Text className="mb-8 text-center text-muted-foreground">
          Please{' '}
          <Link href={`/login?next=/post/${postId}`} className="text-primary hover:underline">
            login
          </Link>{' '}
          to comment.
        </Text>
      )}

      <section className="bg-card p-4 sm:p-6 rounded-lg shadow-md border border-border">
        <h2 className="text-xl sm:text-2xl font-semibold">Comments {comments.length > 0 && `(${comments.length})`}</h2>

        {actionError && !isSubmittingComment && <ErrorText className="mb-4">{actionError}</ErrorText>}

        {comments.length === 0 ? (
          <Text emphasis="low" className="text-center py-4">
            No comments yet. Be the first to comment!
          </Text>
        ) : (
          <CommentList
            comments={comments}
            postId={postId}
            currentUser={effectiveUser} // Pass currentUser
            loading={commentsLoading} // Pass a loading state if needed for comments section
          />
        )}
      </section>
    </PageContainer>
  )
}
