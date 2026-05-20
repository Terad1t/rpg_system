import React, { createContext, useState, useContext, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

function getStorageKeys(role) {
  return {
    token: role ? `token:${role}` : 'token',
    user: role ? `user:${role}` : 'user',
  }
}

function getRouteRole() {
  const path = window.location.pathname || ''
  if (path.startsWith('/master')) return 'master'
  if (path.startsWith('/player')) return 'player'
  return null
}

function loadSessionForRole(role) {
  const { token, user } = getStorageKeys(role)
  const storedToken = localStorage.getItem(token)
  const storedUser = localStorage.getItem(user)

  if (!storedToken || !storedUser) return null

  try {
    return { token: storedToken, user: JSON.parse(storedUser) }
  } catch {
    return null
  }
}

function loadLegacySessionForRole(role) {
  const storedToken = localStorage.getItem('token')
  const storedUser = localStorage.getItem('user')

  if (!storedToken || !storedUser) return null

  try {
    const userData = JSON.parse(storedUser)
    if (role && userData?.role !== role) return null
    return { token: storedToken, user: userData }
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Carregar usuário do localStorage ao iniciar
  useEffect(() => {
    console.log('[AuthContext] useEffect start, pathname=', window.location.pathname)
    const preferredRole = getRouteRole()
    const session = loadSessionForRole(preferredRole)
      || loadLegacySessionForRole(preferredRole)
      || loadSessionForRole('master')
      || loadSessionForRole('player')
      || loadLegacySessionForRole('master')
      || loadLegacySessionForRole('player')

    if (session) {
      setUser(session.user)
      api.defaults.headers.common['Authorization'] = `Bearer ${session.token}`
      localStorage.setItem('active_role', session.user.role)
      console.log('[AuthContext] session loaded from storage for role', session.user.role)
    }
    console.log('[AuthContext] setting loading false')
    setLoading(false)
  }, [])

  const login = async (login, password, pin) => {
    try {
      setError(null)
      console.log('[AuthContext] login() START - credentials:', { login, password: '***', pin: '***' })
      
      const response = await api.post('/api/auth/login', { login, password, pin })
      console.log('[AuthContext] api.post response received:', response.status, response.data)
      
      const { access_token, user_id, role } = response.data
      const userData = { id: user_id, login, role }

      const { token, user } = getStorageKeys(role)
      localStorage.setItem(token, access_token)
      localStorage.setItem(user, JSON.stringify(userData))
      localStorage.setItem('active_role', role)
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      setUser(userData)
      console.log('[AuthContext] login() SUCCESS - user:', userData)
      return userData
    } catch (err) {
      console.error('[AuthContext] login() FAILED:', err.message, 'Status:', err.response?.status)
      const message = err.response?.data?.detail || err.message || 'Erro ao fazer login'
      setError(message)
      throw err
    }
  }

  const logout = () => {
    const role = user?.role || localStorage.getItem('active_role')
    const { token, user: userKey } = getStorageKeys(role)
    localStorage.removeItem(token)
    localStorage.removeItem(userKey)
    localStorage.removeItem('active_role')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  const signup = async (email, password, username) => {
    try {
      setError(null)
      const response = await api.post('/auth/users', { email, password, username })
      return response.data
    } catch (err) {
      const message = err.response?.data?.detail || 'Erro ao criar conta'
      setError(message)
      throw err
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
