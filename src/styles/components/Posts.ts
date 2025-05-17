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