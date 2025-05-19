'use client';

import React, { useState } from 'react';
import { useAuthAPI } from '@/hooks/useAuthAPI';
import { useRouter } from 'next/navigation';
import { Heading, ErrorText } from '@/components/ui/typography';
import { Button } from '@/components/ui/Button';

const LoginForm: React.FC = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuthAPI();
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
    <div className="bg-card text-card-foreground shadow-xl rounded-lg p-6 sm:p-8 w-full max-w-md">
      <Heading as="h2" className="text-2xl font-bold text-center mb-6">Login</Heading>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="emailOrUsername" className="block text-sm font-medium text-foreground mb-1">
            Email or Username
          </label>
          <input
            id="emailOrUsername"
            type="text"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
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
        
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </Button>
        
        {error && <ErrorText className="mt-4 text-center">{error}</ErrorText>}
      </form>
    </div>
  );
};

export default LoginForm; 