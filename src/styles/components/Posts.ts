'use client';
// Styled components for post detail page
import { Card } from "./Card";
import { Heading } from "./Generics";
import { styled } from "styled-components";

export const PostCard = styled(Card)`
  padding: ${props => props.theme.space.lg};
`;

export const PostTitle = styled(Heading)`
  margin-bottom: ${props => props.theme.space.sm};
`;

export const PostUrl = styled.a`
  display: block;
  color: ${props => props.theme.colors.secondary};
  font-size: ${props => props.theme.fontSizes.sm};
  margin-bottom: ${props => props.theme.space.lg};
  
  &:hover {
    text-decoration: underline;
  }
`;

export const PostContent = styled.div`
  margin: ${props => props.theme.space.lg} 0;
  color: ${props => props.theme.colors.secondaryDark};
`;

export const PreformattedText = styled.p`
  white-space: pre-line;
`;

export const PostMeta = styled.div`
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.secondary};
  margin-top: ${props => props.theme.space.lg};
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.space.xs};
`;

export const MetaSeparator = styled.span`
  margin: 0 ${props => props.theme.space.xs};
`;

export const LoadingContainer = styled(PostCard)`
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;
export const PostListContainer = styled.div`
  margin: 0 auto;
`;

export const EmptyPostStateContainer = styled.div`
  margin: 0 auto;
  text-align: center;
  padding: 2.5rem 0;
`;

export const EmptyPostStateHeading = styled.h3`
  font-size: 1.125rem;
  font-weight: 500;
  color: #6b7280;
`;

export const EmptyPostStateText = styled.p`
  margin-top: 0.5rem;
  color: #9ca3af;
`;

export const LoadingPostItem = styled.div`
  background-color: white;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

export const LoadingPostTitle = styled.div`
  height: 1.25rem;
  background-color: #e5e7eb;
  border-radius: 0.25rem;
  width: 75%;
  margin-bottom: 0.5rem;
`;

export const LoadingPostSubtitle = styled.div`
  height: 0.75rem;
  background-color: #f3f4f6;
  border-radius: 0.25rem;
  width: 50%;
`;