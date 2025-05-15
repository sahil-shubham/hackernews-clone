import styled from 'styled-components';
import Link from 'next/link';
import theme from './theme';

// Get color keys for TypeScript type safety
type ColorKey = keyof typeof theme.colors;
type FontSizeKey = keyof typeof theme.fontSizes;

// Container components
export const PageContainer = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: ${props => props.theme.space.xl} ${props => props.theme.space.lg};
`;

export const Card = styled.div`
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.radii.md};
  box-shadow: ${props => props.theme.shadows.sm};
  padding: ${props => props.theme.space.xl};
  margin-bottom: ${props => props.theme.space.lg};
`;

export const FormCard = styled(Card)`
  max-width: 32rem;
  margin: 0 auto;
  padding: ${props => props.theme.space.xl};
`;

export const FlexContainer = styled.div<{
  direction?: string;
  justify?: string;
  align?: string;
  gap?: string;
}>`
  display: flex;
  flex-direction: ${props => props.direction || 'row'};
  justify-content: ${props => props.justify || 'flex-start'};
  align-items: ${props => props.align || 'stretch'};
  gap: ${props => props.gap || props.theme.space.md};
`;

// Typography components
export const Heading = styled.h1<{ level?: 1 | 2 | 3 | 4 | 5 | 6 }>`
  font-size: ${props => {
    switch (props.level) {
      case 1: return props.theme.fontSizes['2xl'];
      case 2: return props.theme.fontSizes.xl;
      case 3: return props.theme.fontSizes.lg;
      case 4: return props.theme.fontSizes.md;
      case 5: return props.theme.fontSizes.sm;
      case 6: return props.theme.fontSizes.xs;
      default: return props.theme.fontSizes.xl;
    }
  }};
  font-weight: ${props => props.theme.fontWeights.bold};
  margin-bottom: ${props => props.theme.space.lg};
`;

export const Text = styled.p<{
  size?: FontSizeKey;
  weight?: 'normal' | 'medium' | 'bold';
  color?: ColorKey;
}>`
  font-size: ${props => props.theme.fontSizes[props.size || 'md']};
  font-weight: ${props => props.theme.fontWeights[props.weight || 'normal']};
  color: ${props => props.color ? props.theme.colors[props.color] : 'inherit'};
`;

export const ErrorText = styled(Text)`
  color: ${props => props.theme.colors.error};
  margin-top: ${props => props.theme.space.sm};
`;

// Form components
export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${props => props.theme.space.lg};
`;

export const Label = styled.label`
  margin-bottom: ${props => props.theme.space.sm};
  font-weight: ${props => props.theme.fontWeights.medium};
`;

export const Input = styled.input`
  padding: ${props => props.theme.space.md};
  border: 1px solid ${props => props.theme.colors.secondaryLight};
  border-radius: ${props => props.theme.radii.sm};
  font-size: ${props => props.theme.fontSizes.md};
  
  &:focus {
    border-color: ${props => props.theme.colors.primary};
    outline: none;
  }
`;

export const TextArea = styled.textarea`
  padding: ${props => props.theme.space.md};
  border: 1px solid ${props => props.theme.colors.secondaryLight};
  border-radius: ${props => props.theme.radii.sm};
  font-size: ${props => props.theme.fontSizes.md};
  resize: vertical;
  min-height: 6rem;
  
  &:focus {
    border-color: ${props => props.theme.colors.primary};
    outline: none;
  }
`;

// Button components
export const Button = styled.button<{
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: ${props => props.theme.fontWeights.medium};
  border-radius: ${props => props.theme.radii.md};
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
  width: ${props => (props.fullWidth ? '100%' : 'auto')};
  
  /* Size variations */
  padding: ${props => {
    switch (props.size) {
      case 'sm': return `${props.theme.space.xs} ${props.theme.space.md}`;
      case 'lg': return `${props.theme.space.md} ${props.theme.space.xl}`;
      default: return `${props.theme.space.sm} ${props.theme.space.lg}`;
    }
  }};
  
  font-size: ${props => {
    switch (props.size) {
      case 'sm': return props.theme.fontSizes.xs;
      case 'lg': return props.theme.fontSizes.lg;
      default: return props.theme.fontSizes.md;
    }
  }};
  
  /* Variant styles */
  ${props => {
    switch (props.variant) {
      case 'secondary':
        return `
          background-color: ${props.theme.colors.secondary};
          color: ${props.theme.colors.white};
          &:hover:not(:disabled) {
            background-color: ${props.theme.colors.secondaryDark};
          }
          &:disabled {
            background-color: ${props.theme.colors.secondaryLight};
          }
        `;
      case 'outline':
        return `
          background-color: transparent;
          color: ${props.theme.colors.primary};
          border: 1px solid ${props.theme.colors.primary};
          &:hover:not(:disabled) {
            background-color: ${props.theme.colors.primaryLight};
            color: ${props.theme.colors.primaryHover};
          }
          &:disabled {
            color: ${props.theme.colors.secondaryLight};
            border-color: ${props.theme.colors.secondaryLight};
          }
        `;
      case 'text':
        return `
          background-color: transparent;
          color: ${props.theme.colors.primary};
          &:hover:not(:disabled) {
            text-decoration: underline;
          }
          &:disabled {
            color: ${props.theme.colors.secondaryLight};
          }
        `;
      default: // primary
        return `
          background-color: ${props.theme.colors.primary};
          color: ${props.theme.colors.white};
          &:hover:not(:disabled) {
            background-color: ${props.theme.colors.primaryHover};
          }
          &:disabled {
            background-color: ${props.theme.colors.primaryLight};
          }
        `;
    }
  }}
`;

// Link components
export const StyledLink = styled(Link)<{
  variant?: 'primary' | 'secondary' | 'text';
}>`
  text-decoration: none;
  transition: color 0.2s;
  
  ${props => {
    switch (props.variant) {
      case 'secondary':
        return `
          color: ${props.theme.colors.secondary};
          &:hover {
            color: ${props.theme.colors.secondaryDark};
          }
        `;
      case 'text':
        return `
          color: inherit;
          &:hover {
            text-decoration: underline;
          }
        `;
      default: // primary
        return `
          color: ${props.theme.colors.primary};
          &:hover {
            color: ${props.theme.colors.primaryHover};
            text-decoration: underline;
          }
        `;
    }
  }}
`; 