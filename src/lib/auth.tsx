import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'

export type UserRole = 'company' | 'vendor' | 'investor' | 'securities' | 'auditor'

export interface AuthUser {
  id: number
  email: string
  name: string
  role: UserRole
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasRole: (...roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
  })
  const navigate = useNavigate()

  const login = useCallback(async (email: string, _password: string) => {
    setState((s) => ({ ...s, isLoading: true }))
    try {
      // TODO: implement actual login via server function
      const user: AuthUser = {
        id: 1,
        email,
        name: email.split('@')[0],
        role: 'company',
      }
      setState({ user, isLoading: false })
    } catch {
      setState({ user: null, isLoading: false })
    }
  }, [])

  const logout = useCallback(() => {
    setState({ user: null, isLoading: false })
    navigate({ to: '/' })
  }, [navigate])

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!state.user) return false
      return roles.includes(state.user.role)
    },
    [state.user],
  )

  return (
    <AuthContext.Provider
      value={{ ...state, login, logout, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
