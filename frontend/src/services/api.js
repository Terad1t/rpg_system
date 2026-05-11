import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

console.log('[API] Baseurl:', API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10s timeout
})

// Interceptor para adicionar token ao header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  console.log('[API] Request:', config.method?.toUpperCase(), config.url)
  return config
})

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => {
    console.log('[API] Response OK:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('[API] Response Error:', error.message, error.response?.status, error.config?.url)
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
