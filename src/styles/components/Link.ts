import Link from "next/link";
import { styled } from "styled-components";

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