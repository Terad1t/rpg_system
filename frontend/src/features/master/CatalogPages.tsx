import { keys, useClasses, useRaces } from '@/api/queries'
import type { CharacterClass, Race } from '@/api/types'
import { Badge } from '@/ui/Badge'
import { Avatar } from '@/ui/misc'
import { PageHeader } from '@/ui/Panel'
import { CrudPage, asString, text, type FieldDef } from './CrudPage'

const RACE_FIELDS: FieldDef[] = [
  { name: 'name', label: 'Nome', required: true, maxLength: 100 },
  { name: 'description', label: 'Descrição', type: 'textarea' },
  { name: 'image', label: 'Imagem (URL)', type: 'url', placeholder: 'https://...' },
]

export function RacesPage() {
  return (
    <>
      <PageHeader title="Raças" subtitle="As raças disponíveis quando um jogador pede um personagem." />
      <CrudPage<Race>
        title="Raças"
        singular="Raça"
        feminine
        query={useRaces()}
        queryKey={keys.races}
        endpoint="/api/racas/"
        fields={RACE_FIELDS}
        toPayload={(v) => ({ name: text(v.name), description: text(v.description), image: text(v.image) })}
        toForm={(race) => ({ name: race.name, description: asString(race.description), image: asString(race.image) })}
        searchText={(race) => race.name}
        emptyHint="Crie a primeira raça para os jogadores poderem pedir personagens."
        renderItem={(race) => (
          <div className="flex gap-3">
            <Avatar src={race.image} name={race.name} />
            <div>
              <p className="font-semibold text-parchment">{race.name}</p>
              {race.description && <p className="mt-0.5 text-sm text-parchment-muted">{race.description}</p>}
            </div>
          </div>
        )}
      />
    </>
  )
}

const CLASS_FIELDS: FieldDef[] = [
  { name: 'name', label: 'Nome', required: true, maxLength: 100 },
  { name: 'subclass', label: 'Subclasse', placeholder: 'Ex.: Eden, Nede' },
  { name: 'description', label: 'Descrição', type: 'textarea' },
]

export function ClassesPage() {
  return (
    <>
      <PageHeader title="Classes" subtitle="As classes (e subclasses) que definem o estilo de cada personagem." />
      <CrudPage<CharacterClass>
        title="Classes"
        singular="Classe"
        feminine
        query={useClasses()}
        queryKey={keys.classes}
        endpoint="/api/classes/"
        fields={CLASS_FIELDS}
        toPayload={(v) => ({ name: text(v.name), subclass: text(v.subclass), description: text(v.description) })}
        toForm={(c) => ({ name: c.name, subclass: asString(c.subclass), description: asString(c.description) })}
        searchText={(c) => `${c.name} ${c.subclass ?? ''}`}
        renderItem={(c) => (
          <div>
            <p className="flex items-center gap-2 font-semibold text-parchment">
              {c.name}
              {c.subclass && <Badge tone="arcane">{c.subclass}</Badge>}
            </p>
            {c.description && <p className="mt-0.5 text-sm text-parchment-muted">{c.description}</p>}
          </div>
        )}
      />
    </>
  )
}
