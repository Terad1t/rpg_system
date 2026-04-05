import React, { createContext, useState, useContext, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Carregar usuário do localStorage ao iniciar
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      setUser(JSON.parse(userData))
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    setLoading(false)
  }, [])

  const login = async (login, password, pin) => {
    try {
      setError(null)
      const response = await api.post('/auth/login', { login, password, pin })
      const { access_token, user_id, role } = response.data
      const userData = { id: user_id, login, role }
      
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(userData))
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      setUser(userData)
      return userData
    } catch (err) {
      const message = err.response?.data?.detail || 'Erro ao fazer login'
      setError(message)
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
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
