'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '@/lib/api'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string) => Promise<boolean>
  logout: () => void
  error: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      if (api.isAuthenticated()) {
        try {
          const result = await api.getStats()
          setIsAuthenticated(result.success)
        } catch {
          api.clearAuth()
          setIsAuthenticated(false)
        }
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [])

  const login = async (token: string): Promise<boolean> => {
    setError(null)
    api.setAuth(token)
    try {
      const result = await api.getStats()
      if (result.success) {
        setIsAuthenticated(true)
        return true
      } else {
        api.clearAuth()
        setError(result.error || 'Authentication failed')
        return false
      }
    } catch (err) {
      api.clearAuth()
      setError('Failed to connect to server')
      return false
    }
  }

  const logout = () => {
    api.clearAuth()
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}