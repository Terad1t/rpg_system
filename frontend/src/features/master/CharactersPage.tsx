import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Eye, HeartPulse, History, Plus, ScrollText, Search, Skull, Sparkles, Trash2, Users } from 'lucide-react'
import { del, post, put } from '@/api/client'
import { keys, useAccounts, useAction, useAudit, useClasses, useEffectsCatalog, useMaps, useMasterCharacters, useRaces } from '@/api/queries'
import type { CharacterType, MasterCharacter, PublicField, Visibility, VisibilityRule } from '@/api/types'
import { parseEffects, remainingLabel } from '@/lib/effects'
import { CHARACTER_TYPE_LABELS, formatDateTime } from '@/lib/format'
import { useSocket } from '@/realtime/useSocket'
import { Badge, StatusDot } from '@/ui/Badge'
import { Button } from '@/ui/Button'
import { CheckboxField, SelectField, TextArea, TextField } from '@/ui/Field'
import { EmptyState, QueryBoundary } from '@/ui/feedback'
import { Modal } from '@/ui/Modal'
import { PageHeader, Panel } from '@/ui/Panel'
import { StatBar } from '@/ui/StatBar'
import { Avatar, Tabs } from '@/ui/misc'
import { useConfirm } from '@/ui/confirm'
import { cn } from '@/ui/cn'
import { asString, int, options, text } from './CrudPage'

type Filter = 'all' | 'online' | 'players' | 'npc' | 'boss' | 'dead'
const FILTERS: { id: Filter; label: string; test: (c: MasterCharacter) => boolean }[] = [
  { id: 'all', label: 'Todos', test: () => true },
  { id: 'online', label: 'Online', test: (c) => c.is_online },
  { id: 'players', label: 'Jogadores', test: (c) => c.tipo === 'player' },
  { id: 'npc', label: 'NPCs', test: (c) => c.tipo === 'npc' },
  { id: 'boss', label: 'Chefes', test: (c) => c.tipo === 'boss' },
  { id: 'dead', label: 'Mortos', test: (c) => c.is_dead },
]

const TYPE_OPTIONS = (['player', 'npc', 'boss', 'dead'] as CharacterType[]).map((value) => ({ value, label: CHARACTER_TYPE_LABELS[value] }))

// ---------- Lista ----------

function CharacterList({ characters, selectedId, onSelect }: { characters: MasterCharacter[]; selectedId: number | null; onSelect: (id: number) => void }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const term = search.trim().toLowerCase()
  const test = FILTERS.find((f) => f.id === filter)!.test
  const visible = characters.filter(
    (c) => test(c) && (!term || [c.name, c.codename, c.race.name, c.class, c.owner?.login].some((v) => v?.toLowerCase().includes(term))),
  )

  return (
    <Panel padded={false} className="h-fit lg:sticky lg:top-20">
      <div className="space-y-3 border-b border-line p-4">
        <label className="relative block">
          <span className="sr-only">Buscar personagem</span>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-parchment-faint" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome, raça, jogador..." className="field-control pl-8" />
        </label>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                filter === f.id ? 'border-gold bg-gold/15 text-gold-bright' : 'border-line text-parchment-muted hover:text-parchment',
              )}
            >
              {f.label} <span className="opacity-60">{characters.filter(f.test).length}</span>
            </button>
          ))}
        </div>
      </div>
      <ul className="max-h-[60vh] overflow-y-auto p-2">
        {visible.length === 0 && <li className="p-4 text-center text-sm text-parchment-faint">Nenhum personagem.</li>}
        {visible.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              aria-current={selectedId === c.id}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
                selectedId === c.id ? 'bg-gold/15' : 'hover:bg-surface-raised',
              )}
            >
              <Avatar src={c.portrait || c.race.image} name={c.codename || c.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-parchment">{c.codename || c.name}</p>
                <p className="truncate text-xs text-parchment-faint">
                  {CHARACTER_TYPE_LABELS[c.tipo] ?? c.tipo}
                  {c.owner && ` · ${c.owner.login}`}
                </p>
              </div>
              {c.user_id ? <StatusDot online={c.is_online} label="" /> : null}
              {c.is_dead && <Skull className="h-4 w-4 text-blood" aria-label="Morto" />}
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

// ---------- Ações rápidas ----------

function QuickActions({ character }: { character: MasterCharacter }) {
  const effects = useEffectsCatalog()
  const [amount, setAmount] = useState('5')
  const [target, setTarget] = useState<'hp' | 'mana'>('hp')
  const [effectId, setEffectId] = useState('')
  const [duration, setDuration] = useState('')
  const [narrative, setNarrative] = useState('')
  const invalidate = [keys.masterCharacters, keys.audit(character.id)]
  const apply = useAction((payload: Record<string, unknown>) => post(`/api/master/characters/${character.id}/apply`, payload), {
    invalidate,
    success: 'Ficha atualizada. O jogador vê na hora.',
    failure: 'Não foi possível aplicar',
  })

  const change = (sign: 1 | -1) => apply.mutate({ [target]: sign * Math.abs(Number(amount) || 0) })
  const selectedEffect = effects.data?.find((e) => e.id === Number(effectId))
  const applyEffect = () => {
    if (!selectedEffect) return
    const seconds = duration === '' ? selectedEffect.duration_default_seconds : Number(duration)
    const key = selectedEffect.kind === 'buff' ? 'add_buff' : 'add_debuff'
    apply.mutate({ [key]: selectedEffect.name, [`${selectedEffect.kind}_duration_seconds`]: seconds || undefined })
  }

  const active = [
    ...parseEffects(character.buffs).map((e) => ({ ...e, kind: 'buff' as const })),
    ...parseEffects(character.debuffs).map((e) => ({ ...e, kind: 'debuff' as const })),
  ]

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-parchment">
          <HeartPulse className="h-4 w-4 text-blood" /> Dano e cura
        </h3>
        <div className="grid gap-3 sm:grid-cols-[8rem_7rem_1fr] sm:items-end">
          <SelectField label="Em" placeholder={null} value={target} onChange={(e) => setTarget(e.target.value as 'hp' | 'mana')} options={[{ value: 'hp', label: 'Vida' }, { value: 'mana', label: 'Mana' }]} />
          <TextField label="Quantidade" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="danger" className="flex-1" loading={apply.isPending} onClick={() => change(-1)}>
              − Dano
            </Button>
            <Button variant="secondary" className="flex-1" loading={apply.isPending} onClick={() => change(1)}>
              + Cura
            </Button>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-parchment">
          <Sparkles className="h-4 w-4 text-gold" /> Efeitos
        </h3>
        <div className="grid gap-3 sm:grid-cols-[1fr_9rem_auto] sm:items-end">
          <SelectField
            label="Efeito do catálogo"
            value={effectId}
            onChange={(e) => setEffectId(e.target.value)}
            options={(effects.data ?? []).map((e) => ({ value: e.id, label: `${e.name} (${e.kind === 'buff' ? 'buff' : 'debuff'})` }))}
            placeholder={effects.data?.length ? 'Escolha...' : 'Cadastre em Buffs e debuffs'}
          />
          <TextField
            label="Duração (s)"
            type="number"
            min={0}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder={selectedEffect?.duration_default_seconds ? String(selectedEffect.duration_default_seconds) : 'sem fim'}
          />
          <Button onClick={applyEffect} disabled={!selectedEffect} loading={apply.isPending}>
            Aplicar
          </Button>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-parchment-muted">Ativos</p>
          {active.length === 0 ? (
            <p className="text-sm text-parchment-faint">Nenhum efeito ativo.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {active.map((effect, index) => (
                <li key={`${effect.kind}-${effect.name}-${index}`}>
                  <button
                    type="button"
                    title="Remover efeito"
                    onClick={() => apply.mutate({ [effect.kind === 'buff' ? 'remove_buff' : 'remove_debuff']: effect.name })}
                    className={cn(
                      'group inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs',
                      effect.kind === 'buff' ? 'border-moss/50 text-moss' : 'border-blood/50 text-blood',
                    )}
                  >
                    {effect.name}
                    {remainingLabel(effect.expiresAt) && <span className="opacity-70">{remainingLabel(effect.expiresAt)}</span>}
                    <span className="opacity-50 group-hover:opacity-100" aria-label="remover">
                      ×
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-parchment">
          <ScrollText className="h-4 w-4 text-gold" /> Nota narrativa
        </h3>
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault()
            apply.mutate({ narrative: narrative.trim() }, { onSuccess: () => setNarrative('') })
          }}
        >
          <TextField
            className="flex-1"
            label="Acontecimento"
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder="Ex.: encontrou um amuleto estranho"
            maxLength={2000}
          />
          <Button type="submit" variant="secondary" disabled={!narrative.trim()}>
            Registrar
          </Button>
        </form>
      </section>
    </div>
  )
}

// ---------- Ficha (criar/editar) ----------

interface SheetValues {
  name: string
  codename: string
  tipo: CharacterType
  raca_id: string
  classe_id: string
  subclass: string
  age: string
  user_id: string
  current_map_id: string
  max_hp: string
  max_mana: string
  description: string
}

const toSheet = (c?: MasterCharacter): SheetValues => ({
  name: c?.name ?? '',
  codename: asString(c?.codename),
  tipo: c?.tipo ?? 'npc',
  raca_id: asString(c?.raca_id),
  classe_id: asString(c?.classe_id),
  subclass: asString(c?.subclass),
  age: asString(c?.age),
  user_id: asString(c?.user_id),
  current_map_id: asString(c?.current_map_id),
  max_hp: asString(c?.max_hp ?? 10),
  max_mana: asString(c?.max_mana ?? 0),
  description: asString(c?.description),
})

function SheetForm({ character, onDone }: { character?: MasterCharacter; onDone?: (id?: number) => void }) {
  const races = useRaces()
  const classes = useClasses()
  const accounts = useAccounts()
  const maps = useMaps()
  const [values, setValues] = useState<SheetValues>(() => toSheet(character))
  const set = (field: keyof SheetValues) => (e: { target: { value: string } }) => setValues((p) => ({ ...p, [field]: e.target.value }))

  const save = useAction(
    () => {
      const payload = {
        name: text(values.name),
        codename: text(values.codename),
        tipo: values.tipo,
        raca_id: int(values.raca_id),
        classe_id: int(values.classe_id),
        subclass: text(values.subclass),
        age: int(values.age),
        user_id: int(values.user_id),
        current_map_id: int(values.current_map_id),
        max_hp: int(values.max_hp) ?? 0,
        max_mana: int(values.max_mana) ?? 0,
        description: text(values.description),
      }
      return character ? put<MasterCharacter>(`/api/characters/${character.id}`, payload) : post<MasterCharacter>('/api/characters/', payload)
    },
    { invalidate: [keys.masterCharacters, keys.overview], success: character ? 'Ficha salva.' : 'Personagem criado.', failure: 'Não foi possível salvar' },
  )

  const submit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate(undefined, { onSuccess: (result) => onDone?.((result as MasterCharacter).id) })
  }

  const players = (accounts.data ?? []).filter((a) => a.role === 'player')

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Nome" required value={values.name} onChange={set('name')} />
        <TextField label="Codinome" maxLength={50} value={values.codename} onChange={set('codename')} />
        <SelectField label="Tipo" required placeholder={null} options={TYPE_OPTIONS} value={values.tipo} onChange={set('tipo')} />
        <SelectField
          label="Jogador dono"
          options={players.map((a) => ({ value: a.id, label: a.login }))}
          placeholder="Nenhum (NPC)"
          value={values.user_id}
          onChange={set('user_id')}
          required={values.tipo === 'player'}
          hint={values.tipo === 'player' ? 'Obrigatório para personagens de jogador.' : undefined}
        />
        <SelectField label="Raça" required options={options(races.data)} value={values.raca_id} onChange={set('raca_id')} />
        <SelectField label="Classe" required options={options(classes.data)} value={values.classe_id} onChange={set('classe_id')} />
        <TextField label="Subclasse" value={values.subclass} onChange={set('subclass')} />
        <TextField label="Idade" type="number" min={0} value={values.age} onChange={set('age')} />
        <TextField label="Vida máxima" type="number" min={0} value={values.max_hp} onChange={set('max_hp')} />
        <TextField label="Mana máxima" type="number" min={0} value={values.max_mana} onChange={set('max_mana')} />
        <SelectField label="Local atual" options={options(maps.data)} placeholder="Nenhum" value={values.current_map_id} onChange={set('current_map_id')} className="sm:col-span-2" />
      </div>
      <TextArea label="Descrição" rows={4} maxLength={2000} value={values.description} onChange={set('description')} />
      <div className="flex justify-end">
        <Button type="submit" loading={save.isPending}>
          {character ? 'Salvar ficha' : 'Criar personagem'}
        </Button>
      </div>
    </form>
  )
}

// ---------- Visibilidade ----------

const DEFAULT_VISIBILITY: Visibility = {
  show_hp: false,
  show_mana: false,
  show_buffs: false,
  show_debuffs: false,
  rule: 'public',
  allow_user_ids: [],
  friend_user_ids: [],
  public_fields: ['codename', 'race', 'class', 'status'],
}

const RULES: { value: VisibilityRule; label: string }[] = [
  { value: 'public', label: 'Todos os jogadores' },
  { value: 'same_map', label: 'Só quem está no mesmo local' },
  { value: 'allow_list', label: 'Só jogadores escolhidos' },
  { value: 'owner_only', label: 'Ninguém além do dono' },
]

const FIELDS: { value: PublicField; label: string }[] = [
  { value: 'codename', label: 'Codinome' },
  { value: 'race', label: 'Raça' },
  { value: 'class', label: 'Classe' },
  { value: 'status', label: 'Tipo' },
  { value: 'portrait', label: 'Retrato' },
]

function parseVisibility(raw: string | null): Visibility {
  if (!raw) return DEFAULT_VISIBILITY
  try {
    return { ...DEFAULT_VISIBILITY, ...(JSON.parse(raw) as Partial<Visibility>) }
  } catch {
    return DEFAULT_VISIBILITY
  }
}

function VisibilityForm({ character }: { character: MasterCharacter }) {
  const accounts = useAccounts()
  const [values, setValues] = useState<Visibility>(() => parseVisibility(character.visibility))
  const save = useAction(() => post(`/api/master/characters/${character.id}/visibility`, values), {
    invalidate: [keys.masterCharacters],
    success: 'Visibilidade salva.',
  })
  const toggle = <K extends 'public_fields' | 'allow_user_ids'>(key: K, value: Visibility[K][number]) =>
    setValues((prev) => {
      const list = prev[key] as Visibility[K][number][]
      return { ...prev, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] }
    })

  return (
    <div className="space-y-5">
      <p className="text-sm text-parchment-muted">Controla o que os outros jogadores veem desta ficha. O dono e o mestre sempre veem tudo.</p>
      <SelectField label="Quem pode ver" placeholder={null} options={RULES} value={values.rule} onChange={(e) => setValues((p) => ({ ...p, rule: e.target.value as VisibilityRule }))} />
      {values.rule === 'allow_list' && (
        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-parchment-muted">Jogadores com acesso</legend>
          <div className="flex flex-wrap gap-3">
            {(accounts.data ?? [])
              .filter((a) => a.role === 'player' && a.id !== character.user_id)
              .map((a) => (
                <CheckboxField key={a.id} label={a.login} checked={values.allow_user_ids.includes(a.id)} onChange={() => toggle('allow_user_ids', a.id)} />
              ))}
          </div>
        </fieldset>
      )}
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-parchment-muted">Informações públicas</legend>
        <div className="flex flex-wrap gap-3">
          {FIELDS.map((f) => (
            <CheckboxField key={f.value} label={f.label} checked={values.public_fields.includes(f.value)} onChange={() => toggle('public_fields', f.value)} />
          ))}
          <CheckboxField label="Vida" checked={values.show_hp} onChange={(e) => setValues((p) => ({ ...p, show_hp: e.target.checked }))} />
          <CheckboxField label="Mana" checked={values.show_mana} onChange={(e) => setValues((p) => ({ ...p, show_mana: e.target.checked }))} />
          <CheckboxField label="Buffs" checked={values.show_buffs} onChange={(e) => setValues((p) => ({ ...p, show_buffs: e.target.checked }))} />
          <CheckboxField label="Debuffs" checked={values.show_debuffs} onChange={(e) => setValues((p) => ({ ...p, show_debuffs: e.target.checked }))} />
        </div>
      </fieldset>
      <div className="flex justify-end">
        <Button loading={save.isPending} onClick={() => save.mutate()}>
          Salvar visibilidade
        </Button>
      </div>
    </div>
  )
}

// ---------- Histórico ----------

function describeAudit(payload: string | null) {
  if (!payload) return '—'
  try {
    const data = JSON.parse(payload) as Record<string, unknown>
    const parts: string[] = []
    if (typeof data.hp === 'number') parts.push(data.hp < 0 ? `${-data.hp} de dano` : `${data.hp} de cura`)
    if (typeof data.mana === 'number') parts.push(`${data.mana > 0 ? '+' : ''}${data.mana} mana`)
    if (data.add_buff) parts.push(`buff ${data.add_buff}`)
    if (data.add_debuff) parts.push(`debuff ${data.add_debuff}`)
    if (data.remove_buff) parts.push(`removeu ${data.remove_buff}`)
    if (data.remove_debuff) parts.push(`removeu ${data.remove_debuff}`)
    if (data.narrative) parts.push(`“${data.narrative}”`)
    return parts.join(' · ') || 'Atualização'
  } catch {
    return payload
  }
}

function AuditLog({ characterId }: { characterId: number }) {
  const audit = useAudit(characterId)
  return (
    <QueryBoundary query={audit}>
      {(entries) =>
        entries.length === 0 ? (
          <EmptyState title="Nada registrado ainda">Dano, cura, efeitos e notas aplicados aparecem aqui.</EmptyState>
        ) : (
          <ol className="space-y-2">
            {entries.map((entry) => (
              <li key={entry.id} className="flex flex-wrap justify-between gap-2 rounded-md border border-line px-3 py-2 text-sm">
                <span className="text-parchment">{describeAudit(entry.payload)}</span>
                <span className="text-xs text-parchment-faint">{formatDateTime(entry.created_at)}</span>
              </li>
            ))}
          </ol>
        )
      }
    </QueryBoundary>
  )
}

// ---------- Detalhe ----------

type DetailTab = 'actions' | 'sheet' | 'visibility' | 'history'
const DETAIL_TABS = [
  { id: 'actions' as const, label: 'Ações', icon: <HeartPulse className="h-4 w-4" /> },
  { id: 'sheet' as const, label: 'Ficha', icon: <ScrollText className="h-4 w-4" /> },
  { id: 'visibility' as const, label: 'Visibilidade', icon: <Eye className="h-4 w-4" /> },
  { id: 'history' as const, label: 'Histórico', icon: <History className="h-4 w-4" /> },
]

function CharacterDetail({ character, onDeleted }: { character: MasterCharacter; onDeleted: () => void }) {
  const [tab, setTab] = useState<DetailTab>('actions')
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const remove = useAction(() => del(`/api/characters/${character.id}`), {
    invalidate: [keys.masterCharacters, keys.overview],
    success: 'Personagem excluído.',
  })

  // Atualizações ao vivo da ficha (ex.: efeito que expirou, ação de outro mestre).
  const onLive = useCallback(() => queryClient.invalidateQueries({ queryKey: keys.masterCharacters }), [queryClient])
  useSocket(`/ws/character-view/${character.id}`, onLive)

  return (
    <Panel padded={false}>
      <div className="flex flex-wrap items-start gap-4 border-b border-line p-5">
        <Avatar src={character.portrait || character.race.image} name={character.codename || character.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-bold text-parchment">{character.codename || character.name}</h2>
          <p className="text-sm text-parchment-muted">
            {character.codename && `${character.name} · `}
            {character.race.name ?? '?'} · {character.class ?? '?'}
            {character.subclass && ` (${character.subclass})`}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={character.tipo === 'boss' ? 'blood' : character.tipo === 'player' ? 'arcane' : 'neutral'}>{CHARACTER_TYPE_LABELS[character.tipo]}</Badge>
            {character.owner && <Badge>jogador: {character.owner.login}</Badge>}
            {character.user_id && <StatusDot online={character.is_online} label={character.is_online ? 'online' : 'offline'} />}
            {character.current_map && <Badge tone="gold">{character.current_map.name}</Badge>}
          </div>
        </div>
        <Button
          size="sm"
          variant="danger"
          icon={<Trash2 className="h-3.5 w-3.5" />}
          onClick={async () => {
            const ok = await confirm({ title: 'Excluir personagem?', message: `${character.name} e o histórico dele serão removidos.`, confirmLabel: 'Excluir', danger: true })
            if (ok) remove.mutate(undefined, { onSuccess: onDeleted })
          }}
        >
          Excluir
        </Button>
      </div>
      <div className="grid gap-4 border-b border-line p-5 sm:grid-cols-2">
        <StatBar kind="hp" current={character.hp} max={character.max_hp} />
        <StatBar kind="mana" current={character.mana} max={character.max_mana} />
      </div>
      <div className="px-5 pt-2">
        <Tabs label="Seções do personagem" tabs={DETAIL_TABS} active={tab} onChange={setTab} />
      </div>
      <div className="p-5" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'actions' && <QuickActions character={character} />}
        {tab === 'sheet' && <SheetForm key={character.id} character={character} />}
        {tab === 'visibility' && <VisibilityForm key={character.id} character={character} />}
        {tab === 'history' && <AuditLog characterId={character.id} />}
      </div>
    </Panel>
  )
}

export function CharactersPage() {
  const characters = useMasterCharacters()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const selected = useMemo(
    () => characters.data?.find((c) => c.id === selectedId) ?? characters.data?.[0] ?? null,
    [characters.data, selectedId],
  )

  return (
    <>
      <PageHeader
        title="Personagens"
        subtitle="Jogadores, NPCs e chefes. Dano, cura e efeitos aplicados aqui aparecem na hora para o jogador."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            Novo personagem
          </Button>
        }
      />
      <QueryBoundary query={characters}>
        {(list) =>
          list.length === 0 ? (
            <EmptyState title="Nenhum personagem ainda" icon={<Users className="h-6 w-6" />}>
              Crie NPCs e chefes aqui, ou aprove os pedidos dos jogadores em Solicitações.
            </EmptyState>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
              <CharacterList characters={list} selectedId={selected?.id ?? null} onSelect={setSelectedId} />
              {selected && <CharacterDetail key={selected.id} character={selected} onDeleted={() => setSelectedId(null)} />}
            </div>
          )
        }
      </QueryBoundary>
      <Modal open={creating} onClose={() => setCreating(false)} title="Novo personagem" size="lg">
        <SheetForm
          onDone={(id) => {
            setCreating(false)
            if (id) setSelectedId(id)
          }}
        />
      </Modal>
    </>
  )
}
