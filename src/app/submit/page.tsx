'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import styled from 'styled-components';
import { 
  PageContainer, 
  Card, 
  Heading, 
  FormGroup, 
  Label, 
  Input, 
  TextArea, 
  Button,
} from '@/styles/StyledComponents';

// Type selector styled components
const TypeSelectorContainer = styled.div`
  margin-bottom: ${props => props.theme.space.lg};
`;

const TypeSelectorGroup = styled.div`
  display: inline-flex;
  border-radius: ${props => props.theme.radii.md};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const TypeButton = styled.button<{ active: boolean }>`
  padding: ${props => `${props.theme.space.sm} ${props.theme.space.lg}`};
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: ${props => props.theme.fontWeights.medium};
  border: 1px solid ${props => 
    props.active 
      ? props.theme.colors.primary 
      : props.theme.colors.secondaryLight
  };
  background-color: ${props => 
    props.active 
      ? props.theme.colors.primary 
      : props.theme.colors.white
  };
  color: ${props => 
    props.active 
      ? props.theme.colors.white 
      : props.theme.colors.secondaryDark
  };
  
  &:hover:not(:disabled) {
    background-color: ${props => 
      props.active 
        ? props.theme.colors.primary 
        : '#f9fafb'
    };
  }
  
  &:first-child {
    border-top-left-radius: ${props => props.theme.radii.md};
    border-bottom-left-radius: ${props => props.theme.radii.md};
  }
  
  &:last-child {
    border-top-right-radius: ${props => props.theme.radii.md};
    border-bottom-right-radius: ${props => props.theme.radii.md};
  }
`;

const RequiredMark = styled.span`
  color: ${props => props.theme.colors.error};
`;

const ErrorAlert = styled.div`
  background-color: #fee2e2;
  border: 1px solid ${props => props.theme.colors.error};
  color: ${props => props.theme.colors.error};
  padding: ${props => props.theme.space.md};
  border-radius: ${props => props.theme.radii.md};
  margin-bottom: ${props => props.theme.space.lg};
`;

export default function SubmitPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [type, setType] = useState<'LINK' | 'TEXT'>('LINK');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Redirect to login if not authenticated
  if (!user && !isSubmitting) {
    router.push('/login?next=/submit');
    return null;
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      setError('Title is required');
      return;
    }
    
    if (type === 'LINK' && !url) {
      setError('URL is required for link posts');
      return;
    }
    
    if (type === 'TEXT' && !textContent) {
      setError('Text content is required for text posts');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          url: type === 'LINK' ? url : null,
          textContent: type === 'TEXT' ? textContent : null,
          type,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create post');
      }
      
      const data = await response.json();
      
      // Redirect to the post or homepage
      router.push(`/post/${data.id}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred while creating the post');
      }
      setIsSubmitting(false);
    }
  };
  
  return (
    <PageContainer>
      <Heading level={1}>Submit</Heading>
      
      {error && <ErrorAlert>{error}</ErrorAlert>}
      
      <TypeSelectorContainer>
        <TypeSelectorGroup role="group">
          <TypeButton
            type="button"
            active={type === 'LINK'}
            onClick={() => setType('LINK')}
          >
            Link
          </TypeButton>
          <TypeButton
            type="button"
            active={type === 'TEXT'}
            onClick={() => setType('TEXT')}
          >
            Text
          </TypeButton>
        </TypeSelectorGroup>
      </TypeSelectorContainer>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="title">
              Title <RequiredMark>*</RequiredMark>
            </Label>
            <Input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </FormGroup>
          
          {type === 'LINK' ? (
            <FormGroup>
              <Label htmlFor="url">
                URL <RequiredMark>*</RequiredMark>
              </Label>
              <Input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </FormGroup>
          ) : (
            <FormGroup>
              <Label htmlFor="textContent">
                Text <RequiredMark>*</RequiredMark>
              </Label>
              <TextArea
                id="textContent"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={6}
                required
              />
            </FormGroup>
          )}
          
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      </Card>
    </PageContainer>
  );
} 