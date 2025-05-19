import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/styles/theme-provider'
import './globals.css'
import HeaderWrapper from '@/components/Header'
import { getServerSideUser } from '@/lib/authUtils'
import StoreInitializer from '@/components/StoreInitializer'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Hacker News Clone',
  description: 'A Hacker News clone built with Next.js'
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const serverUser = await getServerSideUser()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <StoreInitializer serverUser={serverUser} />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <HeaderWrapper />
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
