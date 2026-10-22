import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, Button } from '../common'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../hooks/useSocket'

const MAX_MESSAGES = 200
const SYSTEM_TYPES = new Set(['system', 'error', 'user_joined', 'user_left'])

function formatTimestamp(createdAt) {
  const date = createdAt ? new Date(createdAt) : new Date()
  const valid = Number.isNaN(date.getTime()) ? new Date() : date
  return valid.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

let localMessageId = 0

function normalizeMessage(data, userId) {
  localMessageId += 1
  return {
    id: data.id ? `msg-${data.id}` : `local-${localMessageId}`,
    author: data.username || 'Sistema',
    message: data.message || '',
    timestamp: formatTimestamp(data.created_at),
    isOwn: data.user_id === userId,
    messageType: data.message_type || 'message',
  }
}

export default function PlayerChat({
  compact = false,
  defaultCollapsed = false,
  className = '',
  identityLabel = '',
  characterId = null,
  embedded = false,
  dock = 'right',
}) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    setIsCollapsed(defaultCollapsed)
  }, [defaultCollapsed])

  const handleIncoming = useCallback(
    (data) => {
      setMessages((prev) => {
        const next = normalizeMessage(data, user?.id)
        // O histórico reenviado ao reconectar não deve duplicar mensagens já exibidas.
        if (data.id && prev.some((msg) => msg.id === next.id)) return prev
        return [...prev, next].slice(-MAX_MESSAGES)
      })
    },
    [user?.id],
  )

  const path = user?.role === 'player' ? `/api/chat/ws${characterId ? `?character_id=${characterId}` : ''}` : null
  const { isConnected, send } = useSocket(path, handleIncoming)

  useEffect(() => {
    setMessages([])
  }, [path])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = () => {
    const text = newMessage.trim()
    if (text && send({ message: text })) setNewMessage('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (compact && isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => setIsCollapsed(false)}
        className={`fixed bottom-4 z-50 rounded-full border border-cyan-400/40 bg-[#07111fe6] px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200 shadow-[0_0_24px_rgba(56,189,248,0.15)] backdrop-blur ${dock === 'left' ? 'left-4' : 'right-4'} ${className}`}
      >
        Chat {identityLabel ? `• ${identityLabel}` : ''}
      </button>
    )
  }

  return (
    <div
      className={compact
        ? `fixed bottom-4 z-50 left-4 right-4 sm:w-[24rem] ${dock === 'left' ? 'sm:left-4 sm:right-auto' : 'sm:left-auto sm:right-4'} ${className}`
        : embedded
          ? `flex h-full min-h-0 w-full flex-col ${className}`
          : `mx-auto flex h-[calc(100vh-200px)] w-full max-w-4xl flex-col ${className}`
      }
    >
      <Card className="flex h-full flex-col border border-white/10 bg-[#08111f]/95 shadow-[0_0_32px_rgba(0,0,0,0.28)]">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200/75">Comunicação</p>
            <h3 className="mt-2 text-lg font-bold text-white">
              {identityLabel ? `Chat de ${identityLabel}` : 'Chat Global'}
            </h3>
            {identityLabel && (
              <p className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-400">
                Personagem ativo: {identityLabel}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-500'}`} />
              <span className="text-xs uppercase tracking-[0.25em] text-slate-300">
                {isConnected ? 'Conectado' : 'Offline'}
              </span>
            </div>
            {compact && (
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-300 transition hover:border-cyan-400/40 hover:text-white"
              >
                Fechar
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-2">
          {messages.length === 0 ? (
            <div className="flex h-full min-h-0 items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/5 p-6 text-center">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Chat pronto</p>
                <p className="mt-2 text-sm text-slate-300">
                  {isConnected ? 'Nenhuma mensagem ainda. Diga olá para a mesa!' : 'Conectando ao chat...'}
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isSystem = SYSTEM_TYPES.has(msg.messageType)
              const isHistory = msg.messageType === 'history'

              return (
                <div
                  key={msg.id}
                  className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'} ${isSystem ? 'justify-center' : ''}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      isSystem
                        ? 'border border-white/10 bg-white/5 text-center text-slate-200'
                        : msg.isOwn
                          ? 'rounded-br-sm bg-cyan-500/20 text-white'
                          : isHistory
                            ? 'rounded-bl-sm border border-white/10 bg-[#0c1528] text-white'
                            : 'rounded-bl-sm border border-white/10 bg-[#0c1528] text-white'
                    }`}
                  >
                    {!msg.isOwn && !isSystem && (
                      <p className="mb-1 text-[11px] uppercase tracking-[0.3em] text-cyan-200/80">
                        {msg.author}
                      </p>
                    )}
                    {isSystem && (
                      <p className="mb-1 text-[11px] uppercase tracking-[0.3em] text-orange-200">
                        Sistema
                      </p>
                    )}
                    <p className="text-sm leading-6 text-slate-100">{msg.message}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-4 flex gap-3 border-t border-white/10 pt-4">
          <textarea
            aria-label="Mensagem"
            maxLength={1000}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={identityLabel ? `Falar como ${identityLabel}...` : 'Digite sua mensagem...'}
            className="flex-1 resize-none rounded-xl border border-white/10 bg-[#050b18] px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
            rows={compact || embedded ? 2 : 3}
            disabled={!isConnected}
          />
          <Button
            variant="primary"
            onClick={handleSendMessage}
            disabled={!isConnected || !newMessage.trim()}
            className="self-end whitespace-nowrap shadow-[0_0_18px_rgba(56,189,248,0.18)]"
          >
            Enviar
          </Button>
        </div>
      </Card>
    </div>
  )
}
