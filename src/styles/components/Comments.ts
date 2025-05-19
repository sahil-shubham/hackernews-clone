'use client';
import { styled } from "styled-components";

export const CommentsSection = styled.div`
  padding: ${props => props.theme.space.lg} 0;
`;

export const CommentsSectionHeader = styled.div`
  margin-bottom: ${props => props.theme.space.lg};
`;

export const CommentsHeading = styled.h3`
  font-size: ${props => props.theme.fontSizes.lg};
  font-weight: ${props => props.theme.fontWeights.medium};
`;

export const CommentsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
`;

export const NoCommentsMessage = styled.div`
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.radii.md};
  padding: ${props => props.theme.space.xl};
  text-align: center;
  color: ${props => props.theme.colors.secondary};
`;

export const CommentsFormContainer = styled.div`
  background-color: white;
  border-radius: 0.375rem;
  padding: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
`;

export const CommentsFormGroup = styled.div`
  margin-bottom: 0.75rem;
`;