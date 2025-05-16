'use client';

import React from 'react';
import PostItem, { Post } from './PostItem';
import { useAuth } from '@/hooks/useAuth';
import styled from 'styled-components';

interface PostListProps {
  posts: Post[];
  loading?: boolean;
  onVote?: (postId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => Promise<void>;
}

// Styled Components
const Container = styled.div`
  padding: 0;
`;

const PostListContainer = styled.div`
  margin: 0 auto;
`;

const EmptyStateContainer = styled.div`
  margin: 0 auto;
  text-align: center;
  padding: 2.5rem 0;
`;

const EmptyStateHeading = styled.h3`
  font-size: 1.125rem;
  font-weight: 500;
  color: #6b7280;
`;

const EmptyStateText = styled.p`
  margin-top: 0.5rem;
  color: #9ca3af;
`;

const LoadingItem = styled.div`
  background-color: white;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  padding: 0.75rem;
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

const LoadingTitle = styled.div`
  height: 1.25rem;
  background-color: #e5e7eb;
  border-radius: 0.25rem;
  width: 75%;
  margin-bottom: 0.5rem;
`;

const LoadingSubtitle = styled.div`
  height: 0.75rem;
  background-color: #f3f4f6;
  border-radius: 0.25rem;
  width: 50%;
`;

export default function PostList({ posts, loading = false, onVote }: PostListProps) {
  const { user } = useAuth();

  if (loading) {
    return (
      <Container>
        <PostListContainer>
          {[...Array(10)].map((_, index) => (
            <LoadingItem key={index}>
              <LoadingTitle />
              <LoadingSubtitle />
            </LoadingItem>
          ))}
        </PostListContainer>
      </Container>
    );
  }

  if (posts.length === 0) {
    return (
      <Container>
        <EmptyStateContainer>
          <EmptyStateHeading>No posts found</EmptyStateHeading>
          {user && (
            <EmptyStateText>
              Be the first to submit a post!
            </EmptyStateText>
          )}
        </EmptyStateContainer>
      </Container>
    );
  }

  return (
    <Container>
      <PostListContainer>
        {posts.map((post, index) => (
          <PostItem 
            key={post.id} 
            post={post} 
            rank={index + 1}
            onVote={onVote}
          />
        ))}
      </PostListContainer>
    </Container>
  );
} 