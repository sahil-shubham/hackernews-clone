'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import CommentForm from '@/components/comment/CommentForm'
import CommentItem, { Comment } from '@/components/comment/CommentItem'
import * as Styled from '@/styles/components'

export default function PostDetailPage() {
  const { postId } = useParams()
  const { user, token } = useAuth()

  const [post, setPost] = useState<any | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch post and comments
  useEffect(() => {
    const fetchPostAndComments = async () => {
      setLoading(true)
      setError(null)

      try {
        const headers: HeadersInit = {}
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }

        // Fetch post details
        const postResponse = await fetch(`/api/posts/${postId}`, {
          headers
        })

        if (!postResponse.ok) {
          throw new Error('Failed to fetch post')
        }

        const postData = await postResponse.json()
        setPost(postData)

        // Fetch comments
        const commentsResponse = await fetch(`/api/posts/${postId}/comments`, {
          headers
        })

        if (!commentsResponse.ok) {
          throw new Error('Failed to fetch comments')
        }

        const commentsData = await commentsResponse.json()
        setComments(commentsData.comments)
      } catch (err) {
        console.error('Error fetching post details:', err)
        setError('Failed to load post. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (postId) {
      fetchPostAndComments()
    }
  }, [postId, token])

  // Handle comment voting
  const handleCommentVote = async (commentId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!user || !token) return

    try {
      const response = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ voteType })
      })

      if (!response.ok) {
        throw new Error('Failed to vote on comment')
      }

      // Update comment in the UI
      setComments((prevComments) => updateCommentVote(prevComments, commentId, voteType))
    } catch (err) {
      console.error('Error voting on comment:', err)
    }
  }

  // Update comment vote in UI
  const updateCommentVote = (comments: Comment[], commentId: string, voteType: 'UPVOTE' | 'DOWNVOTE'): Comment[] => {
    return comments.map((comment) => {
      if (comment.id === commentId) {
        // If user already voted with the same vote type, we're removing the vote
        return {
          ...comment,
          points: comment.voteType === voteType ? comment.points - 1 : comment.points + 1,
          voteType: comment.voteType === voteType ? null : voteType,
          hasVoted: comment.voteType !== voteType
        }
      } else if (comment.replies && comment.replies.length > 0) {
        // Check in replies recursively
        return {
          ...comment,
          replies: updateCommentVote(comment.replies, commentId, voteType)
        }
      }
      return comment
    })
  }

  // Add new comment
  const handleAddComment = async (text: string) => {
    if (!user || !token) return

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ textContent: text })
      })

      if (!response.ok) {
        throw new Error('Failed to post comment')
      }

      const newComment = await response.json()

      // Add new comment to the UI
      setComments((prevComments) => [
        ...prevComments,
        {
          ...newComment,
          points: 0,
          replies: []
        }
      ])
    } catch (err) {
      console.error('Error adding comment:', err)
      throw err
    }
  }

  // Handle comment reply
  const handleCommentReply = async (parentId: string, text: string) => {
    if (!user || !token) return

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          textContent: text,
          parentId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to post reply')
      }

      const newComment = await response.json()

      // Add reply to the UI
      setComments((prevComments) =>
        addReplyToComment(prevComments, parentId, {
          ...newComment,
          points: 0,
          replies: []
        })
      )
    } catch (err) {
      console.error('Error adding reply:', err)
      throw err
    }
  }

  // Add reply to comment recursively
  const addReplyToComment = (comments: Comment[], parentId: string, newReply: Comment): Comment[] => {
    return comments.map((comment) => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply]
        }
      } else if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: addReplyToComment(comment.replies, parentId, newReply)
        }
      }
      return comment
    })
  }

  // Loading state
  if (loading) {
    return (
      <Styled.PageContainer>
        <Styled.LoadingContainer>
          <Styled.LoadingTitle />
          <Styled.LoadingSubtitle />
          <Styled.LoadingContent />
        </Styled.LoadingContainer>
      </Styled.PageContainer>
    )
  }

  // Error state
  if (error || !post) {
    return (
      <Styled.PageContainer>
        <Styled.ErrorContainer>{error || 'Post not found'}</Styled.ErrorContainer>
        <Styled.StyledLink href="/">Back to home</Styled.StyledLink>
      </Styled.PageContainer>
    )
  }

  // Format the domain from URL if present
  const domain = post.url ? new URL(post.url).hostname.replace(/^www\./, '') : null

  // Format the time since post creation
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true
  })

  return (
    <Styled.PageContainer>
      {/* Post details */}
      <Styled.PostCard>
        <Styled.PostTitle level={1}>{post.title}</Styled.PostTitle>

        {post.url && (
          <Styled.PostUrl href={post.url} target="_blank" rel="noopener noreferrer">
            {domain && `(${domain})`}
          </Styled.PostUrl>
        )}

        {post.textContent && (
          <Styled.PostContent>
            <Styled.PreformattedText>{post.textContent}</Styled.PreformattedText>
          </Styled.PostContent>
        )}

        <Styled.PostMeta>
          <span>{post.points} points</span>
          <Styled.MetaSeparator>•</Styled.MetaSeparator>
          <span>by {post.author.username}</span>
          <Styled.MetaSeparator>•</Styled.MetaSeparator>
          <span>{timeAgo}</span>
          <Styled.MetaSeparator>•</Styled.MetaSeparator>
          <span>{post.commentCount} comments</span>
        </Styled.PostMeta>
      </Styled.PostCard>

      {/* Comment form */}
      <CommentForm postId={postId as string} onAddComment={handleAddComment} />

      {/* Display comments */}
      <Styled.CommentsSection>
        <Styled.CommentsSectionHeader>
          <Styled.CommentsHeading>Comments {comments.length > 0 && `(${comments.length})`}</Styled.CommentsHeading>
        </Styled.CommentsSectionHeader>

        {comments.length === 0 ? (
          <Styled.NoCommentsMessage>No comments yet. Be the first to comment!</Styled.NoCommentsMessage>
        ) : (
          <Styled.CommentsContainer>
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} onVote={handleCommentVote} onReply={handleCommentReply} />
            ))}
          </Styled.CommentsContainer>
        )}
      </Styled.CommentsSection>
    </Styled.PageContainer>
  )
}
