import { Dices } from 'lucide-react'

export function Brand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-md border border-gold/50 bg-gold/10 text-gold shadow-glow">
        <Dices className="h-5 w-5" aria-hidden />
      </span>
      <div className="leading-tight">
        <p className="font-display text-lg font-bold tracking-[0.15em] text-parchment">RPG SYSTEM</p>
        {subtitle && <p className="text-[11px] uppercase tracking-[0.25em] text-gold">{subtitle}</p>}
      </div>
    </div>
  )
}
