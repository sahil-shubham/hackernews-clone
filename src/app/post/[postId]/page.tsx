'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useAuthStore } from '@/hooks/useAuthStore'
import CommentForm from '@/components/comment/CommentForm'
import CommentItem from '@/components/comment/CommentItem'
import { PageContainer, FlexContainer } from '@/components/ui/layout'
import { Heading, Text, ErrorText } from '@/components/ui/typography'
import type { Vote } from '@/types/vote'
import type { Comment } from '@/types/comment'
import type { Post } from '@/types/post'

const LoadingSkeleton = () => (
  <PageContainer className="py-8">
    <div className="animate-pulse bg-card p-6 rounded-lg shadow">
      <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-muted rounded w-full mb-2"></div>
      <div className="h-4 bg-muted rounded w-full mb-4"></div>
      <div className="h-4 bg-muted rounded w-1/4"></div>
    </div>
    <div className="animate-pulse bg-card p-6 rounded-lg shadow mt-8">
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
);

export default function PostDetailPage() {
  const { postId } = useParams()
  const user = useAuthStore((state) => state.user)

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPostAndComments = async () => {
      setLoading(true)
      setError(null)

      try {
        const headers: HeadersInit = {}
        if (user?.token) {
          headers.Authorization = `Bearer ${user.token}`
        }

        const postResponse = await fetch(`/api/posts/${postId}`, { headers })
        if (!postResponse.ok) throw new Error('Failed to fetch post')
        const postData = await postResponse.json()
        setPost(postData as Post)

        const commentsResponse = await fetch(`/api/posts/${postId}/comments`, { headers })
        if (!commentsResponse.ok) throw new Error('Failed to fetch comments')
        const commentsData = await commentsResponse.json()
        setComments(commentsData.comments as Comment[])
      } catch (err) {
        console.error('Error fetching post details:', err)
        setError(err instanceof Error ? err.message : 'Failed to load post. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (postId) {
      fetchPostAndComments()
    }
  }, [postId, user?.token])

  const handleCommentVote = async (commentId: string, voteType: Vote['voteType']) => {
    if (!user?.token) {
      console.error('User not authenticated');
      return;
    }

    try {
      const payload: Vote = { voteType };
      const response = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to vote on comment');

      setComments((prevComments) => updateCommentVote(prevComments, commentId, voteType));
    } catch (err) {
      console.error('Error voting on comment:', err);
    }
  };

  const updateCommentVote = (commentsList: Comment[], commentId: string, voteType: Vote['voteType']): Comment[] => {
    return commentsList.map((commentNode) => {
      if (commentNode.id === commentId) {
        const alreadyVotedThisType = commentNode.voteType === voteType;
        let pointsChange = 0;
        if (alreadyVotedThisType) {
          pointsChange = voteType === 'UPVOTE' ? -1 : 1;
        } else if (commentNode.voteType) {
          pointsChange = voteType === 'UPVOTE' ? 2 : -2;
        } else {
          pointsChange = voteType === 'UPVOTE' ? 1 : -1;
        }

        return {
          ...commentNode,
          points: commentNode.points + pointsChange,
          voteType: alreadyVotedThisType ? null : voteType,
          hasVoted: !alreadyVotedThisType 
        } as Comment;
      } else if (commentNode.replies && commentNode.replies.length > 0) {
        return {
          ...commentNode,
          replies: updateCommentVote(commentNode.replies, commentId, voteType)
        } as Comment;
      }
      return commentNode;
    });
  };

  const handleAddComment = async (text: string) => {
    if (!user?.token || !user.id || !user.username) {
      console.error('User not authenticated or missing details');
      throw new Error('Authentication required to comment.');
    }

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ textContent: text })
      });

      if (!response.ok) throw new Error('Failed to post comment');

      const newCommentResponse = await response.json();
      const newCommentData = newCommentResponse as Omit<Comment, 'replies' | 'points' | 'author' | 'createdAt'> & { authorId?: string, authorUsername?: string };

      setComments((prevComments) => [
        ...prevComments,
        {
          ...newCommentData,
          id: newCommentData.id || Date.now().toString(),
          author: { id: user.id, username: user.username },
          points: 0,
          replies: [],
          createdAt: new Date().toISOString(),
        } as Comment,
      ]);
    } catch (err) {
      console.error('Error adding comment:', err);
      throw err; 
    }
  };

  const handleCommentReply = async (parentId: string, text: string) => {
    if (!user?.token || !user.id || !user.username) {
      console.error('User not authenticated or missing details');
      throw new Error('Authentication required to reply.');
    }

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ textContent: text, parentId })
      });

      if (!response.ok) throw new Error('Failed to post reply');

      const newReplyResponse = await response.json();
      const newReplyData = newReplyResponse as Omit<Comment, 'replies' | 'points' | 'author' | 'createdAt'> & { authorId?: string, authorUsername?: string };

      setComments((prevComments) =>
        addReplyToComment(prevComments, parentId, {
          ...newReplyData,
          id: newReplyData.id || Date.now().toString(),
          author: { id: user.id, username: user.username },
          points: 0,
          replies: [],
          createdAt: new Date().toISOString(),
        } as Comment)
      );
    } catch (err) {
      console.error('Error adding reply:', err);
      throw err;
    }
  };

  const addReplyToComment = (commentsList: Comment[], parentId: string, newReply: Comment): Comment[] => {
    return commentsList.map((commentNode) => {
      if (commentNode.id === parentId) {
        return {
          ...commentNode,
          replies: [...(commentNode.replies || []), newReply]
        } as Comment;
      } else if (commentNode.replies && commentNode.replies.length > 0) {
        return {
          ...commentNode,
          replies: addReplyToComment(commentNode.replies, parentId, newReply)
        } as Comment;
      }
      return commentNode;
    });
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !post) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
        <ErrorText className="text-xl mb-4">{error || 'Post not found'}</ErrorText>
        <Link href="/" className="text-primary hover:underline">
          Back to home
        </Link>
      </PageContainer>
    );
  }

  const domain = post.url ? new URL(post.url).hostname.replace(/^www\./, '') : null;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <PageContainer className="py-8">
      <article className="bg-card p-4 sm:p-6 rounded-lg shadow-lg mb-8">
        <Heading as="h1" className="text-2xl sm:text-3xl font-bold mb-2 break-words">
          {post.title}
        </Heading>

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
            <Link href={`/user/${post.author.username}`} className="hover:underline text-primary-foreground">
              {post.author.username}
            </Link>
          </Text>
          <span className="hidden sm:inline">•</span>
          <Text size="sm">{timeAgo}</Text>
          <span className="hidden sm:inline">•</span>
          <Text size="sm">{post.commentCount} comment{post.commentCount !== 1 ? 's' : ''}</Text>
        </FlexContainer>
      </article>

      {postId && typeof postId === 'string' && (
         <div className="mb-8">
           <CommentForm postId={postId} onAddComment={handleAddComment} />
         </div>
      )}

      <section className="bg-card p-4 sm:p-6 rounded-lg shadow-lg">
        <header className="mb-6">
          <Heading as="h2" className="text-xl sm:text-2xl font-semibold">
            Comments {comments.length > 0 && `(${comments.length})`}
          </Heading>
        </header>

        {comments.length === 0 ? (
          <Text emphasis="low" className="text-center py-4">No comments yet. Be the first to comment!</Text>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              // @ts-expect-error TODO: fix this
              <CommentItem postId={postId} key={comment.id} comment={comment} onVote={handleCommentVote} onReply={handleCommentReply} />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
