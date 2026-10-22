import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { errorMessage } from '../services/api'
import { clearSession, dropLegacySession, getSession, saveSession, tokenExpiresAt } from '../lib/session'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSession())
  const [error, setError] = useState(null)

  useEffect(() => {
    dropLegacySession()
  }, [])

  const logout = useCallback(() => {
    clearSession(session?.user?.role)
    setSession(null)
  }, [session?.user?.role])

  // Encerra a sessão sozinho quando o token vence, em vez de esperar um 401.
  useEffect(() => {
    if (!session?.token) return undefined
    const expiresAt = tokenExpiresAt(session.token)
    if (!expiresAt) return undefined
    const timer = setTimeout(logout, Math.max(0, expiresAt - Date.now()))
    return () => clearTimeout(timer)
  }, [session?.token, logout])

  const login = useCallback(async (loginName, password, pin) => {
    setError(null)
    try {
      const { data } = await api.post('/api/auth/login', { login: loginName, password, pin })
      const next = {
        token: data.access_token,
        user: { id: data.user_id, login: data.login ?? loginName, role: data.role },
      }
      saveSession(next)
      setSession(next)
      return next.user
    } catch (err) {
      const message =
        err.response?.status === 401
          ? 'Usuário, senha ou PIN incorretos.'
          : err.response?.status === 429
            ? 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
            : errorMessage(err, 'Erro ao fazer login.')
      setError(message)
      throw err
    }
  }, [])

  const value = useMemo(
    () => ({ user: session?.user ?? null, loading: false, error, login, logout }),
    [session?.user, error, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
