'use client';

import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

// Types
export interface Post {
  id: string;
  title: string;
  url?: string | null;
  textContent?: string | null;
  type: 'LINK' | 'TEXT';
  author: {
    id: string;
    username: string;
  };
  points: number;
  commentCount: number;
  createdAt: string | Date;
  hasVoted?: boolean | null;
  voteType?: 'UPVOTE' | 'DOWNVOTE' | null;
}

interface PostItemProps {
  post: Post;
  rank?: number;
  onVote?: (postId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => Promise<void>;
}

export default function PostItem({ post, rank, onVote }: PostItemProps) {
  const { user } = useAuth();
  
  // Format the domain from URL if present
  const domain = post.url ? new URL(post.url).hostname.replace(/^www\./, '') : null;
  
  // Format the time since post creation
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  const handleVote = async (voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!user) return;
    if (onVote) {
      await onVote(post.id, voteType);
    }
  };

  return (
    <div className="bg-white rounded-md shadow-sm p-3 mb-3 text-sm">
      <div className="flex items-start">
        {/* Rank number if provided */}
        {rank && (
          <span className="text-gray-500 mr-2 w-5 text-right">{rank}.</span>
        )}
        
        {/* Vote arrow - only show if user is logged in */}
        {user && (
          <div className="flex flex-col items-center mr-2 mt-1">
            <button 
              onClick={() => handleVote('UPVOTE')}
              className={`${post.voteType === 'UPVOTE' ? 'text-orange-600' : 'text-gray-400'} hover:text-orange-500`}
              aria-label="Upvote"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 3.75l7.5 7.5h-4.5v9h-6v-9H4.5l7.5-7.5z" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="flex-1">
          {/* Title and URL */}
          <div className="font-medium">
            {post.url ? (
              <a 
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {post.title}
              </a>
            ) : (
              <Link href={`/post/${post.id}`} className="hover:underline">
                {post.title}
              </Link>
            )}
            
            {domain && (
              <span className="text-gray-500 ml-1 text-xs">
                ({domain})
              </span>
            )}
          </div>
          
          {/* Post metadata */}
          <div className="text-xs text-gray-500 mt-1">
            <span>{post.points} points</span>
            <span className="mx-1">•</span>
            <span>by {post.author.username}</span>
            <span className="mx-1">•</span>
            <span>{timeAgo}</span>
            <span className="mx-1">•</span>
            <Link href={`/post/${post.id}`} className="hover:underline">
              {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 