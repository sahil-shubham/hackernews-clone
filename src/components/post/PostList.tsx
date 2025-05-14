'use client';

import React from 'react';
import PostItem, { Post } from './PostItem';
import { useAuth } from '@/hooks/useAuth';

interface PostListProps {
  posts: Post[];
  loading?: boolean;
  onVote?: (postId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => Promise<void>;
}

export default function PostList({ posts, loading = false, onVote }: PostListProps) {
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-3xl mx-auto">
          {[...Array(10)].map((_, index) => (
            <div key={index} className="bg-white rounded-md shadow-sm p-3 mb-3 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-6">
        <div className="max-w-3xl mx-auto text-center py-10">
          <h3 className="text-lg font-medium text-gray-500">No posts found</h3>
          {user && (
            <p className="mt-2 text-gray-400">
              Be the first to submit a post!
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="max-w-3xl mx-auto">
        {posts.map((post, index) => (
          <PostItem 
            key={post.id} 
            post={post} 
            rank={index + 1}
            onVote={onVote}
          />
        ))}
      </div>
    </div>
  );
} 