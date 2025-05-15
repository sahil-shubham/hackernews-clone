'use client';

import React from 'react';
import { ThemeProvider } from 'styled-components';
import theme from './styles/theme';
import GlobalStyles from './styles/GlobalStyles';
import StyledComponentsRegistry from './lib/registry';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StyledComponentsRegistry>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        {children}
      </ThemeProvider>
    </StyledComponentsRegistry>
  );
} 