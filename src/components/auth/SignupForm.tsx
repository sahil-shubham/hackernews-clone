'use client';

import React, { useState } from 'react';
import { useAuthAPI } from '@/hooks/useAuthAPI';
import { useRouter } from 'next/navigation';
import { Heading, ErrorText } from '@/components/ui/typography';
import { Button } from '@/components/ui/Button';

const SignupForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signup } = useAuthAPI();
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
      
      router.push('/');
      router.refresh();
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
    <div className="bg-card text-card-foreground shadow-xl rounded-lg p-6 sm:p-8 w-full max-w-md">
      <Heading as="h2" className="text-2xl font-bold text-center mb-6">Sign Up</Heading>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md text-sm shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-foreground mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md text-sm shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md text-sm shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md text-sm shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Signing up...' : 'Sign Up'}
        </Button>
        
        {error && <ErrorText className="mt-4 text-center">{error}</ErrorText>}
      </form>
    </div>
  );
};

export default SignupForm; 