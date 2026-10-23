import { Heart, Sparkles } from 'lucide-react'
import { cn } from './cn'

const KINDS = {
  hp: { label: 'Vida', bar: 'bg-gradient-to-r from-blood/80 to-blood', Icon: Heart },
  mana: { label: 'Mana', bar: 'bg-gradient-to-r from-arcane/80 to-arcane', Icon: Sparkles },
} as const

export function StatBar({ kind, current, max, compact = false }: { kind: keyof typeof KINDS; current: number | null; max: number | null; compact?: boolean }) {
  const { label, bar, Icon } = KINDS[kind]
  const value = current ?? 0
  const total = max ?? 0
  const percent = total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 font-semibold text-parchment-muted">
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {label}
        </span>
        <span className="tabular-nums text-parchment">
          {value} / {total}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={value}
        className={cn('overflow-hidden rounded-full border border-line bg-surface-sunken', compact ? 'h-1.5' : 'h-2.5')}
      >
        <div className={cn('h-full rounded-full transition-[width] duration-500', bar)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
