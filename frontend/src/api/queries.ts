import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { del, errorMessage, get, post, put } from './client'
import type {
  Account,
  AssignedSkill,
  AuditEntry,
  CharacterClass,
  CharacterRequest,
  Country,
  EffectDefinition,
  Fight,
  FightResponses,
  FightStats,
  FightTurn,
  InventoryEntry,
  Item,
  MasterCharacter,
  Overview,
  PlayerPanel,
  Race,
  Region,
  Skill,
  Village,
  WorldMap,
} from './types'
import { useToast } from '@/ui/toast'

/** Chaves de cache: invalidar uma chave recarrega todas as telas que a usam. */
export const keys = {
  overview: ['overview'] as const,
  accounts: ['accounts'] as const,
  races: ['races'] as const,
  classes: ['classes'] as const,
  items: ['items'] as const,
  skills: ['skills'] as const,
  effects: ['effects'] as const,
  masterCharacters: ['master-characters'] as const,
  audit: (id: number) => ['audit', id] as const,
  requests: ['requests'] as const,
  fights: ['fights'] as const,
  fight: (id: number) => ['fight', id] as const,
  fightResponses: (id: number) => ['fight', id, 'responses'] as const,
  fightTurn: (id: number) => ['fight', id, 'turn'] as const,
  fightStats: ['fight-stats'] as const,
  panel: ['player-panel'] as const,
  inventory: (id: number) => ['inventory', id] as const,
  characterSkills: (id: number) => ['character-skills', id] as const,
  regions: ['regions'] as const,
  countries: ['countries'] as const,
  villages: ['villages'] as const,
  maps: ['maps'] as const,
  note: ['note'] as const,
}

// ---------- Catálogo ----------
export const useRaces = () => useQuery({ queryKey: keys.races, queryFn: () => get<Race[]>('/api/racas/') })
export const useClasses = () => useQuery({ queryKey: keys.classes, queryFn: () => get<CharacterClass[]>('/api/classes/') })
export const useItems = () => useQuery({ queryKey: keys.items, queryFn: () => get<Item[]>('/api/items/') })
export const useSkills = () => useQuery({ queryKey: keys.skills, queryFn: () => get<Skill[]>('/api/habilidades/') })
export const useEffectsCatalog = () =>
  useQuery({ queryKey: keys.effects, queryFn: () => get<EffectDefinition[]>('/api/master/buffs/') })

// ---------- Mundo ----------
export const useRegions = () => useQuery({ queryKey: keys.regions, queryFn: () => get<Region[]>('/api/regions/') })
export const useCountries = () => useQuery({ queryKey: keys.countries, queryFn: () => get<Country[]>('/api/countries/') })
export const useVillages = () => useQuery({ queryKey: keys.villages, queryFn: () => get<Village[]>('/api/villages/') })
export const useMaps = () => useQuery({ queryKey: keys.maps, queryFn: () => get<WorldMap[]>('/api/maps/') })

// ---------- Mestre ----------
export const useOverview = () => useQuery({ queryKey: keys.overview, queryFn: () => get<Overview>('/api/master/overview/') })
export const useAccounts = () => useQuery({ queryKey: keys.accounts, queryFn: () => get<Account[]>('/api/auth/users') })
export const useMasterCharacters = () =>
  useQuery({ queryKey: keys.masterCharacters, queryFn: () => get<MasterCharacter[]>('/api/master/characters/') })
export const useAudit = (characterId: number | null) =>
  useQuery({
    queryKey: keys.audit(characterId ?? 0),
    queryFn: () => get<AuditEntry[]>(`/api/master/characters/${characterId}/audit`, { limit: 20 }),
    enabled: Boolean(characterId),
  })
export const useRequests = () =>
  useQuery({ queryKey: keys.requests, queryFn: () => get<CharacterRequest[]>('/api/characters/requests/') })

// ---------- Lutas ----------
export const useFights = () => useQuery({ queryKey: keys.fights, queryFn: () => get<Fight[]>('/api/fights/') })
export const useFightStats = () => useQuery({ queryKey: keys.fightStats, queryFn: () => get<FightStats>('/api/fights/stats') })
/** `pollWhileLive`: o mestre não recebe os eventos de luta por WebSocket, então consulta a cada 4 s. */
export const useFight = (id: number, pollWhileLive = false) =>
  useQuery({
    queryKey: keys.fight(id),
    queryFn: () => get<Fight>(`/api/fights/${id}`),
    enabled: id > 0,
    refetchInterval: (query) => (pollWhileLive && query.state.data?.status === 'in_progress' ? 4000 : false),
  })
export const useFightResponses = (id: number, enabled = true) =>
  useQuery({
    queryKey: keys.fightResponses(id),
    queryFn: () => get<FightResponses>(`/api/fights/${id}/responses`),
    enabled: enabled && id > 0,
  })
export const useMyTurn = (id: number) =>
  useQuery({ queryKey: keys.fightTurn(id), queryFn: () => get<FightTurn>(`/api/fights/${id}/turn/me`), enabled: id > 0 })
export const useMasterTurn = (id: number, enabled = true) =>
  useQuery({
    queryKey: keys.fightTurn(id),
    queryFn: () => get<FightTurn>(`/api/fights/${id}/turn`),
    enabled: enabled && id > 0,
  })

// ---------- Jogador ----------
export const usePlayerPanel = () => useQuery({ queryKey: keys.panel, queryFn: () => get<PlayerPanel>('/api/player-panel/') })
export const useInventory = (characterId: number | null) =>
  useQuery({
    queryKey: keys.inventory(characterId ?? 0),
    queryFn: () => get<InventoryEntry[]>(`/api/characters/${characterId}/inventory/`),
    enabled: Boolean(characterId),
  })
export const useCharacterSkills = (characterId: number | null) =>
  useQuery({
    queryKey: keys.characterSkills(characterId ?? 0),
    queryFn: () => get<AssignedSkill[]>(`/api/characters/${characterId}/habilidades/`),
    enabled: Boolean(characterId),
  })
export const useMyRequests = () =>
  useQuery({ queryKey: ['my-requests'], queryFn: () => get<CharacterRequest[]>('/api/characters/requests/my') })
export const useNote = () =>
  useQuery({ queryKey: keys.note, queryFn: () => get<{ content: string | null }>('/api/notes/') })

// ---------- Escrita ----------

interface ActionOptions {
  /** Chaves recarregadas depois do sucesso. */
  invalidate?: QueryKey[]
  /** Mensagem de sucesso (toast). */
  success?: string
  /** Prefixo da mensagem de erro. */
  failure?: string
}

/** Mutação padrão: mostra toast de sucesso/erro e recarrega o que mudou. */
export function useAction<TVars = void, TResult = unknown>(
  fn: (vars: TVars) => Promise<TResult>,
  { invalidate = [], success, failure = 'Não foi possível concluir' }: ActionOptions = {},
) {
  const client = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const key of invalidate) client.invalidateQueries({ queryKey: key })
      if (success) toast.success(success)
    },
    onError: (error) => toast.error(`${failure}: ${errorMessage(error)}`),
  })
}

export const api = { get, post, put, del }
