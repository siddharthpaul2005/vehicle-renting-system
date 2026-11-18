import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, getToken, setToken } from '../lib/api'
import type { AuthResponse, User } from '../lib/types'

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (fullName: string, email: string, password: string) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => getToken() !== null)

  // Restore the session from a stored token.
  useEffect(() => {
    if (!getToken()) return
    api<User>('/auth/me')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener('dx:session-expired', onExpired)
    return () => window.removeEventListener('dx:session-expired', onExpired)
  }, [])

  const accept = useCallback((res: AuthResponse) => {
    setToken(res.token)
    setUser(res.user)
    return res.user
  }, [])

  const login = useCallback(
    async (email: string, password: string) => accept(await api<AuthResponse>('/auth/login', 'POST', { email, password })),
    [accept],
  )

  const register = useCallback(
    async (fullName: string, email: string, password: string) =>
      accept(await api<AuthResponse>('/auth/register', 'POST', { fullName, email, password })),
    [accept],
  )

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
