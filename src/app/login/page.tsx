'use client'

import LoginForm from '@/components/auth/LoginForm'
import * as Styled from '@/styles/components'

export default function LoginPage() {
  return (
    <Styled.PageContainer>
      <LoginForm />
      <Styled.FlexContainer $justify="center" $direction="row">
        <Styled.Text $size="md">
          Don&apos;t have an account? <Styled.StyledLink href="/signup">Sign up</Styled.StyledLink>
        </Styled.Text>
      </Styled.FlexContainer>
    </Styled.PageContainer>
  )
}
