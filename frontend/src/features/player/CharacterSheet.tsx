import { Plus } from 'lucide-react'
import { post } from '@/api/client'
import { keys, useAction } from '@/api/queries'
import type { PanelCharacter } from '@/api/types'
import { parseEffects, remainingLabel } from '@/lib/effects'
import { ATTRIBUTE_LABELS } from '@/lib/format'
import { EmptyState } from '@/ui/feedback'
import { Panel } from '@/ui/Panel'
import { cn } from '@/ui/cn'

function Effects({ character }: { character: PanelCharacter }) {
  const effects = [
    ...parseEffects(character.buffs).map((e) => ({ ...e, kind: 'buff' as const })),
    ...parseEffects(character.debuffs).map((e) => ({ ...e, kind: 'debuff' as const })),
  ]
  if (effects.length === 0) return null
  return (
    <Panel title="Efeitos ativos">
      <ul className="flex flex-wrap gap-2">
        {effects.map((effect, index) => (
          <li
            key={`${effect.kind}-${effect.name}-${index}`}
            className={cn('rounded-full border px-3 py-1 text-xs', effect.kind === 'buff' ? 'border-moss/50 bg-moss/10 text-moss' : 'border-blood/50 bg-blood/10 text-blood')}
          >
            {effect.kind === 'buff' ? '▲' : '▼'} {effect.name}
            {remainingLabel(effect.expiresAt) && <span className="ml-1.5 opacity-75">{remainingLabel(effect.expiresAt)}</span>}
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export function CharacterSheet({ character }: { character: PanelCharacter }) {
  const attributes = Object.entries(character.attributes)
  const canSpend = character.freePoints > 0
  const spend = useAction(
    (attribute: string) => post(`/api/characters/${character.id}/distribute-points`, { attribute_name: attribute, points_to_add: 1 }),
    { invalidate: [keys.panel], failure: 'Não foi possível distribuir' },
  )

  return (
    <div className="space-y-6">
      <Effects character={character} />
      <Panel
        title="Atributos"
        actions={canSpend && <span className="text-sm font-semibold text-gold-bright">{character.freePoints} ponto(s) para distribuir</span>}
      >
        {attributes.length === 0 ? (
          <EmptyState title="Atributos ainda não definidos">O mestre define os atributos ao aprovar o personagem.</EmptyState>
        ) : (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {attributes.map(([key, value]) => (
              <div key={key} className="relative rounded-md border border-line bg-surface-sunken p-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-parchment-muted">{ATTRIBUTE_LABELS[key] ?? key}</dt>
                <dd className="mt-1 font-display text-3xl font-bold tabular-nums text-parchment">{value}</dd>
                {canSpend && key !== 'investigation' && (
                  <button
                    type="button"
                    onClick={() => spend.mutate(key)}
                    disabled={spend.isPending}
                    aria-label={`Adicionar 1 ponto em ${ATTRIBUTE_LABELS[key] ?? key}`}
                    className="absolute right-2 top-2 rounded-full border border-gold/50 bg-gold/10 p-1 text-gold hover:bg-gold/25 disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </dl>
        )}
      </Panel>
      {character.description && (
        <Panel title="História">
          <p className="whitespace-pre-line text-sm leading-relaxed text-parchment-muted">{character.description}</p>
        </Panel>
      )}
    </div>
  )
}
