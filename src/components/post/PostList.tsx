'use client';

import React, { useState } from 'react';
import PostItem from './PostItem';
import type { Post as PostType } from '@/types/post';
// import { Button } from '@/components/ui/Button'; // If pagination buttons are needed here

interface PostListProps {
  posts: PostType[];
  onVote: (postId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => Promise<void>;
}

const PostList: React.FC<PostListProps> = ({ posts, onVote /*, handleDeletePost, handleUpdatePost, showRank = true */ }) => {
  const [expandedPostIds, setExpandedPostIds] = useState<Set<string>>(new Set());

  const handleToggleExpand = (postId: string) => {
    setExpandedPostIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  if (!posts || posts.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No posts to display.</p>;
  }

  return (
    <div>
      {posts.map((post, index) => (
        <PostItem
          key={post.id}
          post={post}
          onVote={onVote}
          isExpanded={expandedPostIds.has(post.id)}
          onToggleExpand={handleToggleExpand}
          // onDeletePost={handleDeletePost} // Pass through if needed
          // onUpdatePost={handleUpdatePost} // Pass through if needed
        />
      ))}
      {/* Pagination controls could go here */}
      {/* Example:
      <div className="flex justify-center mt-8">
        <Button variant="outline" className="mr-2">Previous</Button>
        <Button variant="outline">Next</Button>
      </div>
      */}
    </div>
  );
};

export default PostList; 