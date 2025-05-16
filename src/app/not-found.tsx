'use client';

import { Suspense } from 'react';
import {
  PageContainer,
  Heading,
  Text,
  StyledLink,
  FlexContainer
} from '@/styles/StyledComponents';

export default function NotFound() {
  return (
    <Suspense>
      <PageContainer>
        <FlexContainer direction="column" align="center" justify="center">
          <Heading level={1}>404</Heading>
          <Text size="lg">Page Not Found</Text>
          <Text size="md">The page you are looking for does not exist.</Text>
          <StyledLink href="/">Return Home</StyledLink>
        </FlexContainer>
      </PageContainer>
    </Suspense>
  );
}
