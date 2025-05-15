'use client';

import SignupForm from '@/components/auth/SignupForm';
import { PageContainer, Text, StyledLink, FlexContainer } from '@/styles/StyledComponents';

export default function SignupPage() {
  return (
    <PageContainer>
      <SignupForm />
      <FlexContainer justify="center" direction="row">
        <Text size="md">
          Already have an account? <StyledLink href="/login">Login</StyledLink>
        </Text>
      </FlexContainer>
    </PageContainer>
  );
} 