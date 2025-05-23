import { getServerSideUser } from '@/lib/authUtils'
import { redirect } from 'next/navigation'
import SubmitPageClient from '@/components/auth/SubmitPageClient'

export default async function SubmitPage() {
  const user = await getServerSideUser()

  if (!user) {
    redirect('/login?next=/submit')
  }

  return <SubmitPageClient />
}
