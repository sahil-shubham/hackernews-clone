import { styled } from "styled-components";
import theme from "../theme";

// Get color keys for TypeScript type safety
type ColorKey = keyof typeof theme.colors;
type FontSizeKey = keyof typeof theme.fontSizes;

// Container components
export const PageContainer = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: ${props => props.theme.space.xl} ${props => props.theme.space.lg};
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