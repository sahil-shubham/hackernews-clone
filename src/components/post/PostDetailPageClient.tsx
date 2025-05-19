'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore, type User } from '@/hooks/useAuthStore';
import CommentForm from '@/components/comment/CommentForm';
import CommentItem from '@/components/comment/CommentItem'; // Assuming this will be refactored to Tailwind
import { PageContainer, FlexContainer } from '@/components/ui/layout';
import { Heading, Text, ErrorText } from '@/components/ui/typography';
import { Button } from '@/components/ui/Button'; // Assuming Button is needed
import type { Vote } from '@/types/vote';
import type { Comment as CommentType } from '@/types/comment'; // Renamed to avoid conflict
import type { Post as PostType } from '@/types/post'; // Renamed to avoid conflict

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
  postId,
}: PostDetailPageClientProps) {
  const { user: authStoreUser } = useAuthStore(); // Get user from store for dynamic updates if needed
  // currentUser prop is the source of truth on initial load from server.
  // authStoreUser can be used if we expect client-side login/logout to affect this page dynamically without full reload.
  const effectiveUser = currentUser; // Or some logic to prefer authStoreUser if it has changed

  const [post, setPost] = useState<PostType | null>(initialPost);
  const [comments, setComments] = useState<CommentType[]>(initialComments);
  // Error/loading state for client-side actions like submitting comment can be local here
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  // Placeholder for handleCommentVote - to be reimplemented
  const handleCommentVote = async (commentId: string, voteType: Vote['voteType']) => {
    if (!effectiveUser?.token) {
      setActionError('You must be logged in to vote.');
      return;
    }
    console.log(`Voting on comment ${commentId} with ${voteType}`);
    // Actual API call and optimistic update logic will go here
    // Similar to what was in the original page.tsx
    try {
      const response = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveUser.token}`,
        },
        body: JSON.stringify({ voteType }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to vote on comment' }));
        throw new Error(errorData.message);
      }
      // Optimistically update UI or re-fetch comments if necessary
      // For now, just log and let server state eventually propagate or manually refetch
      const updatedVoteData = await response.json();
      setComments(prevComments => updateCommentVoteState(prevComments, commentId, updatedVoteData.voteType, updatedVoteData.points));

    } catch (err: any) {
      setActionError(err.message || 'Failed to vote on comment.');
      console.error('Error voting on comment:', err);
    }
  };

  const updateCommentVoteState = (
    commentsList: CommentType[], 
    commentId: string, 
    newVoteType: Vote['voteType'] | null,
    newPoints: number
  ): CommentType[] => {
    return commentsList.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, voteType: newVoteType, points: newPoints, hasVoted: !!newVoteType };
      }
      if (comment.replies && comment.replies.length > 0) {
        return { ...comment, replies: updateCommentVoteState(comment.replies, commentId, newVoteType, newPoints) };
      }
      return comment;
    });
  };

  // Placeholder for handleAddComment - to be reimplemented
  const handleAddComment = async (text: string) => {
    if (!effectiveUser?.id || !effectiveUser?.username || !effectiveUser?.token) {
      setActionError('You must be logged in to comment.');
      return;
    }
    setIsSubmittingComment(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveUser.token}`,
        },
        body: JSON.stringify({ textContent: text }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to post comment' }));
        throw new Error(errorData.message);
      }
      const newComment = await response.json();
      // Add comment to local state (optimistic update or based on response)
      setComments(prevComments => [...prevComments, newComment.comment]); // Assuming API returns { comment: ... }
    } catch (err: any) {
      setActionError(err.message || 'Failed to post comment.');
      console.error('Error adding comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  // Placeholder for handleCommentReply - to be reimplemented
  const handleCommentReply = async (parentId: string, text: string) => {
    if (!effectiveUser?.id || !effectiveUser?.username || !effectiveUser?.token) {
      setActionError('You must be logged in to reply.');
      return;
    }
    setIsSubmittingComment(true); // Consider separate loading state for replies if needed
    setActionError(null);
    console.log(`Replying to comment ${parentId} with text: ${text}`);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveUser.token}`,
        },
        body: JSON.stringify({ textContent: text, parentId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to post reply' }));
        throw new Error(errorData.message);
      }
      const newReply = await response.json();
      setComments(prevComments => addReplyToCommentState(prevComments, parentId, newReply.comment));
    } catch (err: any) {
      setActionError(err.message || 'Failed to post reply.');
      console.error('Error adding reply:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const addReplyToCommentState = (commentsList: CommentType[], parentId: string, newReply: CommentType): CommentType[] => {
    return commentsList.map(comment => {
      if (comment.id === parentId) {
        return { ...comment, replies: [...(comment.replies || []), newReply] };
      }
      if (comment.replies && comment.replies.length > 0) {
        return { ...comment, replies: addReplyToCommentState(comment.replies, parentId, newReply) };
      }
      return comment;
    });
  };

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
    );
  }

  const domain = post.url ? new URL(post.url).hostname.replace(/^www\./, '') : null;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  // The JSX from the original page.tsx will be moved here and adapted.
  // For brevity, this is a simplified structure.
  return (
    <PageContainer className="py-8">
      <article className="bg-card p-4 sm:p-6 rounded-lg shadow-md mb-8 border border-border">
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
            <Link href={`/user/${post.author.username}`} className="hover:underline text-foreground/80">
              {post.author.username}
            </Link>
          </Text>
          <span className="hidden sm:inline">•</span>
          <Text size="sm">{timeAgo}</Text>
          <span className="hidden sm:inline">•</span>
          <Text size="sm">{post.commentCount} comment{post.commentCount !== 1 ? 's' : ''}</Text>
        </FlexContainer>
      </article>

      {effectiveUser && postId && (
         <div className="mb-8">
           <CommentForm 
             postId={postId} 
             onAddComment={handleAddComment} 
             isSubmitting={isSubmittingComment} 
             error={actionError} 
           />
         </div>
      )}
      {!effectiveUser && <Text className="mb-8 text-center text-muted-foreground">Please <Link href={`/login?next=/post/${postId}`} className="text-primary hover:underline">login</Link> to comment.</Text>}

      <section className="bg-card p-4 sm:p-6 rounded-lg shadow-md border border-border">
        <header className="mb-6">
          <Heading as="h2" className="text-xl sm:text-2xl font-semibold">
            Comments {comments.length > 0 && `(${comments.length})`}
          </Heading>
        </header>

        {actionError && !isSubmittingComment && (
          <ErrorText className="mb-4">{actionError}</ErrorText>
        )}

        {comments.length === 0 ? (
          <Text emphasis="low" className="text-center py-4">No comments yet. Be the first to comment!</Text>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem 
                postId={postId} 
                key={comment.id} 
                comment={comment} 
                onVote={handleCommentVote} 
                onReply={handleCommentReply} 
                currentUser={effectiveUser} // Pass current user for reply/vote enable/disable in CommentItem
                // We'll need to ensure CommentItem is also refactored and can handle these props
              />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
} 