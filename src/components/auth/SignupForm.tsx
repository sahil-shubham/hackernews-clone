'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import * as Styled from "@/styles/components"

const SignupForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !username || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      await signup(email, username, password);
      
      // Redirect to home page after successful signup
      router.push('/');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred during signup');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Styled.FormCard>
      <Styled.Heading level={2}>Sign Up</Styled.Heading>
      <form onSubmit={handleSubmit}>
        <Styled.FormGroup>
          <Styled.Label htmlFor="email">
            Email
          </Styled.Label>
          <Styled.Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Styled.FormGroup>
        
        <Styled.FormGroup>
          <Styled.Label htmlFor="username">
            Username
          </Styled.Label>
          <Styled.Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
        
        <Styled.FormGroup>
          <Styled.Label htmlFor="confirmPassword">
            Confirm Password
          </Styled.Label>
          <Styled.Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </Styled.FormGroup>
        
        <Styled.Button 
          type="submit" 
          disabled={isSubmitting}
          fullWidth
        >
          {isSubmitting ? 'Signing up...' : 'Sign Up'}
        </Styled.Button>
        
        {error && <Styled.ErrorText>{error}</Styled.ErrorText>}
      </form>
    </Styled.FormCard>
  );
};

export default SignupForm; 