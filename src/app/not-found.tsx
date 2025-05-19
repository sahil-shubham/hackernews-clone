import { Suspense } from 'react'
import * as Styled from '@/styles/components'

export default function NotFound() {
  return (
    <Suspense>
      <Styled.PageContainer>
        <Styled.FlexContainer $direction="column" $align="center" $justify="center">
          <Styled.Heading $level={1}>404</Styled.Heading>
          <Styled.Text $size="lg">Page Not Found</Styled.Text>
          <Styled.Text $size="md">The page you are looking for does not exist.</Styled.Text>
          <Styled.StyledLink href="/">Return Home</Styled.StyledLink>
        </Styled.FlexContainer>
      </Styled.PageContainer>
    </Suspense>
  )
}
