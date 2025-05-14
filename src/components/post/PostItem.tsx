'use client';

import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import styled from 'styled-components';

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

// Styled Components
const PostContainer = styled.div`
  background-color: white;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
`;

const PostContent = styled.div`
  display: flex;
  align-items: flex-start;
`;

const RankNumber = styled.span`
  color: #6b7280;
  margin-right: 0.5rem;
  width: 1.25rem;
  text-align: right;
`;

const VoteContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 0.5rem;
  margin-top: 0.25rem;
`;

const VoteButton = styled.button<{ active: boolean }>`
  color: ${props => props.active ? '#ea580c' : '#9ca3af'};
  &:hover {
    color: #f97316;
  }
`;

const PostDetails = styled.div`
  flex: 1;
`;

const PostTitle = styled.div`
  font-weight: 500;
`;

const TitleLink = styled.a`
  &:hover {
    text-decoration: underline;
  }
`;

const StyledLink = styled(Link)`
  &:hover {
    text-decoration: underline;
  }
`;

const Domain = styled.span`
  color: #6b7280;
  margin-left: 0.25rem;
  font-size: 0.75rem;
`;

const MetadataContainer = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const MetadataSeparator = styled.span`
  margin: 0 0.25rem;
`;

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
    <PostContainer>
      <PostContent>
        {/* Rank number if provided */}
        {rank && (
          <RankNumber>{rank}.</RankNumber>
        )}
        
        {/* Vote arrow - only show if user is logged in */}
        {user && (
          <VoteContainer>
            <VoteButton 
              onClick={() => handleVote('UPVOTE')}
              active={post.voteType === 'UPVOTE'}
              aria-label="Upvote"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M12 3.75l7.5 7.5h-4.5v9h-6v-9H4.5l7.5-7.5z" />
              </svg>
            </VoteButton>
          </VoteContainer>
        )}
        
        <PostDetails>
          {/* Title and URL */}
          <PostTitle>
            {post.url ? (
              <TitleLink 
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {post.title}
              </TitleLink>
            ) : (
              <StyledLink href={`/post/${post.id}`}>
                {post.title}
              </StyledLink>
            )}
            
            {domain && (
              <Domain>
                ({domain})
              </Domain>
            )}
          </PostTitle>
          
          {/* Post metadata */}
          <MetadataContainer>
            <span>{post.points} points</span>
            <MetadataSeparator>•</MetadataSeparator>
            <span>by {post.author.username}</span>
            <MetadataSeparator>•</MetadataSeparator>
            <span>{timeAgo}</span>
            <MetadataSeparator>•</MetadataSeparator>
            <StyledLink href={`/post/${post.id}`}>
              {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
            </StyledLink>
          </MetadataContainer>
        </PostDetails>
      </PostContent>
    </PostContainer>
  );
} 