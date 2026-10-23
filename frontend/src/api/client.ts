import axios, { AxiosError } from 'axios'
import { clearSession, getToken, roleFromPath } from '@/lib/session'

// Vazio = mesma origem (em dev o Vite faz proxy de /api, /ws e /static).
export const API_BASE_URL: string = import.meta.env.VITE_API_URL || ''

export const http = axios.create({ baseURL: API_BASE_URL, timeout: 15000 })

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isLogin = error.config?.url?.includes('/api/auth/login')
    if (error.response?.status === 401 && !isLogin) {
      clearSession(roleFromPath())
      if (window.location.pathname !== '/entrar') window.location.assign('/entrar')
    }
    return Promise.reject(error)
  },
)

interface ValidationIssue {
  loc?: (string | number)[]
  msg: string
}

/** Mensagem legível de um erro do axios/FastAPI (inclui erros de validação 422). */
export function errorMessage(error: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  const err = error as AxiosError<{ detail?: string | ValidationIssue[] }>
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((issue) => {
        const field = (issue.loc ?? []).filter((part) => part !== 'body').join('.')
        return field ? `${field}: ${issue.msg}` : issue.msg
      })
      .join('; ')
  }
  if (err?.code === 'ECONNABORTED') return 'O servidor demorou para responder.'
  if (err?.message === 'Network Error') return 'Não foi possível falar com o servidor.'
  return fallback
}

/** URL para arquivos servidos pela API (ex.: /static/uploads/...). */
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^https?:\/\//.test(path)) return path
  return `${API_BASE_URL}${path}`
}

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return (await http.get<T>(url, { params })).data
}

export async function post<T>(url: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
  return (await http.post<T>(url, body, { params })).data
}

export async function put<T>(url: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
  return (await http.put<T>(url, body, { params })).data
}

export async function del<T>(url: string): Promise<T> {
  return (await http.delete<T>(url)).data
}
