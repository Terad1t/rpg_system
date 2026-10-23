import { useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, HeartPlus, Shield, Sparkles, Sword } from 'lucide-react'
import { post } from '@/api/client'
import { keys, useAction, useFight, useMyTurn, usePlayerPanel } from '@/api/queries'
import type { PlayerAction } from '@/api/types'
import { readPreference, selectedCharacterKey } from '@/lib/session'
import { useCurrentUser } from '@/auth/AuthProvider'
import { ACTION_LABELS, FIGHT_STATUS_LABELS, formatNumber, formatTime } from '@/lib/format'
import { Badge } from '@/ui/Badge'
import { Button } from '@/ui/Button'
import { SelectField, TextField } from '@/ui/Field'
import { QueryBoundary } from '@/ui/feedback'
import { Panel } from '@/ui/Panel'
import { cn } from '@/ui/cn'

const ACTIONS: { id: Exclude<PlayerAction, 'ready'>; icon: typeof Sword; needsValue: boolean }[] = [
  { id: 'attack', icon: Sword, needsValue: true },
  { id: 'heal', icon: HeartPlus, needsValue: true },
  { id: 'defend', icon: Shield, needsValue: false },
  { id: 'skill', icon: Sparkles, needsValue: true },
]

export function BattlePage() {
  const { fightId } = useParams()
  const id = Number(fightId)
  const location = useLocation()
  const me = useCurrentUser()
  const fight = useFight(id)
  const turn = useMyTurn(id)
  const panel = usePlayerPanel()
  const [action, setAction] = useState<(typeof ACTIONS)[number]['id']>('attack')
  const [value, setValue] = useState('5')
  const [characterId, setCharacterId] = useState(() => readPreference(selectedCharacterKey(me.id)) ?? '')

  const myTurn = Boolean(turn.data?.is_my_turn)
  const live = fight.data?.status === 'in_progress'
  const chosen = ACTIONS.find((a) => a.id === action)!

  const act = useAction(
    () =>
      post(`/api/fights/${id}/entries/player`, {
        action,
        value: chosen.needsValue ? Math.max(0, Number(value) || 0) : 0,
        actor_character_id: characterId ? Number(characterId) : undefined,
      }),
    { invalidate: [keys.fight(id)], success: 'Ação enviada!', failure: 'Não foi possível agir' },
  )

  const submit = (event: FormEvent) => {
    event.preventDefault()
    act.mutate()
  }

  const name = fight.data?.name ?? (location.state as { name?: string } | null)?.name ?? `Luta #${id}`
  const characters = panel.data?.characters ?? []

  return (
    <div className="space-y-6">
      <Link to="/jogador" className="inline-flex items-center gap-1.5 text-sm text-parchment-muted hover:text-gold">
        <ArrowLeft className="h-4 w-4" /> Sair do combate
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel>
            <p className="eyebrow">Combate</p>
            <h1 className="mt-1 text-2xl font-bold text-parchment">{name}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {fight.data && <Badge tone={live ? 'gold' : 'neutral'}>{FIGHT_STATUS_LABELS[fight.data.status]}</Badge>}
            </div>
            <div
              aria-live="polite"
              className={cn(
                'mt-5 rounded-md border px-4 py-3 text-center font-display text-lg font-bold',
                myTurn ? 'animate-pulse border-gold bg-gold/15 text-gold-bright' : 'border-line text-parchment-muted',
              )}
            >
              {!live ? 'A luta não está em andamento' : myTurn ? 'Sua vez de agir!' : 'Aguardando sua vez...'}
            </div>
          </Panel>

          <Panel title="Sua ação">
            <form onSubmit={submit} className="space-y-4">
              <div role="radiogroup" aria-label="Ação" className="grid grid-cols-2 gap-2">
                {ACTIONS.map(({ id: actionId, icon: Icon }) => (
                  <button
                    key={actionId}
                    type="button"
                    role="radio"
                    aria-checked={action === actionId}
                    onClick={() => setAction(actionId)}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-md border px-3 py-3 text-sm font-semibold transition-colors',
                      action === actionId ? 'border-gold bg-gold/15 text-gold-bright' : 'border-line text-parchment-muted hover:border-line-strong hover:text-parchment',
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {ACTION_LABELS[actionId]}
                  </button>
                ))}
              </div>
              {chosen.needsValue && <TextField label="Valor (rolagem)" type="number" min={0} max={100000} value={value} onChange={(e) => setValue(e.target.value)} />}
              {characters.length > 1 && (
                <SelectField
                  label="Personagem"
                  value={characterId}
                  onChange={(e) => setCharacterId(e.target.value)}
                  options={characters.map((c) => ({ value: c.id, label: c.codename || c.name }))}
                  placeholder="Usar meu login"
                />
              )}
              <Button type="submit" size="lg" className="w-full" loading={act.isPending} disabled={!myTurn || !live}>
                {myTurn ? 'Agir' : 'Espere sua vez'}
              </Button>
            </form>
          </Panel>
        </div>

        <Panel title="Registro de combate">
          <QueryBoundary query={fight}>
            {(f) => (
              <>
                <dl className="mb-4 grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-md border border-line p-3">
                    <dt className="text-xs text-parchment-muted">Dano do grupo</dt>
                    <dd className="font-display text-2xl font-bold tabular-nums text-parchment">{formatNumber(f.total_player_damage)}</dd>
                  </div>
                  <div className="rounded-md border border-line p-3">
                    <dt className="text-xs text-parchment-muted">Dano dos inimigos</dt>
                    <dd className="font-display text-2xl font-bold tabular-nums text-parchment">{formatNumber(f.total_enemy_damage)}</dd>
                  </div>
                </dl>
                {f.entries.length === 0 ? (
                  <p className="text-sm text-parchment-faint">Nenhuma ação ainda. Que comece a batalha!</p>
                ) : (
                  <ol className="max-h-[60vh] space-y-2 overflow-y-auto" aria-live="polite">
                    {[...f.entries].reverse().map((entry) => (
                      <li key={entry.id} className="flex items-center gap-3 rounded-md border border-line px-3 py-2 text-sm">
                        <span
                          className={cn('h-8 w-1 shrink-0 rounded-full', entry.actor_type === 'player' ? 'bg-[var(--series-players)]' : 'bg-[var(--series-enemies)]')}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-parchment">
                            <span className="font-semibold">{entry.actor_name}</span>
                            {entry.action && <span className="text-parchment-muted"> · {ACTION_LABELS[entry.action] ?? entry.action}</span>}
                          </p>
                          <p className="text-xs text-parchment-faint">{formatTime(entry.created_at)}</p>
                        </div>
                        <div className="text-right text-xs tabular-nums">
                          {entry.damage > 0 && <p className="text-blood">{entry.damage} dano</p>}
                          {entry.healing > 0 && <p className="text-moss">{entry.healing} cura</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </>
            )}
          </QueryBoundary>
        </Panel>
      </div>
    </div>
  )
}
