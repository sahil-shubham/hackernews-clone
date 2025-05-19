'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from './useAuthStore'

export const useAuthAPI = () => {
  const setUser = useAuthStore((store) => store.setUser)
  const router = useRouter()

  const login = async (emailOrUsername: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername, password })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Login failed' }))
      throw new Error(errorData.message || 'Login failed')
    }

    const data = await response.json()
    setUser(data.user ? { ...data.user, token: data.token } : null)
    return data
  }

  const signup = async (email: string, username: string, password: string) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Signup failed' }))
      throw new Error(errorData.message || 'Signup failed')
    }
    
    const data = await response.json()
    setUser(data.user ? { ...data.user, token: data.token } : null)
    return data
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout API call failed:', error)
    }
    setUser(null)
    router.push('/')
  }

  return {
    login,
    signup,
    logout
  }
}
