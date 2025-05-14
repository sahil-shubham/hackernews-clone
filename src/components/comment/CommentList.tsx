'use client';

import React from 'react';
import CommentItem, { Comment } from './CommentItem';

interface CommentListProps {
  comments: Comment[];
  postId: string;
  loading?: boolean;
  onVote?: (commentId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => Promise<void>;
  onReply?: (commentId: string, text: string) => Promise<void>;
}

export default function CommentList({ 
  comments, 
  postId,
  loading = false, 
  onVote, 
  onReply 
}: CommentListProps) {
  if (loading) {
    return (
      <div className="py-4">
        <div className="mb-4">
          <div className="h-5 bg-gray-200 rounded w-1/4 mb-4"></div>
        </div>
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white rounded-md p-3 shadow-sm mb-3 animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="py-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium">Comments</h3>
        </div>
        <div className="bg-white rounded-md p-6 text-center text-gray-500">
          No comments yet. Be the first to comment!
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Comments ({comments.length})</h3>
      </div>
      <div className="space-y-3">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onVote={onVote}
            onReply={onReply}
          />
        ))}
      </div>
    </div>
  );
} 