'use client'

import { redirect } from 'next/navigation'
import { useAuthStore } from './useAuthStore'

export const useAuthAPI = () => {
  const setUser = useAuthStore((store) => store.setUser)

  const login = async (emailOrUsername: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername, password })
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data)
      })
      .catch((error) => {
        console.error('Login error:', error)
        throw error
      })

    return response
  }

  const signup = async (email: string, username: string, password: string) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password })
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data)
      })
      .catch((error) => {
        console.error('Signup error:', error)
        throw error
      })

    return response
  }

  // If there were a server-side endpoint to invalidate a session, it would be called here.
  const logout = () => {
    setUser(null)
    redirect('/')
  }

  return {
    login,
    signup,
    logout
  }
}
