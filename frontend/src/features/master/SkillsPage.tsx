import { useMemo, useState } from 'react'
import { Link2 } from 'lucide-react'
import { post } from '@/api/client'
import { keys, useAction, useClasses, useItems, useMasterCharacters, useRaces, useSkills } from '@/api/queries'
import type { Skill, SkillType } from '@/api/types'
import { Badge } from '@/ui/Badge'
import { Button } from '@/ui/Button'
import { SelectField } from '@/ui/Field'
import { PageHeader, Panel } from '@/ui/Panel'
import { CrudPage, asString, int, options, text, type FieldDef } from './CrudPage'

const TYPE_LABELS: Record<SkillType, string> = { class: 'Classe', race: 'Raça', item: 'Item' }

function AssignSkill({ skills }: { skills: Skill[] }) {
  const characters = useMasterCharacters()
  const [characterId, setCharacterId] = useState('')
  const [skillId, setSkillId] = useState('')
  const assign = useAction(() => post(`/api/characters/${characterId}/habilidades/`, { habilidade_id: Number(skillId) }), {
    invalidate: [keys.characterSkills(Number(characterId))],
    success: 'Habilidade atribuída.',
    failure: 'Não foi possível atribuir (a raça, classe ou item do personagem precisa combinar)',
  })

  return (
    <Panel title="Atribuir a um personagem" eyebrow="Habilidades">
      <form
        className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault()
          assign.mutate()
        }}
      >
        <SelectField
          label="Personagem"
          required
          value={characterId}
          onChange={(e) => setCharacterId(e.target.value)}
          options={(characters.data ?? []).map((c) => ({ value: c.id, label: `${c.codename || c.name} — ${c.race.name ?? '?'} / ${c.class ?? '?'}` }))}
        />
        <SelectField label="Habilidade" required value={skillId} onChange={(e) => setSkillId(e.target.value)} options={options(skills)} />
        <Button type="submit" icon={<Link2 className="h-4 w-4" />} loading={assign.isPending} disabled={!characterId || !skillId}>
          Atribuir
        </Button>
      </form>
    </Panel>
  )
}

export function SkillsPage() {
  const skills = useSkills()
  const races = useRaces()
  const classes = useClasses()
  const items = useItems()

  const fields = useMemo<FieldDef[]>(
    () => [
      { name: 'name', label: 'Nome', required: true, maxLength: 100 },
      {
        name: 'tipo',
        label: 'Vinculada a',
        type: 'select',
        required: true,
        default: 'class',
        placeholder: null,
        options: Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })),
      },
      { name: 'classe_id', label: 'Classe', type: 'select', required: true, options: options(classes.data), visible: (v) => v.tipo === 'class' },
      { name: 'raca_id', label: 'Raça', type: 'select', required: true, options: options(races.data), visible: (v) => v.tipo === 'race' },
      { name: 'item_id', label: 'Item', type: 'select', required: true, options: options(items.data), visible: (v) => v.tipo === 'item' },
      { name: 'dano_base', label: 'Dano base', type: 'number', min: 0, default: '0' },
      { name: 'custo_vigor', label: 'Custo de vigor', type: 'number', min: 0, default: '0' },
      { name: 'custo_vida', label: 'Custo de vida', type: 'number', min: 0, default: '0' },
      { name: 'efeitos_atributos', label: 'Efeito / descrição', type: 'textarea' },
    ],
    [classes.data, races.data, items.data],
  )

  const nameOf = (skill: Skill) => {
    if (skill.tipo === 'class') return classes.data?.find((c) => c.id === skill.classe_id)?.name
    if (skill.tipo === 'race') return races.data?.find((r) => r.id === skill.raca_id)?.name
    return items.data?.find((i) => i.id === skill.item_id)?.name
  }

  return (
    <>
      <PageHeader title="Habilidades" subtitle="Cada habilidade pertence a uma classe, raça ou item; só personagens compatíveis podem recebê-la." />
      <div className="space-y-6">
        <AssignSkill skills={skills.data ?? []} />
        <CrudPage<Skill>
          title="Habilidades"
          singular="Habilidade"
        feminine
          query={skills}
          queryKey={keys.skills}
          endpoint="/api/habilidades/"
          fields={fields}
          toPayload={(v) => ({
            name: text(v.name),
            tipo: v.tipo,
            dano_base: int(v.dano_base) ?? 0,
            custo_vigor: int(v.custo_vigor) ?? 0,
            custo_vida: int(v.custo_vida) ?? 0,
            efeitos_atributos: text(v.efeitos_atributos),
            classe_id: v.tipo === 'class' ? int(v.classe_id) : null,
            raca_id: v.tipo === 'race' ? int(v.raca_id) : null,
            item_id: v.tipo === 'item' ? int(v.item_id) : null,
          })}
          toForm={(s) => ({
            name: s.name,
            tipo: s.tipo,
            classe_id: asString(s.classe_id),
            raca_id: asString(s.raca_id),
            item_id: asString(s.item_id),
            dano_base: asString(s.dano_base ?? 0),
            custo_vigor: asString(s.custo_vigor ?? 0),
            custo_vida: asString(s.custo_vida ?? 0),
            efeitos_atributos: asString(s.efeitos_atributos),
          })}
          searchText={(s) => s.name}
          renderItem={(s) => (
            <div>
              <p className="flex flex-wrap items-center gap-2 font-semibold text-parchment">
                {s.name}
                <Badge tone="gold">
                  {TYPE_LABELS[s.tipo]}: {nameOf(s) ?? '—'}
                </Badge>
              </p>
              {s.efeitos_atributos && <p className="mt-0.5 text-sm text-parchment-muted">{s.efeitos_atributos}</p>}
              <p className="mt-1 text-xs text-parchment-faint">
                Dano {s.dano_base ?? 0} · Vigor −{s.custo_vigor ?? 0} · Vida −{s.custo_vida ?? 0}
              </p>
            </div>
          )}
        />
      </div>
    </>
  )
}
