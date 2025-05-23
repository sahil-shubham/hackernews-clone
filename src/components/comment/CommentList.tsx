import React from 'react';
import CommentItem from './CommentItem';
import type { Comment as CommentType } from '@/types/comment';
import { Text } from '@/components/ui/typography';
import { User } from '@/lib/authUtils';

interface CommentListProps {
  comments: CommentType[];
  postId: string;
  currentUser: User | null;
  loading?: boolean;
}

const LoadingCommentSkeleton = () => (
  <div className="bg-card p-3 rounded-md shadow-sm animate-pulse mb-3">
    <div className="h-3.5 bg-muted rounded w-1/4 mb-2"></div>
    <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
    <div className="h-4 bg-muted rounded w-1/2"></div>
  </div>
);

export default function CommentList({ 
  comments, 
  postId,
  currentUser,
  loading = false, 
}: CommentListProps) {
  if (loading) {
    return (
      <div className="py-4">
        <div className="mb-6">
          <div className="h-5 bg-muted rounded w-1/3 animate-pulse"></div>
        </div>
        <div>
          {[...Array(3)].map((_, index) => (
            <LoadingCommentSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      {comments.length === 0 ? (
        <div className="bg-card border border-dashed border-border p-6 rounded-md text-center">
          <Text emphasis="low">No comments yet. Be the first to comment!</Text>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
} 