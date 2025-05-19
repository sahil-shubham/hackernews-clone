'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/hooks/useAuthStore';
import styled from 'styled-components';
import type { Comment } from '@/types/comment';
import type { Vote } from '@/types/vote';

interface CommentItemProps {
  comment: Comment;
  onVote?: (commentId: string, voteType: Vote['voteType']) => Promise<void>;
  onReply?: (commentId: string, text: string) => Promise<void>;
  depth?: number;
  maxDepth?: number;
}

// Styled Components
const CommentContainer = styled.div<{ depth: number }>`
  padding-top: 0.5rem;
  ${props => props.depth > 0 && `
    padding-left: 0.75rem;
    border-left: 1px solid #e5e7eb;
    
    @media (min-width: 768px) {
      padding-left: 1.25rem;
    }
  `}
`;

const CommentCard = styled.div`
  background-color: white;
  border-radius: 0.375rem;
  padding: 0.75rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: #6b7280;
`;

const AuthorName = styled.span`
  font-weight: 500;
  color: #374151;
`;

const Separator = styled.span`
  margin: 0 0.25rem;
`;

const CommentContent = styled.div`
  margin-top: 0.25rem;
`;

const CommentText = styled.p`
  font-size: 0.875rem;
`;

const CommentActions = styled.div`
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: #6b7280;
`;

const VoteContainer = styled.div`
  display: flex;
  align-items: center;
  margin-right: 0.75rem;
`;

const VoteButton = styled.button<{ active: boolean }>`
  margin-right: 0.25rem;
  color: ${props => props.active ? '#ea580c' : '#9ca3af'};
  &:hover {
    color: #f97316;
  }
`;

const ActionButton = styled.button`
  margin-right: 0.75rem;
  &:hover {
    color: #374151;
  }
`;

const ReplyForm = styled.form`
  margin-top: 0.75rem;
`;

const ReplyTextArea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;
`;

const ReplySubmitButton = styled.button<{ disabled: boolean }>`
  margin-top: 0.5rem;
  padding: 0.25rem 0.75rem;
  background-color: ${props => props.disabled ? '#fdba74' : '#ea580c'};
  color: white;
  font-size: 0.75rem;
  border-radius: 0.25rem;
  &:hover {
    background-color: ${props => props.disabled ? '#fdba74' : '#c2410c'};
  }
`;

const NestedReplies = styled.div`
  margin-top: 0.5rem;
`;

export default function CommentItem({ 
  comment, 
  onVote, 
  onReply,
  depth = 0,
  maxDepth = 5
}: CommentItemProps) {
  const user = useAuthStore((state) => state.user);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
  
  const handleVote = async (voteType: Vote['voteType']) => {
    if (!user || !onVote) return;
    await onVote(comment.id, voteType);
  };
  
  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !onReply || !replyText.trim()) return;
    
    try {
      setIsSubmittingReply(true);
      await onReply(comment.id, replyText);
      setReplyText('');
      setIsReplying(false);
    } finally {
      setIsSubmittingReply(false);
    }
  };
  
  return (
    <CommentContainer depth={depth}>
      <CommentCard>
        {/* Comment header */}
        <CommentHeader>
          <AuthorName>{comment.author.username}</AuthorName>
          <Separator>•</Separator>
          <span>{timeAgo}</span>
        </CommentHeader>
        
        {/* Comment content */}
        <CommentContent>
          <CommentText>{comment.textContent}</CommentText>
        </CommentContent>
        
        {/* Comment actions */}
        <CommentActions>
          <VoteContainer>
            {user && (
              <VoteButton 
                onClick={() => handleVote('UPVOTE')}
                active={comment.voteType === 'UPVOTE'}
                aria-label="Upvote"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M12 4l-8 8h5v8h6v-8h5l-8-8z" />
                </svg>
              </VoteButton>
            )}
            <span>{comment.points} point{comment.points !== 1 && 's'}</span>
          </VoteContainer>
          
          {user && onReply && (
            <ActionButton onClick={() => setIsReplying(!isReplying)}>
              {isReplying ? 'Cancel' : 'Reply'}
            </ActionButton>
          )}
        </CommentActions>
        
        {/* Reply form */}
        {isReplying && (
          <ReplyForm onSubmit={handleReply}>
            <ReplyTextArea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
              placeholder="Write your reply..."
              required
            />
            <div>
              <ReplySubmitButton
                type="submit"
                disabled={isSubmittingReply || !replyText.trim()}
              >
                {isSubmittingReply ? 'Submitting...' : 'Submit'}
              </ReplySubmitButton>
            </div>
          </ReplyForm>
        )}
      </CommentCard>
      
      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && depth < maxDepth && (
        <NestedReplies>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onVote={onVote}
              onReply={onReply}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </NestedReplies>
      )}
    </CommentContainer>
  );
} 