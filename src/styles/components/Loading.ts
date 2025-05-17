import { styled } from "styled-components";

export const LoadingTitle = styled.div`
  height: 1.5rem;
  background-color: #e5e7eb;
  border-radius: ${props => props.theme.radii.sm};
  width: 75%;
  margin-bottom: ${props => props.theme.space.lg};
`;

export const LoadingSubtitle = styled.div`
  height: 1rem;
  background-color: #f3f4f6;
  border-radius: ${props => props.theme.radii.sm};
  width: 50%;
  margin-bottom: ${props => props.theme.space.xl};
`;

export const LoadingContent = styled.div`
  height: 6rem;
  background-color: #f3f4f6;
  border-radius: ${props => props.theme.radii.sm};
  margin-bottom: ${props => props.theme.space.lg};
`;

export const ErrorContainer = styled.div`
  background-color: #fee2e2;
  border: 1px solid ${props => props.theme.colors.error};
  color: ${props => props.theme.colors.error};
  padding: ${props => props.theme.space.md};
  border-radius: ${props => props.theme.radii.md};
  margin-bottom: ${props => props.theme.space.lg};
`;