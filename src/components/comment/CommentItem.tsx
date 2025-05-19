'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronUp, ChevronDown, MessageCircle, PlusSquare, MinusSquare } from 'lucide-react'; // Added PlusSquare, MinusSquare
import type { Comment as CommentType } from '@/types/comment'; // Renamed to avoid conflict
import type { Vote } from '@/types/vote';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/typography';
import { FlexContainer } from '@/components/ui/layout';
import CommentForm from './CommentForm'; // For inline replies
import { User } from '@/lib/authUtils'; // Added

interface CommentItemProps {
  comment: CommentType;
  postId: string; // Added postId
  // Expect onVote to handle API call and potentially return updated comment or just handle UI updates in parent
  onVote?: (commentId: string, voteType: Vote['voteType']) => Promise<void>; 
  onReply?: (parentId: string, text: string, postId: string) => Promise<void>; // Added postId to onReply
  depth?: number;
  maxDepth?: number;
  currentUser: User | null; // Added
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  postId, // Destructure postId
  onVote, 
  onReply,
  depth = 0,
  maxDepth = 5, // Default max depth to prevent infinite recursion issues
  currentUser // Added
}) => {
  const user = currentUser; // Use the passed prop
  const [isReplying, setIsReplying] = useState(false);
  
  // Optimistic state for voting (visual feedback only, parent responsible for actual data update)
  const [currentVote, setCurrentVote] = useState(comment.voteType || null);
  const [displayPoints, setDisplayPoints] = useState(comment.points);
  const [isCollapsed, setIsCollapsed] = useState(false); // New state for collapsing

  useEffect(() => {
    setCurrentVote(comment.voteType || null);
    setDisplayPoints(comment.points);
  }, [comment.voteType, comment.points]);

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
  
  const handleToggleCollapse = () => {
    if (comment.replies && comment.replies.length > 0) {
      setIsCollapsed(!isCollapsed);
    }
  };
  
  const handleVoteOptimistic = async (voteDirection: 'UPVOTE' | 'DOWNVOTE') => {
    if (!user || !onVote) return;

    const previousVote = currentVote;
    const previousPoints = displayPoints;

    let newVote = currentVote;
    let newPoints = displayPoints;

    if (currentVote === voteDirection) { // Undoing vote
      newVote = null;
      newPoints = previousPoints + (voteDirection === 'UPVOTE' ? -1 : 1);
    } else { // New vote or switching vote
      newVote = voteDirection;
      if (previousVote) { // Switching vote
        newPoints = previousPoints + (voteDirection === 'UPVOTE' ? 2 : -2);
      } else { // New vote
        newPoints = previousPoints + (voteDirection === 'UPVOTE' ? 1 : -1);
      }
    }
    setCurrentVote(newVote);
    setDisplayPoints(newPoints);

    try {
      await onVote(comment.id, voteDirection);
      // Parent should re-fetch/update and new props will flow down
    } catch (error) {
      // Revert optimistic update on error
      setCurrentVote(previousVote);
      setDisplayPoints(previousPoints);
      alert('Vote failed. Please try again.');
    }
  };
  
  const handleReplySubmit = async (text: string) => {
    if (!user || !onReply || !text.trim()) return;
    
    try {
      await onReply(comment.id, text, postId); // Pass postId to onReply
      setIsReplying(false);
    } catch (error) {
      console.error("Failed to submit reply:", error);
      alert("Failed to submit reply. Please try again.");
      // Potentially keep reply form open with text
    }
  };
  
  const canCollapse = depth > 0 && comment.replies && comment.replies.length > 0;
  const containerPaddingClass = depth > 0 ? (depth === 1 ? 'pl-4 md:pl-6' : 'pl-3 md:pl-4') : '';
  const borderClass = depth > 0 ? `border-l-2 ${canCollapse ? 'border-primary hover:border-primary/70 cursor-pointer' : 'border-border'}` : '';

  return (
    <div 
      className={`py-1 relative ${containerPaddingClass} ${borderClass}`}
      onClick={canCollapse ? handleToggleCollapse : undefined} // Click on the bordered area to collapse
    >
      {/* Clickable area for collapsing - overlaying the border. Alternative to clicking the whole div. */}
      {/* {canCollapse && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-4 cursor-pointer z-10" 
          onClick={handleToggleCollapse}
          title={isCollapsed ? "Expand thread" : "Collapse thread"}
        ></div>
      )} */}
      <div className={`bg-card p-3 rounded-md shadow-sm border border-border ${isCollapsed ? 'opacity-70 hover:opacity-100' : ''}`}>
        <FlexContainer align="center" className="text-xs text-muted-foreground mb-1.5">
          {canCollapse && (
            <button onClick={handleToggleCollapse} className="mr-1 p-0.5 rounded hover:bg-muted focus:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              {isCollapsed ? <PlusSquare size={14} /> : <MinusSquare size={14} />}
            </button>
          )}
          <Text size="sm" className="font-semibold text-foreground mr-1.5">{comment.author.username}</Text>
          <span>•</span>
          <Text size="sm" emphasis="low" className="ml-1.5 text-xs">
            {timeAgo} {isCollapsed && comment.replies && comment.replies.length > 0 ? `[${comment.replies.length} hidden]` : ''}
          </Text>
        </FlexContainer>
        
        {!isCollapsed && (
          <>
            <div className="text-sm text-foreground mb-2 whitespace-pre-wrap break-words">
              {comment.textContent}
            </div>
            
            <FlexContainer align="center" className="text-xs text-muted-foreground">
              {user && onVote && (
                <FlexContainer align="center" className="mr-4">
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={() => handleVoteOptimistic('UPVOTE')}
                    aria-label="Upvote comment"
                    className={`p-0.5 h-auto rounded ${currentVote === 'UPVOTE' ? 'text-primary' : 'hover:text-primary'}`}
                  >
                    <ChevronUp size={16} strokeWidth={currentVote === 'UPVOTE' ? 3 : 2} />
                  </Button>
                  <Text size="sm" className={`font-medium tabular-nums mx-1 text-xs ${currentVote ? 'text-foreground' : ''}`}>{displayPoints}</Text>
                  {/* No downvote for comments for now, to simplify. Can be added if needed. */}
                </FlexContainer>
              )}
              {!user && onVote && (
                <Text size="sm" className="mr-4 tabular-nums text-xs">{displayPoints} {comment.points !== 1 ? 'points' : 'point'}</Text>
              )}
              
              {user && onReply && depth < maxDepth && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsReplying(!isReplying)}
                  className="p-1 h-auto text-xs flex items-center"
                >
                  <MessageCircle size={14} className="mr-1" />
                  {isReplying ? 'Cancel' : 'Reply'}
                </Button>
              )}
            </FlexContainer>
            
            {isReplying && onReply && currentUser && (
              <div className="mt-3">
                <CommentForm 
                  postId={postId}
                  user={currentUser} // Pass currentUser to CommentForm
                  onAddComment={handleReplySubmit} 
                  placeholder={`Replying to ${comment.author.username}...`}
                  parentId={comment.id}
                  // Pass isSubmitting and error if CommentForm is adapted to use them for replies
                />
              </div>
            )}
          </>
        )}
      </div>
      
      {comment.replies && comment.replies.length > 0 && depth < maxDepth && !isCollapsed && (
        <div className="mt-1"> {/* Reduced margin-top for replies */}
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              onVote={onVote}
              onReply={onReply}
              depth={depth + 1}
              maxDepth={maxDepth}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentItem; 