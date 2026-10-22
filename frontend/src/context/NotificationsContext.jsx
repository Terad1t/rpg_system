import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSocket } from '../hooks/useSocket'
import { useAuth } from './AuthContext'

const MAX_NOTIFICATIONS = 50
const NotificationsContext = createContext(null)

/**
 * Uma única conexão com /ws/user-updates/{id} por sessão.
 * Telas leem `notifications` (histórico recente) ou assinam tipos com `useNotificationEvent`.
 */
export function NotificationsProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const listenersRef = useRef(new Set())

  const handleMessage = useCallback((message) => {
    if (!message?.type) return
    setNotifications((prev) => [...prev, message].slice(-MAX_NOTIFICATIONS))
    for (const listener of listenersRef.current) listener(message)
  }, [])

  const { isConnected } = useSocket(user?.id ? `/ws/user-updates/${user.id}` : null, handleMessage)

  useEffect(() => {
    setNotifications([])
  }, [user?.id])

  const subscribe = useCallback((listener) => {
    listenersRef.current.add(listener)
    return () => listenersRef.current.delete(listener)
  }, [])

  const clearNotifications = useCallback(() => setNotifications([]), [])

  const value = useMemo(
    () => ({ notifications, isConnected, clearNotifications, subscribe }),
    [notifications, isConnected, clearNotifications, subscribe],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) throw new Error('useNotifications deve ser usado dentro de NotificationsProvider')
  return context
}

/**
 * Chama `handler(message)` para cada notificação dos tipos indicados, sem perder
 * eventos que chegam juntos (diferente de olhar só a última notificação).
 */
export function useNotificationEvent(types, handler) {
  const { subscribe } = useNotifications()
  const handlerRef = useRef(handler)
  const typesKey = [].concat(types).join('|')

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    const accepted = new Set(typesKey.split('|'))
    return subscribe((message) => {
      if (accepted.has(message.type)) handlerRef.current?.(message)
    })
  }, [subscribe, typesKey])
}
