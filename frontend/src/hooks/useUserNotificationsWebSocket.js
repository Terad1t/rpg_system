import { useNotifications } from '../context/NotificationsContext'

/**
 * Compatibilidade: as telas continuam chamando este hook, mas a conexão é
 * única e fica no NotificationsProvider. Prefira `useNotificationEvent` em código novo.
 */
export function useUserNotificationsWebSocket() {
  const { isConnected, notifications, clearNotifications } = useNotifications()
  return { isConnected, notifications, clearNotifications }
}
