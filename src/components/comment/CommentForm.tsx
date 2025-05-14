'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';

interface CommentFormProps {
  postId: string;
  onAddComment: (text: string) => Promise<void>;
  placeholder?: string;
}

// Styled Components
const FormContainer = styled.div`
  background-color: white;
  border-radius: 0.375rem;
  padding: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
`;

const FormGroup = styled.div`
  margin-bottom: 0.75rem;
`;

const ErrorMessage = styled.p`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const SubmitButton = styled.button<{ disabled: boolean }>`
  padding: 0.5rem 1rem;
  background-color: ${props => props.disabled ? '#fdba74' : '#ea580c'};
  color: white;
  border-radius: 0.25rem;
  font-weight: 500;
  &:hover {
    background-color: ${props => props.disabled ? '#fdba74' : '#c2410c'};
  }
`;

const LoginMessage = styled.div`
  text-align: center;
  padding: 1rem 0;
`;

const LoginText = styled.p`
  color: #4b5563;
  margin-bottom: 0.5rem;
`;

const LoginButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #ea580c;
  color: white;
  border-radius: 0.25rem;
  font-weight: 500;
  &:hover {
    background-color: #c2410c;
  }
`;

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
    <FormContainer>
      {user ? (
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <TextArea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder={placeholder}
              required
            />
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </FormGroup>
          <ButtonContainer>
            <SubmitButton
              type="submit"
              disabled={isSubmitting || !comment.trim()}
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </SubmitButton>
          </ButtonContainer>
        </form>
      ) : (
        <LoginMessage>
          <LoginText>You need to be logged in to comment</LoginText>
          <LoginButton
            onClick={() => router.push(`/login?next=/post/${postId}`)}
          >
            Login to Comment
          </LoginButton>
        </LoginMessage>
      )}
    </FormContainer>
  );
} 