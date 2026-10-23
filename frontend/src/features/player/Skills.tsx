import { Wand2 } from 'lucide-react'
import { useCharacterSkills } from '@/api/queries'
import { Badge } from '@/ui/Badge'
import { EmptyState, QueryBoundary } from '@/ui/feedback'
import { Panel } from '@/ui/Panel'

const TYPE_LABELS: Record<string, string> = { race: 'Raça', class: 'Classe', item: 'Item' }

export function Skills({ characterId }: { characterId: number }) {
  const skills = useCharacterSkills(characterId)
  return (
    <Panel title="Habilidades">
      <QueryBoundary query={skills}>
        {(list) =>
          list.length === 0 ? (
            <EmptyState title="Nenhuma habilidade ainda" icon={<Wand2 className="h-6 w-6" />}>
              O mestre atribui habilidades conforme sua raça, classe e itens.
            </EmptyState>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {list.map(({ id, habilidade }) =>
                habilidade ? (
                  <li key={id} className="rounded-md border border-line bg-surface-sunken p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display text-lg font-bold text-parchment">{habilidade.name}</p>
                      <Badge tone="gold">{TYPE_LABELS[habilidade.tipo] ?? habilidade.tipo}</Badge>
                    </div>
                    {habilidade.efeitos_atributos && <p className="mt-1 text-sm text-parchment-muted">{habilidade.efeitos_atributos}</p>}
                    <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-sm border border-line py-1.5">
                        <dt className="text-parchment-faint">Dano</dt>
                        <dd className="font-bold tabular-nums text-parchment">{habilidade.dano_base ?? 0}</dd>
                      </div>
                      <div className="rounded-sm border border-line py-1.5">
                        <dt className="text-parchment-faint">Vigor</dt>
                        <dd className="font-bold tabular-nums text-arcane">−{habilidade.custo_vigor ?? 0}</dd>
                      </div>
                      <div className="rounded-sm border border-line py-1.5">
                        <dt className="text-parchment-faint">Vida</dt>
                        <dd className="font-bold tabular-nums text-blood">−{habilidade.custo_vida ?? 0}</dd>
                      </div>
                    </dl>
                  </li>
                ) : null,
              )}
            </ul>
          )
        }
      </QueryBoundary>
    </Panel>
  )
}
