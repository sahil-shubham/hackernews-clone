'use client';

import React from 'react';
import PostItem, { Post } from './PostItem';
import * as Styled from "@/styles/components"
import { useAuthStore } from '@/hooks/useAuthStore';
interface PostListProps {
  posts: Post[];
  loading?: boolean;
  onVote?: (postId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => Promise<void>;
}

export default function PostList({ posts, loading = false, onVote }: PostListProps) {
  const user = useAuthStore((state) => state.user);

  if (loading) {
    return (
      <div>
        <Styled.PostListContainer>
          {[...Array(10)].map((_, index) => (
            <Styled.LoadingPostItem key={index}>
              <Styled.LoadingPostTitle />
              <Styled.LoadingPostSubtitle />
            </Styled.LoadingPostItem>
          ))}
        </Styled.PostListContainer>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div>
        <Styled.EmptyPostStateContainer>
          <Styled.EmptyPostStateHeading>No posts found</Styled.EmptyPostStateHeading>
          {user && (
            <Styled.EmptyPostStateText>
              Be the first to submit a post!
            </Styled.EmptyPostStateText>
          )}
        </Styled.EmptyPostStateContainer>
      </div>
    );
  }

  return (
    <div>
      <Styled.PostListContainer>
        {posts.map((post, index) => (
          <PostItem 
            key={post.id} 
            post={post} 
            rank={index + 1}
            onVote={onVote}
          />
        ))}
      </Styled.PostListContainer>
    </div>
  );
} 