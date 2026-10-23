import { Castle, Flag, MapPin, Mountain } from 'lucide-react'
import type { MapNode, WorldRegion } from '@/api/types'
import { Badge } from '@/ui/Badge'
import { EmptyState } from '@/ui/feedback'
import { Panel } from '@/ui/Panel'
import { cn } from '@/ui/cn'

function Places({ maps, currentId, depth = 0 }: { maps: MapNode[]; currentId: number | null; depth?: number }) {
  if (maps.length === 0) return null
  return (
    <ul className={cn('space-y-1', depth > 0 && 'ml-4 border-l border-line pl-3')}>
      {maps.map((place) => {
        const here = place.id === currentId
        return (
          <li key={place.id}>
            <div className={cn('flex items-center gap-2 rounded-sm px-2 py-1 text-sm', here ? 'bg-gold/15 text-gold-bright' : 'text-parchment-muted')}>
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{place.name}</span>
              {here && <Badge tone="gold">você está aqui</Badge>}
            </div>
            <Places maps={place.children} currentId={currentId} depth={depth + 1} />
          </li>
        )
      })}
    </ul>
  )
}

export function WorldMapView({ world, currentMapId }: { world: WorldRegion[]; currentMapId: number | null }) {
  if (world.length === 0) {
    return (
      <Panel title="Mapa do mundo">
        <EmptyState title="O mundo ainda não foi desenhado">O mestre cadastra regiões, países, vilas e locais.</EmptyState>
      </Panel>
    )
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {world.map((region) => (
        <Panel key={region.id} title={region.name} eyebrow={region.climate ?? 'Região'}>
          {region.description && <p className="mb-3 text-sm text-parchment-muted">{region.description}</p>}
          <Places maps={region.maps} currentId={currentMapId} />
          <ul className="mt-3 space-y-3">
            {region.countries.map((country) => (
              <li key={country.id}>
                <p className="flex items-center gap-2 font-display font-bold text-parchment">
                  <Flag className="h-4 w-4 text-gold" aria-hidden /> {country.name}
                </p>
                <div className="ml-6 mt-1 space-y-2">
                  <Places maps={country.maps} currentId={currentMapId} />
                  {country.villages.map((village) => (
                    <div key={village.id}>
                      <p className="flex items-center gap-2 text-sm font-semibold text-parchment">
                        <Castle className="h-3.5 w-3.5 text-gold/80" aria-hidden /> {village.name}
                      </p>
                      <div className="ml-5 mt-1">
                        <Places maps={village.maps} currentId={currentMapId} />
                      </div>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          {region.countries.length === 0 && region.maps.length === 0 && (
            <p className="flex items-center gap-2 text-sm text-parchment-faint">
              <Mountain className="h-4 w-4" aria-hidden /> Terras ainda inexploradas.
            </p>
          )}
        </Panel>
      ))}
    </div>
  )
}
