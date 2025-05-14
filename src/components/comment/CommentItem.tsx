'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

export interface Comment {
  id: string;
  textContent: string;
  author: {
    id: string;
    username: string;
  };
  createdAt: string | Date;
  points: number;
  voteType?: 'UPVOTE' | 'DOWNVOTE' | null;
  hasVoted?: boolean | null;
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  onVote?: (commentId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => Promise<void>;
  onReply?: (commentId: string, text: string) => Promise<void>;
  depth?: number;
  maxDepth?: number;
}

export default function CommentItem({ 
  comment, 
  onVote, 
  onReply,
  depth = 0,
  maxDepth = 5
}: CommentItemProps) {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
  
  const handleVote = async (voteType: 'UPVOTE' | 'DOWNVOTE') => {
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
    <div className={`pt-2 ${depth > 0 ? 'pl-3 md:pl-5 border-l border-gray-200' : ''}`}>
      <div className="bg-white rounded-md p-3 shadow-sm">
        {/* Comment header */}
        <div className="flex items-center text-xs text-gray-500">
          <span className="font-medium text-gray-700">{comment.author.username}</span>
          <span className="mx-1">•</span>
          <span>{timeAgo}</span>
        </div>
        
        {/* Comment content */}
        <div className="mt-1">
          <p className="text-sm">{comment.textContent}</p>
        </div>
        
        {/* Comment actions */}
        <div className="mt-2 flex items-center text-xs text-gray-500">
          <div className="flex items-center mr-3">
            {user && (
              <button 
                onClick={() => handleVote('UPVOTE')}
                className={`mr-1 ${comment.voteType === 'UPVOTE' ? 'text-orange-600' : 'text-gray-400'} hover:text-orange-500`}
                aria-label="Upvote"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M12 4l-8 8h5v8h6v-8h5l-8-8z" />
                </svg>
              </button>
            )}
            <span>{comment.points} point{comment.points !== 1 && 's'}</span>
          </div>
          
          {user && onReply && (
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="mr-3 hover:text-gray-700"
            >
              {isReplying ? 'Cancel' : 'Reply'}
            </button>
          )}
        </div>
        
        {/* Reply form */}
        {isReplying && (
          <form onSubmit={handleReply} className="mt-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm"
              rows={3}
              placeholder="Write your reply..."
              required
            />
            <div className="mt-2">
              <button
                type="submit"
                disabled={isSubmittingReply || !replyText.trim()}
                className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 disabled:bg-orange-300"
              >
                {isSubmittingReply ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </div>
      
      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && depth < maxDepth && (
        <div className="mt-2">
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
        </div>
      )}
    </div>
  );
} 