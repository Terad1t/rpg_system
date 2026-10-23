import { useState, type ReactNode } from 'react'
import { assetUrl } from '@/api/client'
import { cn } from './cn'

/** Retrato redondo com iniciais quando não há imagem. */
export function Avatar({ src, name, size = 'md', className }: { src?: string | null; name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-16 w-16 text-lg', xl: 'h-28 w-28 text-3xl' }
  const url = assetUrl(src)
  const [failed, setFailed] = useState<string | null>(null)
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  return (
    <div className={cn('relative shrink-0 overflow-hidden rounded-full border-2 border-gold/40 bg-surface-raised', sizes[size], className)}>
      {url && failed !== url ? (
        // Imagem quebrada (link antigo, arquivo removido) cai para as iniciais.
        <img src={url} alt="" className="h-full w-full object-cover" onError={() => setFailed(url)} />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-display font-bold text-gold">{initials || '?'}</span>
      )}
    </div>
  )
}

/** Número de destaque com rótulo (cartão do painel). */
export function StatTile({ label, value, icon, hint }: { label: string; value: ReactNode; icon?: ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface/90 p-4 shadow-rune">
      <div className="flex items-center justify-between text-parchment-muted">
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        {icon && <span className="text-gold" aria-hidden>{icon}</span>}
      </div>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums text-parchment">{value}</p>
      {hint && <p className="mt-1 text-xs text-parchment-faint">{hint}</p>}
    </div>
  )
}

interface TabsProps<T extends string> {
  tabs: { id: T; label: string; icon?: ReactNode }[]
  active: T
  onChange: (id: T) => void
  label: string
}

/** Abas acessíveis (setas do teclado mudam a aba). */
export function Tabs<T extends string>({ tabs, active, onChange, label }: TabsProps<T>) {
  const move = (delta: number) => {
    const index = tabs.findIndex((tab) => tab.id === active)
    const next = tabs[(index + delta + tabs.length) % tabs.length]
    onChange(next.id)
    document.getElementById(`tab-${next.id}`)?.focus()
  }
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          type="button"
          role="tab"
          aria-selected={tab.id === active}
          tabIndex={tab.id === active ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') move(1)
            if (event.key === 'ArrowLeft') move(-1)
          }}
          className={cn(
            '-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
            tab.id === active ? 'border-gold text-gold-bright' : 'border-transparent text-parchment-muted hover:text-parchment',
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
