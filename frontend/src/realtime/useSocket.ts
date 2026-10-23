import { useCallback, useEffect, useRef, useState } from 'react'
import { getToken } from '@/lib/session'

const MAX_RETRY_DELAY = 15000

export function buildSocketUrl(path: string, token: string): string {
  const configured: string | undefined = import.meta.env.VITE_WS_URL
  const base = configured || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
  const separator = path.includes('?') ? '&' : '?'
  return `${base}${path}${separator}token=${encodeURIComponent(token)}`
}

/**
 * WebSocket autenticado com reconexão automática (espera dobra até 15 s).
 * `path` nulo desliga a conexão.
 */
export function useSocket<T = unknown>(path: string | null, onMessage: (message: T) => void) {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)
  const handlerRef = useRef(onMessage)

  useEffect(() => {
    handlerRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    if (!path) return undefined
    let retryDelay = 1000
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let stopped = false

    const connect = () => {
      const token = getToken()
      if (!token || stopped) return
      const socket = new WebSocket(buildSocketUrl(path, token))
      socketRef.current = socket
      socket.onopen = () => {
        retryDelay = 1000
        setIsConnected(true)
      }
      socket.onmessage = (event) => {
        try {
          handlerRef.current(JSON.parse(event.data) as T)
        } catch {
          // Mensagem que não é JSON: ignorada.
        }
      }
      socket.onclose = (event) => {
        setIsConnected(false)
        if (stopped || event.code === 1008) return // 1008 = recusado pelo servidor (token/permissão)
        retryTimer = setTimeout(connect, retryDelay)
        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY)
      }
    }

    connect()
    return () => {
      stopped = true
      clearTimeout(retryTimer)
      socketRef.current?.close()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [path])

  const send = useCallback((data: unknown) => {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) return false
    socket.send(JSON.stringify(data))
    return true
  }, [])

  return { isConnected, send }
}
