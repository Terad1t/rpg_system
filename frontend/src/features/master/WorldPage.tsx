import { useState } from 'react'
import { Castle, Flag, MapPin, Mountain } from 'lucide-react'
import { keys, useCountries, useMaps, useRegions, useVillages } from '@/api/queries'
import type { Country, DangerLevel, MapType, Region, Village, WorldMap } from '@/api/types'
import { Badge } from '@/ui/Badge'
import { PageHeader } from '@/ui/Panel'
import { Tabs } from '@/ui/misc'
import { CrudPage, asString, int, options, text, type FieldDef } from './CrudPage'

export const MAP_TYPE_LABELS: Record<MapType, string> = {
  region: 'Região',
  country: 'País',
  village: 'Vila',
  shop: 'Loja / taverna',
  residence: 'Residência',
}

export const DANGER_LABELS: Record<DangerLevel, string> = {
  none: 'Seguro',
  medium: 'Perigo moderado',
  high: 'Perigo alto',
  spiritual: 'Espiritual',
  ascendant: 'Ascendente',
}

const DANGER_TONE: Record<DangerLevel, 'moss' | 'amber' | 'blood' | 'arcane' | 'gold'> = {
  none: 'moss',
  medium: 'amber',
  high: 'blood',
  spiritual: 'arcane',
  ascendant: 'gold',
}

type Tab = 'regions' | 'countries' | 'villages' | 'maps'
const WORLD_KEYS = [keys.regions, keys.countries, keys.villages, keys.maps, keys.panel]

function RegionsTab() {
  const fields: FieldDef[] = [
    { name: 'name', label: 'Nome', required: true },
    { name: 'climate', label: 'Clima', placeholder: 'Temperado, árido...' },
    { name: 'description', label: 'Descrição', type: 'textarea' },
  ]
  return (
    <CrudPage<Region>
      title="Regiões"
      singular="Região"
        feminine
      query={useRegions()}
      queryKey={keys.regions}
      extraInvalidate={WORLD_KEYS}
      endpoint="/api/regions/"
      fields={fields}
      toPayload={(v) => ({ name: text(v.name), climate: text(v.climate), description: text(v.description) })}
      toForm={(r) => ({ name: r.name, climate: asString(r.climate), description: asString(r.description) })}
      searchText={(r) => r.name}
      emptyHint="Comece pela região: países, vilas e locais ficam dentro dela."
      renderItem={(r) => (
        <div>
          <p className="font-semibold text-parchment">{r.name}</p>
          <p className="text-sm text-parchment-muted">{[r.climate, r.description].filter(Boolean).join(' · ') || 'Sem descrição'}</p>
        </div>
      )}
    />
  )
}

function CountriesTab() {
  const regions = useRegions()
  const fields: FieldDef[] = [
    { name: 'name', label: 'Nome', required: true },
    { name: 'region_id', label: 'Região', type: 'select', required: true, options: options(regions.data) },
    { name: 'description', label: 'Descrição', type: 'textarea' },
    { name: 'image', label: 'Imagem (URL)', type: 'url' },
  ]
  const regionName = (id: number) => regions.data?.find((r) => r.id === id)?.name ?? '—'
  return (
    <CrudPage<Country>
      title="Países"
      singular="País"
      query={useCountries()}
      queryKey={keys.countries}
      extraInvalidate={WORLD_KEYS}
      endpoint="/api/countries/"
      fields={fields}
      toPayload={(v) => ({ name: text(v.name), region_id: int(v.region_id), description: text(v.description), image: text(v.image) })}
      toForm={(c) => ({ name: c.name, region_id: asString(c.region_id), description: asString(c.description), image: asString(c.image) })}
      searchText={(c) => c.name}
      renderItem={(c) => (
        <div>
          <p className="font-semibold text-parchment">{c.name}</p>
          <p className="text-sm text-parchment-muted">Região: {regionName(c.region_id)}</p>
        </div>
      )}
    />
  )
}

function VillagesTab() {
  const countries = useCountries()
  const fields: FieldDef[] = [
    { name: 'name', label: 'Nome', required: true },
    { name: 'country_id', label: 'País', type: 'select', required: true, options: options(countries.data) },
    { name: 'description', label: 'Descrição', type: 'textarea' },
    { name: 'image', label: 'Imagem (URL)', type: 'url' },
  ]
  const countryName = (id: number) => countries.data?.find((c) => c.id === id)?.name ?? '—'
  return (
    <CrudPage<Village>
      title="Vilas e cidades"
      singular="Vila"
        feminine
      query={useVillages()}
      queryKey={keys.villages}
      extraInvalidate={WORLD_KEYS}
      endpoint="/api/villages/"
      fields={fields}
      toPayload={(v) => ({ name: text(v.name), country_id: int(v.country_id), description: text(v.description), image: text(v.image) })}
      toForm={(v) => ({ name: v.name, country_id: asString(v.country_id), description: asString(v.description), image: asString(v.image) })}
      searchText={(v) => v.name}
      renderItem={(v) => (
        <div>
          <p className="font-semibold text-parchment">{v.name}</p>
          <p className="text-sm text-parchment-muted">País: {countryName(v.country_id)}</p>
        </div>
      )}
    />
  )
}

function MapsTab() {
  const regions = useRegions()
  const countries = useCountries()
  const villages = useVillages()
  const maps = useMaps()
  const fields: FieldDef[] = [
    { name: 'name', label: 'Nome', required: true },
    {
      name: 'map_type',
      label: 'Tipo de local',
      type: 'select',
      required: true,
      default: 'shop',
      placeholder: null,
      options: Object.entries(MAP_TYPE_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      name: 'danger_level',
      label: 'Perigo',
      type: 'select',
      default: 'none',
      placeholder: null,
      options: Object.entries(DANGER_LABELS).map(([value, label]) => ({ value, label })),
    },
    { name: 'region_id', label: 'Região', type: 'select', options: options(regions.data), hint: 'Preencha o nível mais específico: vila, país ou região.' },
    { name: 'country_id', label: 'País', type: 'select', options: options(countries.data) },
    { name: 'village_id', label: 'Vila', type: 'select', options: options(villages.data) },
    { name: 'parent_map_id', label: 'Dentro de outro local', type: 'select', options: options(maps.data), hint: 'Ex.: um quarto dentro da taverna.' },
    { name: 'description', label: 'Descrição', type: 'textarea' },
    { name: 'image', label: 'Imagem (URL)', type: 'url' },
  ]
  const where = (m: WorldMap) =>
    [villages.data?.find((v) => v.id === m.village_id)?.name, countries.data?.find((c) => c.id === m.country_id)?.name, regions.data?.find((r) => r.id === m.region_id)?.name]
      .filter(Boolean)
      .join(' · ')

  return (
    <CrudPage<WorldMap>
      title="Locais"
      singular="Local"
      query={maps}
      queryKey={keys.maps}
      extraInvalidate={WORLD_KEYS}
      endpoint="/api/maps/"
      fields={fields}
      toPayload={(v) => ({
        name: text(v.name),
        map_type: v.map_type,
        danger_level: v.danger_level || 'none',
        region_id: int(v.region_id),
        country_id: int(v.country_id),
        village_id: int(v.village_id),
        parent_map_id: int(v.parent_map_id),
        description: text(v.description),
        image: text(v.image),
      })}
      toForm={(m) => ({
        name: m.name,
        map_type: m.map_type ?? 'shop',
        danger_level: m.danger_level ?? 'none',
        region_id: asString(m.region_id),
        country_id: asString(m.country_id),
        village_id: asString(m.village_id),
        parent_map_id: asString(m.parent_map_id),
        description: asString(m.description),
        image: asString(m.image),
      })}
      searchText={(m) => m.name}
      renderItem={(m) => (
        <div>
          <p className="flex flex-wrap items-center gap-2 font-semibold text-parchment">
            {m.name}
            {m.map_type && <Badge>{MAP_TYPE_LABELS[m.map_type]}</Badge>}
            {m.danger_level && <Badge tone={DANGER_TONE[m.danger_level]}>{DANGER_LABELS[m.danger_level]}</Badge>}
          </p>
          <p className="text-sm text-parchment-muted">{where(m) || 'Sem localização definida'}</p>
        </div>
      )}
    />
  )
}

const TABS = [
  { id: 'regions' as const, label: 'Regiões', icon: <Mountain className="h-4 w-4" /> },
  { id: 'countries' as const, label: 'Países', icon: <Flag className="h-4 w-4" /> },
  { id: 'villages' as const, label: 'Vilas', icon: <Castle className="h-4 w-4" /> },
  { id: 'maps' as const, label: 'Locais', icon: <MapPin className="h-4 w-4" /> },
]

export function WorldPage() {
  const [tab, setTab] = useState<Tab>('regions')
  return (
    <>
      <PageHeader title="Mapa do mundo" subtitle="Regiões contêm países, países contêm vilas, e os locais ficam em qualquer um desses níveis. Os jogadores veem esse mapa na sessão." />
      <Tabs label="Níveis do mundo" tabs={TABS} active={tab} onChange={setTab} />
      <div className="mt-6" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'regions' && <RegionsTab />}
        {tab === 'countries' && <CountriesTab />}
        {tab === 'villages' && <VillagesTab />}
        {tab === 'maps' && <MapsTab />}
      </div>
    </>
  )
}
