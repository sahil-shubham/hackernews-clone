'use client';

import React from 'react';
import CommentItem from './CommentItem';
import type { Comment } from '@/types/comment';
import styled from 'styled-components';

interface CommentListProps {
  comments: Comment[];
  postId: string;
  loading?: boolean;
  onVote?: (commentId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => Promise<void>;
  onReply?: (commentId: string, text: string) => Promise<void>;
}

// Styled Components
const Container = styled.div`
  padding: 1rem 0;
`;

const SectionHeading = styled.div`
  margin-bottom: 1rem;
`;

const Heading = styled.h3`
  font-size: 1.125rem;
  font-weight: 500;
`;

const CommentsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const EmptyState = styled.div`
  background-color: white;
  border-radius: 0.375rem;
  padding: 1.5rem;
  text-align: center;
  color: #6b7280;
`;

const LoadingPlaceholder = styled.div`
  height: 1.25rem;
  background-color: #e5e7eb;
  border-radius: 0.25rem;
  width: 25%;
  margin-bottom: 1rem;
`;

const LoadingComment = styled.div`
  background-color: white;
  border-radius: 0.375rem;
  padding: 0.75rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-bottom: 0.75rem;
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

const LoadingHeader = styled.div`
  height: 0.75rem;
  background-color: #e5e7eb;
  border-radius: 0.25rem;
  width: 25%;
  margin-bottom: 0.5rem;
`;

const LoadingBody = styled.div`
  height: 1rem;
  background-color: #f3f4f6;
  border-radius: 0.25rem;
  width: 75%;
  margin-bottom: 0.5rem;
`;

const LoadingBodyShort = styled(LoadingBody)`
  width: 50%;
`;

export default function CommentList({ 
  comments, 
  postId,
  loading = false, 
  onVote, 
  onReply 
}: CommentListProps) {
  if (loading) {
    return (
      <Container>
        <SectionHeading>
          <LoadingPlaceholder />
        </SectionHeading>
        {[...Array(3)].map((_, index) => (
          <LoadingComment key={index}>
            <LoadingHeader />
            <LoadingBody />
            <LoadingBodyShort />
          </LoadingComment>
        ))}
      </Container>
    );
  }

  if (comments.length === 0) {
    return (
      <Container>
        <SectionHeading>
          <Heading>Comments</Heading>
        </SectionHeading>
        <EmptyState>
          No comments yet. Be the first to comment!
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <SectionHeading>
        <Heading>Comments ({comments.length})</Heading>
      </SectionHeading>
      <CommentsContainer>
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onVote={onVote}
            onReply={onReply}
          />
        ))}
      </CommentsContainer>
    </Container>
  );
} 