'use client'

import type React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Check, Sun, Moon, Bookmark, Sparkles, TrendingUp } from 'lucide-react'
import { useTheme } from 'next-themes'
import { User } from '@/lib/authUtils'
import { useAuthAPI } from '@/hooks/useAuthAPI'
import NotificationBell from '@/components/notifications/NotificationBell'
import { Suspense, useEffect, useState } from 'react'

interface HeaderComponentProps {
  user: User | null
}

const HeaderComponent: React.FC<HeaderComponentProps> = ({ user }) => {
  const router = useRouter()
  const { logout } = useAuthAPI()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort') || 'new'
  const currentSearchQuery = searchParams.get('search') || ''

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', newSort)
    params.set('page', '1')

    const pathname = window.location.pathname
    if (pathname.startsWith('/search')) {
      if (currentSearchQuery) params.set('search', currentSearchQuery)
      else params.delete('search')
      router.push(`/search?${params.toString()}`)
    } else {
      params.delete('search')
      router.push(`/?${params.toString()}`)
    }
  }

  const tabs = [
    { id: 'new', label: 'New', icon: Sparkles },
    { id: 'top', label: 'Top', icon: TrendingUp },
  ]

  // Determine if we are on the bookmarks page
  const isBookmarksPage = typeof window !== 'undefined' ? window.location.pathname === '/bookmarks' : false

  return (
    <header className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 max-w-5xl flex items-center justify-between h-14">
        <div className="flex items-center justify-between h-14">
          <Link
            href="/"
            className="text-xl font-bold relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
          >
            Hacker News
          </Link>
          <Link
            href="/submit"
            className="text-sm relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
          >
            submit
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-foreground/70 transition-all group-hover:w-full"></span>
          </Link>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="relative flex items-center">
            <AnimatePresence initial={false}>
              <motion.button
                key="search-button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  router.push('/search')
                }}
                className="p-1.5 rounded-full hover:bg-primary-foreground/20 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </motion.button>
            </AnimatePresence>
          </div>

          <button
            onClick={() => router.push('/bookmarks')}
            className="p-1.5 rounded-full hover:bg-primary-foreground/20 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Bookmarks"
          >
            <Bookmark className="h-4 w-4" />
          </button>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-full hover:bg-primary-foreground/20 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Toggle theme"
          >
            {mounted && (theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
          </button>

          {user ? (
            <>
              <NotificationBell user={user} />
              <span className="text-sm font-medium hidden sm:inline">{user.username}</span>
              <button
                onClick={logout}
                className="text-sm relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-1.5"
              >
                logout
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary-foreground/70 transition-all group-hover:w-full"></span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-1.5"
            >
              login
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary-foreground/70 transition-all group-hover:w-full"></span>
            </Link>
          )}
        </div>
      </div>

      <div className="bg-background text-foreground border-b border-border">
        <div className="container mx-auto px-4 max-w-5xl flex items-center space-x-2 sm:space-x-8 py-0 sm:py-2 overflow-y-hidden overflow-x-auto h-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSortChange(tab.id)}
              className={`relative flex items-center space-x-1.5 px-1 py-2 text-sm font-medium transition-colors cursor-pointer group focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded whitespace-nowrap 
                  ${currentSort === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {currentSort === tab.id ? (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              ) : (
                <span className="absolute -bottom-0 left-0 w-0 h-0.5 bg-muted-foreground/70 transition-all group-hover:w-full"></span>
              )}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}

interface HeaderWrapperProps {
  user: User | null
}

export default function HeaderWrapper({ user }: HeaderWrapperProps) {
  return (
    <Suspense fallback={<div className="h-[104px] bg-primary" />}>
      <HeaderComponent user={user} />
    </Suspense>
  )
}
