import LoginForm from '@/components/auth/LoginForm'
import { PageContainer, FlexContainer } from '@/components/ui/layout'
import { Text } from '@/components/ui/typography'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <PageContainer className="flex flex-col items-center justify-center min-h-screen py-12">
      <LoginForm />
      <FlexContainer justify="center" direction="row" className="mt-8">
        <Text size="base">
          Don&apos;t have an account? <Link href="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
        </Text>
      </FlexContainer>
    </PageContainer>
  )
}
