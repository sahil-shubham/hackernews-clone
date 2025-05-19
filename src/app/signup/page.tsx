'use client'

import SignupForm from '@/components/auth/SignupForm'
import { PageContainer, FlexContainer } from '@/components/ui/layout'
import { Text } from '@/components/ui/typography'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <PageContainer className="flex flex-col items-center justify-center py-12">
      <SignupForm />
      <FlexContainer justify="center" direction="row" className="mt-8">
        <Text size="base">
          Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Login</Link>
        </Text>
      </FlexContainer>
    </PageContainer>
  )
}
