import { useCallback, useEffect, useRef, useState } from 'react'
import { getToken } from '../lib/session'

const MAX_RETRY_DELAY = 15000
// Códigos com que o servidor recusa a conexão (token inválido, sem permissão): não adianta reconectar.
const NO_RETRY_CODES = new Set([1008, 4401, 4403])

export function buildSocketUrl(path, token) {
  const configured = import.meta.env.VITE_WS_URL
  const base = configured || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
  const separator = path.includes('?') ? '&' : '?'
  return `${base}${path}${separator}token=${encodeURIComponent(token)}`
}

/**
 * Conexão WebSocket autenticada com reconexão automática (backoff exponencial).
 *
 * @param {string|null} path  caminho no servidor (ex.: `/ws/user-updates/3`); null desliga.
 * @param {(message: any) => void} onMessage  chamado com cada mensagem JSON.
 * @returns {{ isConnected: boolean, send: (data: any) => boolean }}
 */
export function useSocket(path, onMessage) {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef(null)
  const onMessageRef = useRef(onMessage)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    if (!path) return undefined
    let retryDelay = 1000
    let retryTimer = null
    let stopped = false

    const connect = () => {
      const token = getToken()
      if (!token) return
      const socket = new WebSocket(buildSocketUrl(path, token))
      socketRef.current = socket

      socket.onopen = () => {
        retryDelay = 1000
        setIsConnected(true)
      }
      socket.onmessage = (event) => {
        try {
          onMessageRef.current?.(JSON.parse(event.data))
        } catch {
          // Mensagem que não é JSON: ignorada.
        }
      }
      socket.onclose = (event) => {
        setIsConnected(false)
        if (stopped || NO_RETRY_CODES.has(event.code)) return
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

  const send = useCallback((data) => {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) return false
    socket.send(JSON.stringify(data))
    return true
  }, [])

  return { isConnected, send }
}
