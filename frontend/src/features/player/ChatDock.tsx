import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import type { ChatMessage } from '@/api/types'
import { useCurrentUser } from '@/auth/AuthProvider'
import { formatTime } from '@/lib/format'
import { useSocket } from '@/realtime/useSocket'
import { StatusDot } from '@/ui/Badge'
import { cn } from '@/ui/cn'

const MAX_KEPT = 200
const SYSTEM = new Set(['system', 'error', 'user_joined', 'user_left'])

interface Line extends ChatMessage {
  key: string
}

let localId = 0

/** Chat global da mesa, recolhido num botão flutuante. */
export function ChatDock({ characterId, displayName }: { characterId: number; displayName: string }) {
  const me = useCurrentUser()
  const [open, setOpen] = useState(false)
  const [lines, setLines] = useState<Line[]>([])
  const [unread, setUnread] = useState(0)
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLOListElement>(null)
  const openRef = useRef(open)
  openRef.current = open

  const onMessage = useCallback((message: ChatMessage) => {
    const key = message.id ? `m-${message.id}` : `l-${++localId}`
    setLines((prev) => (message.id && prev.some((line) => line.key === key) ? prev : [...prev, { ...message, key }].slice(-MAX_KEPT)))
    if (!openRef.current && message.message_type === 'message') setUnread((n) => n + 1)
  }, [])

  const path = `/api/chat/ws?character_id=${characterId}`
  const { isConnected, send } = useSocket<ChatMessage>(path, onMessage)

  useEffect(() => setLines([]), [path])
  useEffect(() => {
    if (open) setUnread(0)
  }, [open])
  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView?.({ block: 'end' })
  }, [lines, open])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const message = draft.trim()
    if (message && send({ message })) setDraft('')
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-surface-raised px-4 py-3 text-sm font-semibold text-gold-bright shadow-rune hover:bg-surface"
      >
        <MessageCircle className="h-4 w-4" />
        Chat da mesa
        {unread > 0 && <span className="rounded-full bg-gold px-1.5 text-xs text-ink">{unread}</span>}
      </button>
    )
  }

  return (
    <section
      aria-label="Chat da mesa"
      className="fixed inset-x-2 bottom-2 z-40 flex h-[min(32rem,75vh)] flex-col rounded-lg border border-line-strong bg-surface shadow-rune sm:inset-x-auto sm:right-4 sm:w-96"
    >
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="font-display font-bold text-parchment">Chat da mesa</p>
          <StatusDot online={isConnected} label={isConnected ? `falando como ${displayName}` : 'conectando...'} />
        </div>
        <button type="button" aria-label="Fechar chat" onClick={() => setOpen(false)} className="rounded p-1 text-parchment-muted hover:text-parchment">
          <X className="h-5 w-5" />
        </button>
      </header>
      <ol ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3" aria-live="polite">
        {lines.length === 0 && <li className="py-8 text-center text-sm text-parchment-faint">Nenhuma mensagem ainda.</li>}
        {lines.map((line) => {
          if (SYSTEM.has(line.message_type)) {
            return (
              <li key={line.key} className={cn('text-center text-xs', line.message_type === 'error' ? 'text-blood' : 'text-parchment-faint')}>
                {line.message}
              </li>
            )
          }
          const own = line.user_id === me.id
          return (
            <li key={line.key} className={cn('flex flex-col', own ? 'items-end' : 'items-start')}>
              {!own && <span className="mb-0.5 text-[11px] font-semibold text-gold">{line.username}</span>}
              <p className={cn('max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm', own ? 'bg-gold/20 text-parchment' : 'bg-surface-raised text-parchment')}>
                {line.message}
              </p>
              <span className="mt-0.5 text-[10px] text-parchment-faint">{formatTime(line.created_at)}</span>
            </li>
          )
        })}
      </ol>
      <form onSubmit={submit} className="flex gap-2 border-t border-line p-3">
        <label className="sr-only" htmlFor="chat-input">
          Mensagem
        </label>
        <input
          id="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={1000}
          placeholder={isConnected ? 'Escreva para a mesa...' : 'Conectando...'}
          disabled={!isConnected}
          className="field-control flex-1"
        />
        <button type="submit" aria-label="Enviar" disabled={!isConnected || !draft.trim()} className="rounded-md bg-gold px-3 text-ink disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  )
}
