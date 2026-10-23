import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { keys } from '@/api/queries'
import type { Notification } from '@/api/types'
import { useAuth } from '@/auth/AuthProvider'
import { useSocket } from './useSocket'

type Listener = (message: Notification) => void

interface NotificationsApi {
  notifications: Notification[]
  unread: number
  isConnected: boolean
  markAllRead: () => void
  clear: () => void
  subscribe: (listener: Listener) => () => void
}

const NotificationsContext = createContext<NotificationsApi | null>(null)
const MAX_KEPT = 50

// Eventos que deixam dados em cache desatualizados: recarrega automaticamente.
const INVALIDATIONS: Record<string, (data: Record<string, unknown>) => readonly unknown[][]> = {
  character_request_created: () => [[...keys.requests], [...keys.overview]],
  character_request_approved: () => [[...keys.panel], ['my-requests']],
  character_request_rejected: () => [['my-requests']],
  character_applied: () => [[...keys.panel]],
  character_effects_updated: () => [[...keys.panel], [...keys.masterCharacters]],
  character_visibility_changed: () => [[...keys.panel]],
  fight_invite_response: (data) => [[...keys.fightResponses(Number(data.fight_id))]],
  fight_invite_results: (data) => [[...keys.fightResponses(Number(data.fight_id))]],
  fight_started: (data) => [[...keys.fight(Number(data.fight_id))], [...keys.fights]],
  fight_event: (data) => [[...keys.fight(Number(data.fight_id))], [...keys.fights], [...keys.fightStats]],
  turn_changed: (data) => [[...keys.fightTurn(Number(data.fight_id))]],
}

/** Uma conexão /ws/user-updates/{id} por sessão, compartilhada pelas telas. */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [readCount, setReadCount] = useState(0)
  const listeners = useRef(new Set<Listener>())

  const handleMessage = useCallback(
    (message: Notification) => {
      if (!message?.type) return
      setNotifications((prev) => [...prev, message].slice(-MAX_KEPT))
      for (const key of INVALIDATIONS[message.type]?.(message.data ?? {}) ?? []) {
        queryClient.invalidateQueries({ queryKey: key })
      }
      for (const listener of listeners.current) listener(message)
    },
    [queryClient],
  )

  const { isConnected } = useSocket<Notification>(user ? `/ws/user-updates/${user.id}` : null, handleMessage)

  useEffect(() => {
    setNotifications([])
    setReadCount(0)
  }, [user?.id])

  const subscribe = useCallback((listener: Listener) => {
    listeners.current.add(listener)
    return () => {
      listeners.current.delete(listener)
    }
  }, [])

  const value = useMemo<NotificationsApi>(
    () => ({
      notifications,
      unread: Math.max(0, notifications.length - readCount),
      isConnected,
      markAllRead: () => setReadCount(notifications.length),
      clear: () => {
        setNotifications([])
        setReadCount(0)
      },
      subscribe,
    }),
    [notifications, readCount, isConnected, subscribe],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications(): NotificationsApi {
  const context = useContext(NotificationsContext)
  if (!context) throw new Error('useNotifications precisa de NotificationsProvider')
  return context
}

/** Chama `handler` para cada notificação dos tipos indicados (sem perder eventos simultâneos). */
export function useNotificationEvent<T = Record<string, unknown>>(types: string | string[], handler: (message: Notification<T>) => void) {
  const { subscribe } = useNotifications()
  const handlerRef = useRef(handler)
  const typesKey = ([] as string[]).concat(types).join('|')

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    const accepted = new Set(typesKey.split('|'))
    return subscribe((message) => {
      if (accepted.has(message.type)) handlerRef.current(message as Notification<T>)
    })
  }, [subscribe, typesKey])
}
