import { keys, useEffectsCatalog } from '@/api/queries'
import type { EffectDefinition } from '@/api/types'
import { Badge } from '@/ui/Badge'
import { PageHeader } from '@/ui/Panel'
import { CrudPage, asString, int, text, type FieldDef } from './CrudPage'

const FIELDS: FieldDef[] = [
  { name: 'name', label: 'Nome', required: true, maxLength: 100 },
  {
    name: 'kind',
    label: 'Tipo',
    type: 'select',
    required: true,
    default: 'buff',
    placeholder: null,
    options: [
      { value: 'buff', label: 'Buff (benefício)' },
      { value: 'debuff', label: 'Debuff (penalidade)' },
    ],
  },
  { name: 'description', label: 'Descrição', type: 'textarea' },
  { name: 'duration_default_seconds', label: 'Duração padrão (segundos)', type: 'number', min: 0, hint: 'Em branco: dura até o mestre remover.' },
  { name: 'stackable', label: 'Acumula (pode ser aplicado mais de uma vez)', type: 'checkbox' },
]

export function EffectsPage() {
  return (
    <>
      <PageHeader title="Buffs e debuffs" subtitle="Efeitos prontos para aplicar nas fichas durante a sessão." />
      <CrudPage<EffectDefinition>
        title="Efeitos"
        singular="Efeito"
        query={useEffectsCatalog()}
        queryKey={keys.effects}
        endpoint="/api/master/buffs/"
        fields={FIELDS}
        toPayload={(v) => ({
          name: text(v.name),
          kind: v.kind,
          description: text(v.description),
          duration_default_seconds: int(v.duration_default_seconds),
          stackable: Boolean(v.stackable),
        })}
        toForm={(e) => ({
          name: e.name,
          kind: e.kind,
          description: asString(e.description),
          duration_default_seconds: asString(e.duration_default_seconds),
          stackable: e.stackable,
        })}
        searchText={(e) => e.name}
        renderItem={(e) => (
          <div>
            <p className="flex flex-wrap items-center gap-2 font-semibold text-parchment">
              {e.name}
              <Badge tone={e.kind === 'buff' ? 'moss' : 'blood'}>{e.kind === 'buff' ? 'Buff' : 'Debuff'}</Badge>
              {e.stackable && <Badge>acumula</Badge>}
            </p>
            {e.description && <p className="mt-0.5 text-sm text-parchment-muted">{e.description}</p>}
            <p className="mt-1 text-xs text-parchment-faint">
              {e.duration_default_seconds ? `Duração padrão: ${e.duration_default_seconds}s` : 'Sem duração'}
            </p>
          </div>
        )}
      />
    </>
  )
}
