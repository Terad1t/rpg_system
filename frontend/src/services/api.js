import axios from 'axios'
import { clearSession, getToken, roleFromPath } from '../lib/session'

// Vazio = mesma origem (em dev o Vite faz proxy de /api e /ws para o backend).
export const API_BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/api/auth/login')
    if (error.response?.status === 401 && !isLoginRequest) {
      clearSession(roleFromPath() ?? undefined)
      if (window.location.pathname !== '/login') window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)

/** Mensagem legível de um erro do axios/FastAPI (inclui erros de validação 422). */
export function errorMessage(error, fallback = 'Algo deu errado. Tente novamente.') {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => {
        const field = Array.isArray(item.loc) ? item.loc.filter((part) => part !== 'body').join('.') : ''
        return field ? `${field}: ${item.msg}` : item.msg
      })
      .join('; ')
  }
  if (error?.code === 'ECONNABORTED') return 'O servidor demorou para responder.'
  if (error?.message === 'Network Error') return 'Não foi possível falar com o servidor.'
  return fallback
}

/** URL absoluta para arquivos servidos pela API (ex.: /static/uploads/...). */
export function assetUrl(path) {
  if (!path) return null
  if (/^https?:\/\//.test(path)) return path
  return `${API_BASE_URL}${path}`
}

export default api
