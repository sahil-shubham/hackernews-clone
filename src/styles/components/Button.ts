import styled from "styled-components";

// Button components
export const Button = styled.button<{
  $variant?: 'primary' | 'secondary' | 'outline' | 'text';
  $size?: 'sm' | 'md' | 'lg';
  $fullWidth?: boolean;
  $disabled?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: ${props => props.theme.fontWeights.medium};
  border-radius: ${props => props.theme.radii.md};
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
  width: ${props => (props.$fullWidth ? '100%' : 'auto')};
  
  /* Size variations */
  padding: ${props => {
    switch (props.$size) {
      case 'sm': return `${props.theme.space.xs} ${props.theme.space.md}`;
      case 'lg': return `${props.theme.space.md} ${props.theme.space.xl}`;
      default: return `${props.theme.space.sm} ${props.theme.space.lg}`;
    }
  }};
  
  font-size: ${props => {
    switch (props.$size) {
      case 'sm': return props.theme.fontSizes.xs;
      case 'lg': return props.theme.fontSizes.lg;
      default: return props.theme.fontSizes.md;
    }
  }};
  
  /* Variant styles */
  ${props => {
    switch (props.$variant) {
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

export const ClearSearchButton = styled.button`
  background: transparent;
  border: none;
  color: ${(props) => props.theme.colors.secondary};
  cursor: pointer;
  padding: ${(props) => props.theme.space.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${(props) => props.theme.fontSizes.xl}; // Larger clear button

  &:hover {
    color: ${(props) => props.theme.colors.secondaryDark};
  }
`;