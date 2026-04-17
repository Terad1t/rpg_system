import { useMemo, useState } from 'react'

function formatNotification(n) {
  if (!n) return 'Notificação'

  const type = n.type || 'notification'
  const ts = n.timestamp ? new Date(n.timestamp).toLocaleString() : null

  if (type === 'character_request_created') {
    const name = n.data?.name || 'Personagem'
    const playerLogin = n.data?.player_login
    const playerId = n.data?.player_id
    const who = playerLogin ? playerLogin : (playerId ? `ID ${playerId}` : 'jogador')
    return `${name} — nova solicitação (${who})${ts ? ` • ${ts}` : ''}`
  }

  if (type === 'rule_notice') {
    const msg = n.data?.message || 'Aviso'
    return `${msg}${ts ? ` • ${ts}` : ''}`
  }

  try {
    return `${type}${ts ? ` • ${ts}` : ''} — ${JSON.stringify(n.data ?? n)}`
  } catch {
    return `${type}${ts ? ` • ${ts}` : ''}`
  }
}

export default function NotificationCenter({ notifications = [], isConnected = false, onClear }) {
  const [open, setOpen] = useState(false)

  const items = useMemo(() => {
    return (notifications || []).slice().reverse()
  }, [notifications])

  const unreadCount = notifications?.length || 0

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative px-3 py-2 rounded-lg bg-dark border border-dark-border hover:border-orange-500 transition"
        aria-label="Notificações"
      >
        <span className="text-secondary text-sm">Notificações</span>
        <span
          className={`ml-2 inline-block h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          title={isConnected ? 'Conectado' : 'Desconectado'}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[420px] max-w-[90vw] bg-dark-secondary border border-dark-border rounded-lg shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
            <div>
              <p className="text-white font-semibold">Caixa de notificações</p>
              <p className="text-secondary text-xs">
                {isConnected ? 'Tempo real ativo' : 'Tempo real indisponível'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onClear) onClear()
              }}
              className="text-sm text-secondary hover:text-white transition"
              disabled={!onClear || unreadCount === 0}
            >
              Limpar
            </button>
          </div>

          <div className="max-h-[420px] overflow-auto">
            {items.length === 0 ? (
              <div className="px-4 py-6 text-secondary text-sm">Sem notificações.</div>
            ) : (
              <ul className="divide-y divide-dark-border">
                {items.map((n, idx) => (
                  <li key={n.timestamp ? `${n.timestamp}-${idx}` : idx} className="px-4 py-3">
                    <p className="text-sm text-white whitespace-pre-wrap break-words">
                      {formatNotification(n)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
