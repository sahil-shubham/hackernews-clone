'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import * as Styled from "@/styles/components"

const LoginForm: React.FC = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailOrUsername || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      await login(emailOrUsername, password);
      
      // Redirect to home page after successful login
      router.push('/');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred during login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Styled.FormCard>
      <Styled.Heading level={2}>Login</Styled.Heading>
      <form onSubmit={handleSubmit}>
        <Styled.FormGroup>
          <Styled.Label htmlFor="emailOrUsername">
            Email or Username
          </Styled.Label>
          <Styled.Input
            id="emailOrUsername"
            type="text"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            required
          />
        </Styled.FormGroup>
        
        <Styled.FormGroup>
          <Styled.Label htmlFor="password">
            Password
          </Styled.Label>
          <Styled.Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Styled.FormGroup>
        
        <Styled.Button 
          type="submit" 
          disabled={isSubmitting}
          fullWidth
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </Styled.Button>
        
        {error && <Styled.ErrorText>{error}</Styled.ErrorText>}
      </form>
    </Styled.FormCard>
  );
};

export default LoginForm; 