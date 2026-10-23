import { useCallback, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Backpack, BookOpen, Map, MapPin, NotebookPen, ScrollText, UserPen, Wand2 } from 'lucide-react'
import { keys, usePlayerPanel } from '@/api/queries'
import type { PanelCharacter } from '@/api/types'
import { useSocket } from '@/realtime/useSocket'
import { Badge } from '@/ui/Badge'
import { QueryBoundary } from '@/ui/feedback'
import { Panel } from '@/ui/Panel'
import { StatBar } from '@/ui/StatBar'
import { Avatar, Tabs } from '@/ui/misc'
import { CharacterSheet } from './CharacterSheet'
import { ChatDock } from './ChatDock'
import { Inventory } from './Inventory'
import { Notes } from './Notes'
import { ProfileEditor } from './ProfileEditor'
import { Skills } from './Skills'
import { WorldMapView } from './WorldMapView'

type Tab = 'sheet' | 'inventory' | 'skills' | 'map' | 'notes' | 'edit'
const TABS = [
  { id: 'sheet' as const, label: 'Ficha', icon: <ScrollText className="h-4 w-4" /> },
  { id: 'inventory' as const, label: 'Inventário', icon: <Backpack className="h-4 w-4" /> },
  { id: 'skills' as const, label: 'Habilidades', icon: <Wand2 className="h-4 w-4" /> },
  { id: 'map' as const, label: 'Mapa', icon: <Map className="h-4 w-4" /> },
  { id: 'notes' as const, label: 'Anotações', icon: <NotebookPen className="h-4 w-4" /> },
  { id: 'edit' as const, label: 'Editar', icon: <UserPen className="h-4 w-4" /> },
]

function Header({ character }: { character: PanelCharacter }) {
  return (
    <Panel>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar src={character.portrait || character.race.image} name={character.codename || character.name} size="xl" />
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{character.race.name ?? 'Raça desconhecida'} · {character.class}</p>
          <h1 className="mt-1 truncate text-3xl font-bold text-parchment">{character.codename || character.name}</h1>
          {character.codename && <p className="text-sm text-parchment-muted">{character.name}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {character.current_map && <Badge tone="gold"><MapPin className="h-3 w-3" aria-hidden /> {character.current_map.name}</Badge>}
            {character.freePoints > 0 && <Badge tone="arcane">{character.freePoints} pontos livres</Badge>}
          </div>
        </div>
        <div className="w-full space-y-3 sm:w-64">
          <StatBar kind="hp" current={character.hp} max={character.maxHp} />
          <StatBar kind="mana" current={character.mana} max={character.maxMana} />
        </div>
      </div>
    </Panel>
  )
}

export function SessionPage() {
  const { characterId } = useParams()
  const id = Number(characterId)
  const panel = usePlayerPanel()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('sheet')

  // Mudanças feitas pelo mestre (dano, cura, efeitos) chegam por aqui.
  const refresh = useCallback(() => queryClient.invalidateQueries({ queryKey: keys.panel }), [queryClient])
  useSocket(id ? `/ws/character-view/${id}` : null, refresh)

  return (
    <QueryBoundary query={panel} label="Abrindo a ficha...">
      {(data) => {
        const character = data.characters.find((c) => c.id === id)
        if (!character) return <Navigate to="/jogador" replace />
        return (
          <div className="space-y-6 pb-20">
            <Link to="/jogador" className="inline-flex items-center gap-1.5 text-sm text-parchment-muted hover:text-gold">
              <ArrowLeft className="h-4 w-4" /> Trocar personagem
            </Link>
            <Header character={character} />
            <Tabs label="Seções da ficha" tabs={TABS} active={tab} onChange={setTab} />
            <div role="tabpanel" aria-labelledby={`tab-${tab}`}>
              {tab === 'sheet' && <CharacterSheet character={character} />}
              {tab === 'inventory' && <Inventory characterId={character.id} />}
              {tab === 'skills' && <Skills characterId={character.id} />}
              {tab === 'map' && <WorldMapView world={data.world_map} currentMapId={character.current_map_id} />}
              {tab === 'notes' && <Notes />}
              {tab === 'edit' && <ProfileEditor key={character.id} character={character} />}
            </div>
            {tab === 'sheet' && character.race.description && (
              <Panel title={`Sobre os ${character.race.name}`} eyebrow="Raça">
                <p className="flex gap-2 text-sm text-parchment-muted">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                  {character.race.description}
                </p>
              </Panel>
            )}
            <ChatDock characterId={character.id} displayName={character.codename || character.name} />
          </div>
        )
      }}
    </QueryBoundary>
  )
}
