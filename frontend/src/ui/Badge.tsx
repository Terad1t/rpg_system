import type { ReactNode } from 'react'
import { cn } from './cn'

type Tone = 'neutral' | 'gold' | 'arcane' | 'blood' | 'moss' | 'amber'

const TONES: Record<Tone, string> = {
  neutral: 'border-line-strong text-parchment-muted',
  gold: 'border-gold/50 bg-gold/10 text-gold-bright',
  arcane: 'border-arcane/50 bg-arcane/10 text-arcane',
  blood: 'border-blood/50 bg-blood/10 text-blood',
  moss: 'border-moss/50 bg-moss/10 text-moss',
  amber: 'border-amber/50 bg-amber/10 text-amber',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', TONES[tone], className)}>
      {children}
    </span>
  )
}

/** Ponto de status com texto (nunca só a cor). */
export function StatusDot({ online, label }: { online: boolean; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-parchment-muted">
      <span className={cn('h-2 w-2 rounded-full', online ? 'bg-moss' : 'bg-parchment-faint/50')} aria-hidden />
      {label ?? (online ? 'ao vivo' : 'offline')}
    </span>
  )
}
