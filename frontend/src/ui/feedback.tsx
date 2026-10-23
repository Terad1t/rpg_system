import type { ReactNode } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { errorMessage } from '@/api/client'
import { cn } from './cn'

export function Spinner({ label = 'Carregando...', className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn('flex items-center gap-2 text-sm text-parchment-muted', className)}>
      <Loader2 className="h-4 w-4 animate-spin text-gold" aria-hidden />
      {label}
    </div>
  )
}

export function FullScreenLoader({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner label={label} />
    </div>
  )
}

export function EmptyState({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line px-6 py-10 text-center">
      {icon && <div className="text-gold/70">{icon}</div>}
      <p className="font-display text-base text-parchment">{title}</p>
      {children && <div className="max-w-md text-sm text-parchment-muted">{children}</div>}
    </div>
  )
}

export function ErrorNotice({ error, fallback }: { error: unknown; fallback?: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-md border border-blood/40 bg-blood/10 px-4 py-3 text-sm text-parchment">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-blood" aria-hidden />
      {errorMessage(error, fallback)}
    </div>
  )
}

interface QueryLike<T> {
  data: T | undefined
  isPending: boolean
  isError: boolean
  error: unknown
}

/** Mostra carregando/erro e só renderiza o conteúdo quando os dados existem. */
export function QueryBoundary<T>({ query, children, label }: { query: QueryLike<T>; children: (data: T) => ReactNode; label?: string }) {
  if (query.isPending) return <Spinner label={label} className="py-6" />
  if (query.isError || query.data === undefined) return <ErrorNotice error={query.error} />
  return <>{children(query.data)}</>
}
