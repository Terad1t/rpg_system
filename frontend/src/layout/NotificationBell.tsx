import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { describeNotification } from '@/lib/notifications'
import { formatTime } from '@/lib/format'
import { useNotifications } from '@/realtime/NotificationsProvider'
import { StatusDot } from '@/ui/Badge'

export function NotificationBell() {
  const { notifications, unread, isConnected, markAllRead, clear } = useNotifications()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return undefined
    markAllRead()
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
    // markAllRead muda a cada notificação; só marca ao abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={unread > 0 ? `Notificações (${unread} novas)` : 'Notificações'}
        className="relative rounded-md p-2 text-parchment-muted transition-colors hover:bg-surface-raised hover:text-parchment"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-[1.1rem] rounded-full bg-gold px-1 text-center text-[10px] font-bold leading-[1.1rem] text-ink">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(24rem,calc(100vw-2rem))] animate-fade-in rounded-lg border border-line-strong bg-surface shadow-rune">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="font-display font-bold text-parchment">Notificações</p>
              <StatusDot online={isConnected} label={isConnected ? 'tempo real ativo' : 'reconectando...'} />
            </div>
            <button type="button" onClick={clear} className="text-xs text-parchment-muted hover:text-parchment" disabled={!notifications.length}>
              Limpar
            </button>
          </div>
          <ul className="max-h-96 divide-y divide-line overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-parchment-faint">Nada por aqui ainda.</li>
            ) : (
              [...notifications].reverse().map((notification, index) => (
                <li key={`${notification.timestamp}-${index}`} className="px-4 py-3">
                  <p className="text-sm text-parchment">{describeNotification(notification)}</p>
                  <p className="mt-0.5 text-[11px] text-parchment-faint">{formatTime(notification.timestamp)}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
