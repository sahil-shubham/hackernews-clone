'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useRouter } from 'next/navigation';
import * as Styled from '@/styles/components'

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
  const user = useAuthStore((state) => state.user);
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
    <Styled.CommentsFormContainer>
      {user ? (
        <form onSubmit={handleSubmit}>
          <Styled.CommentsFormGroup>
            <Styled.TextArea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder={placeholder}
              required
            />
            {error && <Styled.ErrorText>{error}</Styled.ErrorText>}
          </Styled.CommentsFormGroup>
          <Styled.Button
            type="submit"
            disabled={isSubmitting || !comment.trim()}
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Styled.Button>
        </form>
      ) : (
        <Styled.FlexContainer>
          <Styled.Text>You need to be logged in to comment</Styled.Text>
          <Styled.Button
            onClick={() => router.push(`/login?next=/post/${postId}`)}
          >
            Login to Comment
          </Styled.Button>
        </Styled.FlexContainer>
      )}
    </Styled.CommentsFormContainer>
  );
} 