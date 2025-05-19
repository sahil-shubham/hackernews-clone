'use client'

import type React from 'react' // Keep if you use React types explicitly, else Next.js usually handles it.
// import { useState, useRef, useEffect, Suspense } from "react";
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Check, Sun, Moon } from 'lucide-react' // V0 uses these
import { useTheme } from 'next-themes'
import { useAuthStore } from '@/hooks/useAuthStore'
// import { useAuthAPI } from '@/hooks/useAuthAPI'
// import NotificationBell from '@/components/notifications/NotificationBell'
import { Suspense } from 'react'

// Removed all styled-components definitions

const HeaderComponent = () => {
  const router = useRouter()
  const { user } = useAuthStore()
  // const { logout } = useAuthAPI()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort') || 'new'
  const currentSearchQuery = searchParams.get('search') || '' // For search page persistence

  // const [isSearchOpen, setIsSearchOpen] = useState(false);
  // const [searchValue, setSearchValue] = useState(currentSearchQuery);
  // const [mounted, setMounted] = useState(false);
  // const searchInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme()

  // useEffect(() => {
  //   setMounted(true);
  // }, []);

  // useEffect(() => {
  //   if (isSearchOpen && searchInputRef.current) {
  //     searchInputRef.current.focus();
  //   }
  // }, [isSearchOpen]);

  // const handleSearchToggle = () => {
  //   setIsSearchOpen(!isSearchOpen);
  //   if (isSearchOpen) { // If it was just closed, clear search value, else focus
  //     setSearchValue("");
  //   } else {
  //     setTimeout(() => {
  //       searchInputRef.current?.focus();
  //     }, 100); // Ensure input is visible before focus
  //   }
  // };

  // const handleSearchSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!searchValue.trim()) return; // Don't search if empty
  //   router.push(`/search?query=${encodeURIComponent(searchValue)}&page=1&sort=${currentSort}`);
  //   setIsSearchOpen(false); // Close search bar after submitting
  // };

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', newSort)
    params.set('page', '1') // Reset to page 1 on sort change

    const pathname = window.location.pathname
    if (pathname.startsWith('/search')) {
      // Preserve current search query if on search page
      if (currentSearchQuery) params.set('search', currentSearchQuery)
      else params.delete('search')
      router.push(`/search?${params.toString()}`)
    } else {
      params.delete('search') // Remove search from params if on homepage/other pages
      router.push(`/?${params.toString()}`)
    }
  }

  const tabs = [
    { id: 'new', label: 'New' },
    { id: 'top', label: 'Top' },
    { id: 'best', label: 'Best' }
  ]

  // Styles from V0 for the main header bar (bg-[#ff6600] is approx. theme primary)
  // We use bg-primary as defined in tailwind.config.js which links to HSL var(--primary)
  // text-primary-foreground for text on primary background

  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 max-w-5xl flex items-center justify-between h-14">
        {' '}
        {/* V0 uses max-w-5xl. Original HeaderContent was 1280px (~max-w-7xl) */}
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
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-full hover:bg-primary-foreground/20 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user ? (
            <>
              {/* <NotificationBell /> */}
              <span className="text-sm font-medium hidden sm:inline">{user.username}</span>
              {/* <button
                  onClick={logout}
                  className="text-sm hover:underline relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-1.5"
                >
                  logout
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary-foreground/70 transition-all group-hover:w-full"></span>
                </button> */}
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

      {/* Tabs Bar - styled according to V0 example and existing logic */}
      <div className="bg-background text-foreground border-b border-border">
        <div className="container mx-auto px-4 max-w-5xl flex items-center space-x-2 sm:space-x-8 py-0 sm:py-2 overflow-y-hidden overflow-x-auto h-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSortChange(tab.id)}
              className={`relative px-1 py-2 text-sm font-medium transition-colors cursor-pointer group focus:outline-none focus-visible:ring-1 focus-visible:ring-ring roundedwhitespace-nowrap 
                ${currentSort === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {tab.label}
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

// Wrapper component to ensure Suspense is used correctly if HeaderComponent has issues with it internally.
// The V0 example does not use Suspense here, assuming Header is a full client component.
export default function HeaderWrapper() {
  return (
    <Suspense fallback={<div className="h-[104px] bg-primary" />}>
      {' '}
      {/* Placeholder for header height during suspense */}
      <HeaderComponent />
    </Suspense>
  )
}
