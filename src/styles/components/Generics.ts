'use client';

import { styled } from "styled-components";
import theme from "../theme";

// Get color keys for TypeScript type safety
// type ColorKey = keyof typeof theme.colors;
// type FontSizeKey = keyof typeof theme.fontSizes;

// Container components
export const PageContainer = styled.div`
  max-width: 1280px;
  margin: 0 auto;
`;


export const FlexContainer = styled.div<{
  $direction?: string;
  $justify?: string;
  $align?: string;
  $gap?: string;
}>`
  display: flex;
`;

// Typography components
export const Heading = styled.h1<{ $level?: 1 | 2 | 3 | 4 | 5 | 6 }>`
`;

export const Text = styled.p<{
  // $size?: FontSizeKey;
  $weight?: 'normal' | 'medium' | 'bold';
  // $color?: ColorKey;
}>`
`;

export const ErrorText = styled(Text)`
`;