'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import CommentForm from '@/components/comment/CommentForm';
import { Comment } from '@/components/comment/CommentItem';

export default function PostDetailPage() {
  const { postId } = useParams();
  const { user, token } = useAuth();
  
  const [post, setPost] = useState<any | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch post and comments
  useEffect(() => {
    const fetchPostAndComments = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const headers: HeadersInit = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        // Fetch post details
        const postResponse = await fetch(`/api/posts/${postId}`, {
          headers,
        });
        
        if (!postResponse.ok) {
          throw new Error('Failed to fetch post');
        }
        
        const postData = await postResponse.json();
        setPost(postData);
        
        // Fetch comments
        const commentsResponse = await fetch(`/api/posts/${postId}/comments`, {
          headers,
        });
        
        if (!commentsResponse.ok) {
          throw new Error('Failed to fetch comments');
        }
        
        const commentsData = await commentsResponse.json();
        setComments(commentsData.comments);
      } catch (err) {
        console.error('Error fetching post details:', err);
        setError('Failed to load post. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (postId) {
      fetchPostAndComments();
    }
  }, [postId, token]);
  
  // Handle comment voting
  const handleCommentVote = async (commentId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!user || !token) return;
    
    try {
      const response = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ voteType }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to vote on comment');
      }
      
      // Update comment in the UI
      setComments(prevComments => updateCommentVote(prevComments, commentId, voteType));
    } catch (err) {
      console.error('Error voting on comment:', err);
    }
  };
  
  // Update comment vote in UI
  const updateCommentVote = (comments: Comment[], commentId: string, voteType: 'UPVOTE' | 'DOWNVOTE'): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        // If user already voted with the same vote type, we're removing the vote
        return {
          ...comment,
          points: comment.voteType === voteType ? comment.points - 1 : comment.points + 1,
          voteType: comment.voteType === voteType ? null : voteType,
          hasVoted: comment.voteType !== voteType,
        };
      } else if (comment.replies && comment.replies.length > 0) {
        // Check in replies recursively
        return {
          ...comment,
          replies: updateCommentVote(comment.replies, commentId, voteType),
        };
      }
      return comment;
    });
  };
  
  // Add new comment
  const handleAddComment = async (text: string) => {
    if (!user || !token) return;
    
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ textContent: text }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to post comment');
      }
      
      const newComment = await response.json();
      
      // Add new comment to the UI
      setComments(prevComments => [
        ...prevComments,
        {
          ...newComment,
          points: 0,
          replies: [],
        },
      ]);
    } catch (err) {
      console.error('Error adding comment:', err);
      throw err;
    }
  };
  
  // Handle comment reply
  const handleCommentReply = async (parentId: string, text: string) => {
    if (!user || !token) return;
    
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          textContent: text,
          parentId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to post reply');
      }
      
      const newComment = await response.json();
      
      // Add reply to the UI
      setComments(prevComments => addReplyToComment(prevComments, parentId, {
        ...newComment,
        points: 0,
        replies: [],
      }));
    } catch (err) {
      console.error('Error adding reply:', err);
      throw err;
    }
  };
  
  // Add reply to comment recursively
  const addReplyToComment = (comments: Comment[], parentId: string, newReply: Comment): Comment[] => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply],
        };
      } else if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: addReplyToComment(comment.replies, parentId, newReply),
        };
      }
      return comment;
    });
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-md p-4 shadow-sm mb-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-100 rounded w-1/2 mb-6"></div>
          <div className="h-24 bg-gray-100 rounded mb-4"></div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Post not found'}
        </div>
        <Link href="/" className="text-orange-600 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }
  
  // Format the domain from URL if present
  const domain = post.url ? new URL(post.url).hostname.replace(/^www\./, '') : null;
  
  // Format the time since post creation
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  
  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Post details */}
      <div className="bg-white rounded-md p-4 shadow-sm mb-6">
        <h1 className="text-xl font-bold mb-2">{post.title}</h1>
        
        {post.url && (
          <a 
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 text-sm hover:underline mb-4 block"
          >
            {domain && `(${domain})`}
          </a>
        )}
        
        {post.textContent && (
          <div className="my-4 text-gray-800">
            <p className="whitespace-pre-line">{post.textContent}</p>
          </div>
        )}
        
        <div className="text-sm text-gray-500 mt-4">
          <span>{post.points} points</span>
          <span className="mx-1">•</span>
          <span>by {post.author.username}</span>
          <span className="mx-1">•</span>
          <span>{timeAgo}</span>
          <span className="mx-1">•</span>
          <span>{post.commentCount} comments</span>
        </div>
      </div>
      
      {/* Comment form */}
      <CommentForm postId={postId as string} onAddComment={handleAddComment} />
      
      {/* Display comments */}
      {comments.length === 0 ? (
        <div className="py-4">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Comments</h3>
          </div>
          <div className="bg-white rounded-md p-6 text-center text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        </div>
      ) : (
        <div className="py-4">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Comments ({comments.length})</h3>
          </div>
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="pt-2">
                <div className="bg-white rounded-md p-3 shadow-sm">
                  {/* Comment header */}
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="font-medium text-gray-700">{comment.author.username}</span>
                    <span className="mx-1">•</span>
                    <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
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
                          onClick={() => handleCommentVote(comment.id, 'UPVOTE')}
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
                    
                    {user && (
                      <button 
                        onClick={() => {/* Toggle reply form */}}
                        className="mr-3 hover:text-gray-700"
                      >
                        Reply
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Nested replies would go here */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-2 pl-4 border-l border-gray-200">
                    {/* We'd render nested comments here with similar markup */}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 