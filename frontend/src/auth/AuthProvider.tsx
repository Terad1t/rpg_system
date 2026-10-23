import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { http } from '@/api/client'
import type { LoginResponse, SessionUser } from '@/api/types'
import { clearSession, getSession, saveSession, tokenExpiresAt, type Session } from '@/lib/session'

interface AuthApi {
  user: SessionUser | null
  login: (login: string, password: string, pin: string) => Promise<SessionUser>
  logout: () => void
}

const AuthContext = createContext<AuthApi | null>(null)
const MAX_TIMEOUT_MS = 2_147_483_647

export function AuthProvider({ children }: { children: ReactNode }) {
  // Sessão do papel da rota; se não houver (ex.: jogador abriu /mestre), a última usada,
  // para o RequireRole mandar a pessoa para a área dela em vez do login.
  const [session, setSession] = useState<Session | null>(() => getSession() ?? getSession(null))
  const queryClient = useQueryClient()

  const logout = useCallback(() => {
    clearSession(session?.user.role)
    setSession(null)
    queryClient.clear()
  }, [session?.user.role, queryClient])

  // Encerra a sessão quando o token vence, sem esperar um 401.
  useEffect(() => {
    if (!session) return undefined
    const expiresAt = tokenExpiresAt(session.token)
    if (!expiresAt) return undefined
    const delay = Math.max(0, expiresAt - Date.now())
    // setTimeout estoura acima de ~24,8 dias e dispararia na hora.
    if (delay > MAX_TIMEOUT_MS) return undefined
    const timer = setTimeout(logout, delay)
    return () => clearTimeout(timer)
  }, [session, logout])

  const login = useCallback(async (loginName: string, password: string, pin: string) => {
    const { data } = await http.post<LoginResponse>('/api/auth/login', { login: loginName, password, pin })
    const next: Session = { token: data.access_token, user: { id: data.user_id, login: data.login, role: data.role } }
    saveSession(next)
    setSession(next)
    return next.user
  }, [])

  const value = useMemo(() => ({ user: session?.user ?? null, login, logout }), [session, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthApi {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth precisa de AuthProvider')
  return context
}

export function useCurrentUser(): SessionUser {
  const { user } = useAuth()
  if (!user) throw new Error('Rota protegida sem usuário')
  return user
}
