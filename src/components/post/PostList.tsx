'use client';

import React from 'react';
import PostItem from './PostItem';
import type { Post } from '@/types/post';
// import { Button } from '@/components/ui/Button'; // If pagination buttons are needed here

interface PostListProps {
  posts: Post[];
  onVote: (postId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => Promise<void>;
  // handleDeletePost?: (postId: string) => void; // If delete is handled at list level
  // handleUpdatePost?: (updatedPost: Post) => void; // If updates are handled at list level
  // showRank?: boolean; // To control if rank is shown, default to true
}

const PostList: React.FC<PostListProps> = ({ posts, onVote /*, handleDeletePost, handleUpdatePost, showRank = true */ }) => {
  if (!posts || posts.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No posts to display.</p>;
  }

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <PostItem
          key={post.id}
          post={post}
          index={index} // Pass index for ranking
          onVote={onVote}
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