'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { 
  FormCard, 
  Heading, 
  FormGroup, 
  Label, 
  Input, 
  Button, 
  ErrorText 
} from '@/styles/StyledComponents';

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
    <FormCard>
      <Heading level={2}>Login</Heading>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="emailOrUsername">
            Email or Username
          </Label>
          <Input
            id="emailOrUsername"
            type="text"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="password">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormGroup>
        
        <Button 
          type="submit" 
          disabled={isSubmitting}
          fullWidth
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </Button>
        
        {error && <ErrorText>{error}</ErrorText>}
      </form>
    </FormCard>
  );
};

export default LoginForm; 