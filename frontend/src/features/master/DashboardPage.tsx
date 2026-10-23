import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Gem, ScrollText, Swords, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts'
import { useFightStats, useOverview } from '@/api/queries'
import type { FightHistoryItem, RankingItem } from '@/api/types'
import { FIGHT_STATUS_LABELS, formatDateTime, formatNumber } from '@/lib/format'
import { Badge } from '@/ui/Badge'
import { EmptyState, QueryBoundary } from '@/ui/feedback'
import { PageHeader, Panel } from '@/ui/Panel'
import { StatTile } from '@/ui/misc'
import { cn } from '@/ui/cn'

const SERIES = [
  { key: 'players', label: 'Jogadores', color: 'var(--series-players)' },
  { key: 'enemies', label: 'Inimigos', color: 'var(--series-enemies)' },
] as const

type Metric = 'damage' | 'healing'

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-line-strong bg-surface-raised px-3 py-2 text-xs shadow-rune">
      <p className="mb-1 font-semibold text-parchment">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey as string} className="flex items-center gap-2 text-parchment-muted">
          <span className="h-2.5 w-2.5 rounded-xs" style={{ background: entry.color }} aria-hidden />
          {entry.name}: <span className="tabular-nums text-parchment">{formatNumber(entry.value as number)}</span>
        </p>
      ))}
    </div>
  )
}

function FightChart({ history }: { history: FightHistoryItem[] }) {
  const [metric, setMetric] = useState<Metric>('damage')
  const [showTable, setShowTable] = useState(false)
  const data = history.slice(-12).map((fight) => ({
    name: fight.name,
    players: metric === 'damage' ? fight.player_damage : fight.player_healing,
    enemies: metric === 'damage' ? fight.enemy_damage : fight.enemy_healing,
  }))

  return (
    <Panel
      title={metric === 'damage' ? 'Dano por luta' : 'Cura por luta'}
      eyebrow="Últimas 12 lutas"
      actions={
        <div className="flex items-center gap-2">
          <div role="radiogroup" aria-label="Métrica" className="flex rounded-md border border-line p-0.5">
            {(['damage', 'healing'] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={metric === value}
                onClick={() => setMetric(value)}
                className={cn('rounded-sm px-3 py-1 text-xs font-semibold', metric === value ? 'bg-gold/20 text-gold-bright' : 'text-parchment-muted hover:text-parchment')}
              >
                {value === 'damage' ? 'Dano' : 'Cura'}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setShowTable((v) => !v)} className="text-xs text-parchment-muted underline-offset-2 hover:text-parchment hover:underline">
            {showTable ? 'Ver gráfico' : 'Ver tabela'}
          </button>
        </div>
      }
    >
      {data.length === 0 ? (
        <EmptyState title="Nenhuma luta registrada">As estatísticas aparecem depois da primeira luta.</EmptyState>
      ) : showTable ? (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-parchment-faint">
            <tr>
              <th className="py-2 font-semibold">Luta</th>
              {SERIES.map((s) => (
                <th key={s.key} className="py-2 text-right font-semibold">{s.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.map((row) => (
              <tr key={row.name}>
                <td className="py-2 text-parchment">{row.name}</td>
                <td className="py-2 text-right tabular-nums text-parchment">{formatNumber(row.players)}</td>
                <td className="py-2 text-right tabular-nums text-parchment">{formatNumber(row.enemies)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <>
          <ul className="mb-3 flex gap-4 text-xs text-parchment-muted" aria-label="Legenda">
            {SERIES.map((s) => (
              <li key={s.key} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs" style={{ background: s.color }} aria-hidden />
                {s.label}
              </li>
            ))}
          </ul>
          <div className="h-64" role="img" aria-label={`Gráfico de ${metric === 'damage' ? 'dano' : 'cura'} por luta, jogadores contra inimigos`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={2} barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke="rgb(var(--line))" strokeDasharray="0" />
                <XAxis dataKey="name" tick={{ fill: 'rgb(var(--text-faint))', fontSize: 11 }} axisLine={{ stroke: 'rgb(var(--line-strong))' }} tickLine={false} />
                <YAxis tick={{ fill: 'rgb(var(--text-faint))', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(var(--gold) / 0.06)' }} />
                {SERIES.map((s) => (
                  <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={28} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Panel>
  )
}

function Ranking({ title, items }: { title: string; items: RankingItem[] }) {
  const max = Math.max(1, ...items.map((item) => item.value))
  return (
    <Panel title={title}>
      {items.length === 0 ? (
        <p className="text-sm text-parchment-faint">Sem dados ainda.</p>
      ) : (
        <ol className="space-y-3">
          {items.slice(0, 5).map((item, index) => (
            <li key={item.name}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-parchment">
                  <span className="mr-2 font-display text-gold">{index + 1}.</span>
                  {item.name}
                </span>
                <span className="tabular-nums text-parchment-muted">{formatNumber(item.value)}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-surface-sunken">
                <div className="h-full rounded-full bg-gold/70" style={{ width: `${(item.value / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}

export function DashboardPage() {
  const overview = useOverview()
  const stats = useFightStats()

  return (
    <>
      <PageHeader title="Visão geral" subtitle="O estado da mesa em um relance." />

      <QueryBoundary query={overview}>
        {(o) => (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Jogadores ativos" value={formatNumber(o.players)} icon={<Users className="h-5 w-5" />} />
            <StatTile label="Personagens" value={formatNumber(o.characters)} icon={<Users className="h-5 w-5" />} hint={`${o.player_characters} de jogadores`} />
            <StatTile label="Lutas" value={formatNumber(o.fights)} icon={<Swords className="h-5 w-5" />} />
            <Link to="/mestre/solicitacoes" className="rounded-lg focus-visible:outline-gold">
              <StatTile
                label="Solicitações pendentes"
                value={formatNumber(o.pending_requests)}
                icon={<ScrollText className="h-5 w-5" />}
                hint={o.pending_requests > 0 ? 'Clique para avaliar' : 'Tudo em dia'}
              />
            </Link>
          </div>
        )}
      </QueryBoundary>

      <div className="mt-6">
        <QueryBoundary query={stats}>
          {(s) => (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="space-y-6">
                <FightChart history={s.history} />
                <Panel title="Lutas recentes" padded={false}>
                  {s.history.length === 0 ? (
                    <div className="p-5">
                      <EmptyState title="Nenhuma luta ainda" icon={<Gem className="h-6 w-6" />} />
                    </div>
                  ) : (
                    <ul className="divide-y divide-line">
                      {[...s.history].reverse().slice(0, 6).map((fight) => (
                        <li key={fight.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                          <div>
                            <p className="font-semibold text-parchment">{fight.name}</p>
                            <p className="text-xs text-parchment-faint">{formatDateTime(fight.started_at)}</p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-parchment-muted">
                            <span>Dano {formatNumber(fight.player_damage)} × {formatNumber(fight.enemy_damage)}</span>
                            <Badge tone={fight.status === 'in_progress' ? 'gold' : 'neutral'}>{FIGHT_STATUS_LABELS[fight.status] ?? fight.status}</Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </div>
              <div className="space-y-6">
                <Ranking title="Mais dano (jogadores)" items={s.player_ranking} />
                <Ranking title="Mais dano (inimigos)" items={s.enemy_ranking} />
              </div>
            </div>
          )}
        </QueryBoundary>
      </div>
    </>
  )
}
