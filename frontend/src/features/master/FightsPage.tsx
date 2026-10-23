import { useMemo, useState, type FormEvent } from 'react'
import { ChevronsRight, Flag, Play, Plus, Send, Swords, Trash2, UserPlus } from 'lucide-react'
import { del, post, put } from '@/api/client'
import { keys, useAccounts, useAction, useFight, useFightResponses, useFights, useMasterTurn } from '@/api/queries'
import type { ActorType, Fight, FightEntry } from '@/api/types'
import { ACTION_LABELS, FIGHT_STATUS_LABELS, formatDateTime, formatNumber, formatTime } from '@/lib/format'
import { Badge } from '@/ui/Badge'
import { Button } from '@/ui/Button'
import { CheckboxField, SelectField, TextField } from '@/ui/Field'
import { EmptyState, QueryBoundary } from '@/ui/feedback'
import { Modal } from '@/ui/Modal'
import { PageHeader, Panel } from '@/ui/Panel'
import { useConfirm } from '@/ui/confirm'
import { cn } from '@/ui/cn'

const STATUS_TONE = { in_progress: 'gold', paused: 'arcane', finished: 'neutral' } as const

function useLogin() {
  const accounts = useAccounts()
  return (id: number | null | undefined) => accounts.data?.find((a) => a.id === id)?.login ?? (id ? `#${id}` : '—')
}

function NewFightDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: number) => void }) {
  const [name, setName] = useState('')
  const create = useAction(() => post<Fight>('/api/fights/', { name: name.trim(), status: 'paused' }), {
    invalidate: [keys.fights, keys.overview],
    success: 'Luta criada. Agora convide os jogadores.',
  })
  return (
    <Modal open={open} onClose={onClose} title="Nova luta" size="sm">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          create.mutate(undefined, {
            onSuccess: (fight) => {
              setName('')
              onCreated((fight as Fight).id)
            },
          })
        }}
      >
        <TextField label="Nome da luta" required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Emboscada na estrada" />
        <Button type="submit" className="w-full" loading={create.isPending}>
          Criar
        </Button>
      </form>
    </Modal>
  )
}

function InviteDialog({ fight, open, onClose }: { fight: Fight; open: boolean; onClose: () => void }) {
  const accounts = useAccounts()
  const players = (accounts.data ?? []).filter((a) => a.role === 'player' && a.is_active)
  const [selected, setSelected] = useState<number[]>([])
  const [seconds, setSeconds] = useState('30')
  const invite = useAction(() => post(`/api/fights/${fight.id}/invite`, { user_ids: selected, expires_in: Math.min(300, Math.max(5, Number(seconds) || 30)) }), {
    invalidate: [keys.fightResponses(fight.id)],
    success: 'Convites enviados. As respostas chegam em tempo real.',
  })
  const toggle = (id: number) => setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Convidar para ${fight.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          <Button icon={<Send className="h-4 w-4" />} disabled={selected.length === 0} loading={invite.isPending} onClick={() => invite.mutate(undefined, { onSuccess: onClose })}>
            Enviar {selected.length > 0 && `(${selected.length})`}
          </Button>
        </>
      }
    >
      {players.length === 0 ? (
        <p className="text-sm text-parchment-muted">Nenhum jogador ativo. Crie contas na aba Contas.</p>
      ) : (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-parchment-muted">Jogadores</legend>
          <div className="flex justify-end">
            <button type="button" className="text-xs text-gold hover:underline" onClick={() => setSelected(players.map((p) => p.id))}>
              Selecionar todos
            </button>
          </div>
          {players.map((p) => (
            <CheckboxField key={p.id} label={p.login} checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
          ))}
        </fieldset>
      )}
      <TextField className="mt-4" label="Prazo para responder (segundos)" type="number" min={5} max={300} value={seconds} onChange={(e) => setSeconds(e.target.value)} hint="Quem não responder no prazo fica de fora." />
    </Modal>
  )
}

function EntryForm({ fight }: { fight: Fight }) {
  const [actorType, setActorType] = useState<ActorType>('enemy')
  const [actorName, setActorName] = useState('')
  const [damage, setDamage] = useState('')
  const [healing, setHealing] = useState('')
  const add = useAction(
    () =>
      post(`/api/fights/${fight.id}/entries`, {
        actor_type: actorType,
        actor_name: actorName.trim(),
        damage: Math.max(0, Number(damage) || 0),
        healing: Math.max(0, Number(healing) || 0),
        action: Number(healing) > 0 && !Number(damage) ? 'heal' : 'attack',
      }),
    { invalidate: [keys.fight(fight.id), keys.fights, keys.fightStats], success: 'Ação registrada.' },
  )
  const submit = (event: FormEvent) => {
    event.preventDefault()
    add.mutate(undefined, {
      onSuccess: () => {
        setDamage('')
        setHealing('')
      },
    })
  }
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[8rem_1fr_6rem_6rem_auto] sm:items-end">
      <SelectField
        label="Lado"
        placeholder={null}
        value={actorType}
        onChange={(e) => setActorType(e.target.value as ActorType)}
        options={[
          { value: 'enemy', label: 'Inimigo' },
          { value: 'player', label: 'Jogador' },
        ]}
      />
      <TextField label="Quem age" required value={actorName} onChange={(e) => setActorName(e.target.value)} placeholder="Goblin chefe" />
      <TextField label="Dano" type="number" min={0} value={damage} onChange={(e) => setDamage(e.target.value)} />
      <TextField label="Cura" type="number" min={0} value={healing} onChange={(e) => setHealing(e.target.value)} />
      <Button type="submit" icon={<Plus className="h-4 w-4" />} loading={add.isPending}>
        Registrar
      </Button>
    </form>
  )
}

function EntryLog({ fight }: { fight: Fight }) {
  const remove = useAction((entryId: number) => del(`/api/fights/${fight.id}/entries/${entryId}`), {
    invalidate: [keys.fight(fight.id), keys.fights, keys.fightStats],
  })
  const entries: FightEntry[] = [...fight.entries].reverse()
  if (entries.length === 0) return <p className="text-sm text-parchment-faint">Nenhuma ação registrada ainda.</p>
  return (
    <ol className="space-y-2">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-center gap-3 rounded-md border border-line px-3 py-2 text-sm">
          <span
            className={cn('h-8 w-1 shrink-0 rounded-full', entry.actor_type === 'player' ? 'bg-(--series-players)' : 'bg-(--series-enemies)')}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-parchment">
              <span className="font-semibold">{entry.actor_name}</span>{' '}
              <span className="text-parchment-faint">({entry.actor_type === 'player' ? 'jogador' : 'inimigo'})</span>
              {entry.action && <span className="text-parchment-muted"> · {ACTION_LABELS[entry.action] ?? entry.action}</span>}
            </p>
            <p className="text-xs text-parchment-faint">{formatTime(entry.created_at)}</p>
          </div>
          <div className="text-right text-xs tabular-nums">
            {entry.damage > 0 && <p className="text-blood">{entry.damage} dano</p>}
            {entry.healing > 0 && <p className="text-moss">{entry.healing} cura</p>}
          </div>
          <button type="button" aria-label="Apagar ação" onClick={() => remove.mutate(entry.id)} className="rounded-sm p-1 text-parchment-faint hover:text-blood">
            <Trash2 className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ol>
  )
}

function FightDetail({ fightId, onDeleted }: { fightId: number; onDeleted: () => void }) {
  const fight = useFight(fightId, true)
  const live = fight.data?.status === 'in_progress'
  const responses = useFightResponses(fightId)
  const turn = useMasterTurn(fightId, live)
  const loginOf = useLogin()
  const confirm = useConfirm()
  const [inviting, setInviting] = useState(false)
  const refresh = [keys.fight(fightId), keys.fights, keys.fightTurn(fightId), keys.fightStats]

  const start = useAction(() => put(`/api/fights/${fightId}/start`), { invalidate: refresh, success: 'Luta iniciada! Os participantes foram levados para o combate.' })
  const advance = useAction(() => post(`/api/fights/${fightId}/turn/advance`), { invalidate: refresh, success: 'Turno passado.' })
  const finish = useAction(() => put(`/api/fights/${fightId}`, { status: 'finished', ended_at: new Date().toISOString() }), { invalidate: refresh, success: 'Luta encerrada.' })
  const remove = useAction(() => del(`/api/fights/${fightId}`), { invalidate: [keys.fights, keys.fightStats, keys.overview], success: 'Luta excluída.' })

  return (
    <QueryBoundary query={fight}>
      {(f) => (
        <div className="space-y-6">
          <Panel>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Luta #{f.id}</p>
                <h2 className="text-2xl font-bold text-parchment">{f.name}</h2>
                <p className="mt-1 text-sm text-parchment-muted">Criada em {formatDateTime(f.started_at)}</p>
              </div>
              <Badge tone={STATUS_TONE[f.status]}>{FIGHT_STATUS_LABELS[f.status]}</Badge>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {f.status !== 'finished' && (
                <Button variant="secondary" icon={<UserPlus className="h-4 w-4" />} onClick={() => setInviting(true)}>
                  Convidar
                </Button>
              )}
              {f.status === 'paused' && (
                <Button icon={<Play className="h-4 w-4" />} loading={start.isPending} disabled={!responses.data?.accepted.length} onClick={() => start.mutate()}>
                  Iniciar luta
                </Button>
              )}
              {live && (
                <>
                  <Button icon={<ChevronsRight className="h-4 w-4" />} loading={advance.isPending} onClick={() => advance.mutate()}>
                    Passar turno
                  </Button>
                  <Button variant="secondary" icon={<Flag className="h-4 w-4" />} loading={finish.isPending} onClick={() => finish.mutate()}>
                    Encerrar
                  </Button>
                </>
              )}
              <Button
                variant="danger"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={async () => {
                  if (await confirm({ title: 'Excluir luta?', message: 'O registro de ações será apagado.', confirmLabel: 'Excluir', danger: true }))
                    remove.mutate(undefined, { onSuccess: onDeleted })
                }}
              >
                Excluir
              </Button>
            </div>
            {f.status === 'paused' && !responses.data?.accepted.length && (
              <p className="mt-3 text-xs text-parchment-faint">Para iniciar, pelo menos um jogador precisa aceitar o convite.</p>
            )}
          </Panel>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="Participantes">
              {responses.data && (
                <dl className="space-y-3 text-sm">
                  {(
                    [
                      ['accepted', 'Aceitaram', 'moss'],
                      ['pending', 'Aguardando', 'amber'],
                      ['declined', 'Recusaram', 'blood'],
                    ] as const
                  ).map(([key, label, tone]) => (
                    <div key={key}>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-parchment-muted">{label}</dt>
                      <dd className="mt-1 flex flex-wrap gap-1.5">
                        {responses.data[key].length === 0 ? (
                          <span className="text-parchment-faint">—</span>
                        ) : (
                          responses.data[key].map((id) => (
                            <Badge key={id} tone={tone}>
                              {loginOf(id)}
                            </Badge>
                          ))
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </Panel>
            <Panel title="Placar">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {(
                  [
                    ['Dano dos jogadores', f.total_player_damage],
                    ['Dano dos inimigos', f.total_enemy_damage],
                    ['Cura dos jogadores', f.total_player_healing],
                    ['Cura dos inimigos', f.total_enemy_healing],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-parchment-muted">{label}</dt>
                    <dd className="font-display text-2xl font-bold tabular-nums text-parchment">{formatNumber(value)}</dd>
                  </div>
                ))}
              </dl>
              {live && (
                <p className="mt-4 rounded-md border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-parchment">
                  Vez de: <span className="font-semibold text-gold-bright">{loginOf(turn.data?.current_user_id)}</span>
                </p>
              )}
            </Panel>
          </div>

          <Panel title="Registrar ação" eyebrow="Inimigos e ações narradas">
            <EntryForm fight={f} />
          </Panel>
          <Panel title={`Registro de combate (${f.entries.length})`}>
            <EntryLog fight={f} />
          </Panel>
          <InviteDialog fight={f} open={inviting} onClose={() => setInviting(false)} />
        </div>
      )}
    </QueryBoundary>
  )
}

export function FightsPage() {
  const fights = useFights()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const sorted = useMemo(() => [...(fights.data ?? [])].sort((a, b) => b.id - a.id), [fights.data])
  const current = selectedId ?? sorted[0]?.id ?? null

  return (
    <>
      <PageHeader
        title="Lutas"
        subtitle="Crie a luta, convide jogadores, inicie e conduza os turnos. Os jogadores agem na própria vez pelo celular ou computador."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            Nova luta
          </Button>
        }
      />
      <QueryBoundary query={fights}>
        {() =>
          sorted.length === 0 ? (
            <EmptyState title="Nenhuma luta ainda" icon={<Swords className="h-6 w-6" />}>
              Crie a primeira luta para convidar os jogadores.
            </EmptyState>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
              <Panel padded={false} className="h-fit lg:sticky lg:top-20">
                <ul className="max-h-[70vh] overflow-y-auto p-2">
                  {sorted.map((fight) => (
                    <li key={fight.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(fight.id)}
                        aria-current={current === fight.id}
                        className={cn('w-full rounded-md px-3 py-2 text-left transition-colors', current === fight.id ? 'bg-gold/15' : 'hover:bg-surface-raised')}
                      >
                        <p className="truncate text-sm font-semibold text-parchment">{fight.name}</p>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-parchment-faint">
                          <Badge tone={STATUS_TONE[fight.status]}>{FIGHT_STATUS_LABELS[fight.status]}</Badge>
                          {fight.entries.length} ações
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
              {current && <FightDetail key={current} fightId={current} onDeleted={() => setSelectedId(null)} />}
            </div>
          )
        }
      </QueryBoundary>
      <NewFightDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(id) => {
          setCreating(false)
          setSelectedId(id)
        }}
      />
    </>
  )
}
