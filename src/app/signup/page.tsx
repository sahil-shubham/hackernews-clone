'use client'

import SignupForm from '@/components/auth/SignupForm'
import * as Styled from '@/styles/components'

export default function SignupPage() {
  return (
    <Styled.PageContainer>
      <SignupForm />
      <Styled.FlexContainer justify="center" direction="row">
        <Styled.Text size="md">
          Already have an account? <Styled.StyledLink href="/login">Login</Styled.StyledLink>
        </Styled.Text>
      </Styled.FlexContainer>
    </Styled.PageContainer>
  )
}
