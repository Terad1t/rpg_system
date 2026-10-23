import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode
  eyebrow?: string
  actions?: ReactNode
  padded?: boolean
}

/** Superfície básica das telas (cartão com borda dourada discreta). */
export function Panel({ title, eyebrow, actions, padded = true, className, children, ...props }: PanelProps) {
  return (
    <section className={cn('rounded-lg border border-line bg-surface/90 shadow-rune backdrop-blur-xs', className)} {...props}>
      {(title || actions || eyebrow) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h2 className="truncate text-lg font-bold text-parchment">{title}</h2>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(padded && 'p-5')}>{children}</div>
    </section>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gold-bright sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-parchment-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

/** Separador ornamental entre seções. */
export function Divider({ label }: { label?: string }) {
  return (
    <div className="my-4 flex items-center gap-3 text-parchment-faint" role="separator">
      <span className="h-px flex-1 bg-linear-to-r from-transparent via-line-strong to-transparent" />
      {label && <span className="font-display text-xs tracking-[0.3em]">{label}</span>}
      <span className="h-px flex-1 bg-linear-to-r from-transparent via-line-strong to-transparent" />
    </div>
  )
}
