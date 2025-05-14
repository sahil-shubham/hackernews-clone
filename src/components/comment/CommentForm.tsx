'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface CommentFormProps {
  postId: string;
  onAddComment: (text: string) => Promise<void>;
  placeholder?: string;
}

export default function CommentForm({ 
  postId, 
  onAddComment,
  placeholder = 'What are your thoughts?'
}: CommentFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push(`/login?next=/post/${postId}`);
      return;
    }
    
    if (!comment.trim()) {
      setError('Comment cannot be empty');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await onAddComment(comment);
      setComment('');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to post comment');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-md p-4 shadow-sm mb-6">
      {user ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded"
              rows={4}
              placeholder={placeholder}
              required
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="px-4 py-2 bg-orange-600 text-white rounded font-medium hover:bg-orange-700 disabled:bg-orange-300"
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-600 mb-2">You need to be logged in to comment</p>
          <button
            onClick={() => router.push(`/login?next=/post/${postId}`)}
            className="px-4 py-2 bg-orange-600 text-white rounded font-medium hover:bg-orange-700"
          >
            Login to Comment
          </button>
        </div>
      )}
    </div>
  );
} 