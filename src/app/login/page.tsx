'use client';

import LoginForm from '@/components/auth/LoginForm';
import { PageContainer, Text, StyledLink, FlexContainer } from '@/styles/StyledComponents';

export default function LoginPage() {
  return (
    <PageContainer>
      <LoginForm />
      <FlexContainer justify="center" direction="row">
        <Text size="md">
          Don&apos;t have an account? <StyledLink href="/signup">Sign up</StyledLink>
        </Text>
      </FlexContainer>
    </PageContainer>
  );
} 