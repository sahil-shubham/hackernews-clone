'use client';

import React, { useState } from 'react';
// import { useAuthStore } from '@/hooks/useAuthStore'; // Removed
import { User } from '@/lib/authUtils'; // Added
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ErrorText, Text } from '@/components/ui/typography';
import { FlexContainer } from '@/components/ui/layout';

interface CommentFormProps {
  postId: string;
  onAddComment: (text: string) => Promise<void>;
  placeholder?: string;
  parentId?: string; // For replies, if this form is reused
  isSubmitting?: boolean;
  error?: string | null;
  user: User | null; // Added user prop
}

export default function CommentForm({ 
  postId, 
  onAddComment,
  placeholder = 'What are your thoughts?',
  // parentId // Not used in this specific refactor pass, but good for future
  user, // Added user to destructuring
}: CommentFormProps) {
  // const user = useAuthStore((state) => state.user); // Removed
  const router = useRouter();
  
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push(`/login?next=/post/${postId}`); // Consider adding parentId if replying deep
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
      setComment(''); // Clear comment box on success
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to post comment. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-card p-4 rounded-lg shadow">
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder={placeholder}
              required
              className="w-full p-3 text-sm bg-background border border-input rounded-md shadow-sm focus:ring-2 focus:ring-ring focus:border-ring placeholder-muted-foreground"
            />
            {error && <ErrorText className="mt-2 text-xs">{error}</ErrorText>}
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              size="sm"
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      ) : (
        <FlexContainer direction="col" align="center" gap="4" className="p-6 border border-dashed border-border rounded-md">
          <Text emphasis="low" className="text-center">You need to be logged in to comment.</Text>
          <Button
            onClick={() => router.push(`/login?next=/post/${postId}`)} // Add parentId here too if needed
            variant="outline"
            size="sm"
          >
            Login to Comment
          </Button>
        </FlexContainer>
      )}
    </div>
  );
} 