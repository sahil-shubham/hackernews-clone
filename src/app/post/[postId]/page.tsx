'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import styled from 'styled-components';
import CommentForm from '@/components/comment/CommentForm';
import CommentItem, { Comment } from '@/components/comment/CommentItem';
import { 
  PageContainer, 
  Card, 
  Heading, 
  Text, 
  StyledLink,
  ErrorText
} from '@/styles/StyledComponents';

// Styled components for post detail page
const PostCard = styled(Card)`
  padding: ${props => props.theme.space.lg};
`;

const PostTitle = styled(Heading)`
  margin-bottom: ${props => props.theme.space.sm};
`;

const PostUrl = styled.a`
  display: block;
  color: ${props => props.theme.colors.secondary};
  font-size: ${props => props.theme.fontSizes.sm};
  margin-bottom: ${props => props.theme.space.lg};
  
  &:hover {
    text-decoration: underline;
  }
`;

const PostContent = styled.div`
  margin: ${props => props.theme.space.lg} 0;
  color: ${props => props.theme.colors.secondaryDark};
`;

const PreformattedText = styled.p`
  white-space: pre-line;
`;

const PostMeta = styled.div`
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.secondary};
  margin-top: ${props => props.theme.space.lg};
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.space.xs};
`;

const MetaSeparator = styled.span`
  margin: 0 ${props => props.theme.space.xs};
`;

const CommentsSection = styled.div`
  padding: ${props => props.theme.space.lg} 0;
`;

const CommentsSectionHeader = styled.div`
  margin-bottom: ${props => props.theme.space.lg};
`;

const CommentsHeading = styled.h3`
  font-size: ${props => props.theme.fontSizes.lg};
  font-weight: ${props => props.theme.fontWeights.medium};
`;

const CommentsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
`;

const NoCommentsMessage = styled.div`
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.radii.md};
  padding: ${props => props.theme.space.xl};
  text-align: center;
  color: ${props => props.theme.colors.secondary};
`;

const ErrorContainer = styled.div`
  background-color: #fee2e2;
  border: 1px solid ${props => props.theme.colors.error};
  color: ${props => props.theme.colors.error};
  padding: ${props => props.theme.space.md};
  border-radius: ${props => props.theme.radii.md};
  margin-bottom: ${props => props.theme.space.lg};
`;

const LoadingContainer = styled(PostCard)`
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

const LoadingTitle = styled.div`
  height: 1.5rem;
  background-color: #e5e7eb;
  border-radius: ${props => props.theme.radii.sm};
  width: 75%;
  margin-bottom: ${props => props.theme.space.lg};
`;

const LoadingSubtitle = styled.div`
  height: 1rem;
  background-color: #f3f4f6;
  border-radius: ${props => props.theme.radii.sm};
  width: 50%;
  margin-bottom: ${props => props.theme.space.xl};
`;

const LoadingContent = styled.div`
  height: 6rem;
  background-color: #f3f4f6;
  border-radius: ${props => props.theme.radii.sm};
  margin-bottom: ${props => props.theme.space.lg};
`;

export default function PostDetailPage() {
  const { postId } = useParams();
  const { user, token } = useAuth();
  
  const [post, setPost] = useState<any | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch post and comments
  useEffect(() => {
    const fetchPostAndComments = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const headers: HeadersInit = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        // Fetch post details
        const postResponse = await fetch(`/api/posts/${postId}`, {
          headers,
        });
        
        if (!postResponse.ok) {
          throw new Error('Failed to fetch post');
        }
        
        const postData = await postResponse.json();
        setPost(postData);
        
        // Fetch comments
        const commentsResponse = await fetch(`/api/posts/${postId}/comments`, {
          headers,
        });
        
        if (!commentsResponse.ok) {
          throw new Error('Failed to fetch comments');
        }
        
        const commentsData = await commentsResponse.json();
        setComments(commentsData.comments);
      } catch (err) {
        console.error('Error fetching post details:', err);
        setError('Failed to load post. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (postId) {
      fetchPostAndComments();
    }
  }, [postId, token]);
  
  // Handle comment voting
  const handleCommentVote = async (commentId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!user || !token) return;
    
    try {
      const response = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ voteType }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to vote on comment');
      }
      
      // Update comment in the UI
      setComments(prevComments => updateCommentVote(prevComments, commentId, voteType));
    } catch (err) {
      console.error('Error voting on comment:', err);
    }
  };
  
  // Update comment vote in UI
  const updateCommentVote = (comments: Comment[], commentId: string, voteType: 'UPVOTE' | 'DOWNVOTE'): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        // If user already voted with the same vote type, we're removing the vote
        return {
          ...comment,
          points: comment.voteType === voteType ? comment.points - 1 : comment.points + 1,
          voteType: comment.voteType === voteType ? null : voteType,
          hasVoted: comment.voteType !== voteType,
        };
      } else if (comment.replies && comment.replies.length > 0) {
        // Check in replies recursively
        return {
          ...comment,
          replies: updateCommentVote(comment.replies, commentId, voteType),
        };
      }
      return comment;
    });
  };
  
  // Add new comment
  const handleAddComment = async (text: string) => {
    if (!user || !token) return;
    
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ textContent: text }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to post comment');
      }
      
      const newComment = await response.json();
      
      // Add new comment to the UI
      setComments(prevComments => [
        ...prevComments,
        {
          ...newComment,
          points: 0,
          replies: [],
        },
      ]);
    } catch (err) {
      console.error('Error adding comment:', err);
      throw err;
    }
  };
  
  // Handle comment reply
  const handleCommentReply = async (parentId: string, text: string) => {
    if (!user || !token) return;
    
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          textContent: text,
          parentId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to post reply');
      }
      
      const newComment = await response.json();
      
      // Add reply to the UI
      setComments(prevComments => addReplyToComment(prevComments, parentId, {
        ...newComment,
        points: 0,
        replies: [],
      }));
    } catch (err) {
      console.error('Error adding reply:', err);
      throw err;
    }
  };
  
  // Add reply to comment recursively
  const addReplyToComment = (comments: Comment[], parentId: string, newReply: Comment): Comment[] => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply],
        };
      } else if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: addReplyToComment(comment.replies, parentId, newReply),
        };
      }
      return comment;
    });
  };
  
  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <LoadingContainer>
          <LoadingTitle />
          <LoadingSubtitle />
          <LoadingContent />
        </LoadingContainer>
      </PageContainer>
    );
  }
  
  // Error state
  if (error || !post) {
    return (
      <PageContainer>
        <ErrorContainer>
          {error || 'Post not found'}
        </ErrorContainer>
        <StyledLink href="/">
          Back to home
        </StyledLink>
      </PageContainer>
    );
  }
  
  // Format the domain from URL if present
  const domain = post.url ? new URL(post.url).hostname.replace(/^www\./, '') : null;
  
  // Format the time since post creation
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  
  return (
    <PageContainer>
      {/* Post details */}
      <PostCard>
        <PostTitle level={1}>{post.title}</PostTitle>
        
        {post.url && (
          <PostUrl 
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {domain && `(${domain})`}
          </PostUrl>
        )}
        
        {post.textContent && (
          <PostContent>
            <PreformattedText>{post.textContent}</PreformattedText>
          </PostContent>
        )}
        
        <PostMeta>
          <span>{post.points} points</span>
          <MetaSeparator>•</MetaSeparator>
          <span>by {post.author.username}</span>
          <MetaSeparator>•</MetaSeparator>
          <span>{timeAgo}</span>
          <MetaSeparator>•</MetaSeparator>
          <span>{post.commentCount} comments</span>
        </PostMeta>
      </PostCard>
      
      {/* Comment form */}
      <CommentForm postId={postId as string} onAddComment={handleAddComment} />
      
      {/* Display comments */}
      <CommentsSection>
        <CommentsSectionHeader>
          <CommentsHeading>Comments {comments.length > 0 && `(${comments.length})`}</CommentsHeading>
        </CommentsSectionHeader>
        
        {comments.length === 0 ? (
          <NoCommentsMessage>
            No comments yet. Be the first to comment!
          </NoCommentsMessage>
        ) : (
          <CommentsContainer>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onVote={handleCommentVote}
                onReply={handleCommentReply}
              />
            ))}
          </CommentsContainer>
        )}
      </CommentsSection>
    </PageContainer>
  );
} 