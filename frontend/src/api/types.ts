// Tipos das respostas da API (espelham os schemas Pydantic do backend).

export type Role = 'master' | 'player'

export interface SessionUser {
  id: number
  login: string
  role: Role
}

export interface LoginResponse {
  access_token: string
  token_type: 'bearer'
  user_id: number
  role: Role
  login: string
}

export interface Account {
  id: number
  login: string
  role: Role
  is_active: boolean
  created_by: number | null
  created_at: string
  updated_at: string
}

export interface Race {
  id: number
  name: string
  description: string | null
  image: string | null
}

export interface CharacterClass {
  id: number
  name: string
  subclass: string | null
  description: string | null
}

export interface Item {
  id: number
  name: string
  tipo: string
  image: string | null
  description: string | null
  buffs: string | null
  nerfs: string | null
  quantity: number | null
  quantidade_maxima: number | null
}

export type SkillType = 'race' | 'class' | 'item'

export interface Skill {
  id: number
  name: string
  tipo: SkillType
  custo_vigor: number | null
  custo_vida: number | null
  dano_base: number | null
  efeitos_atributos: string | null
  classe_id: number | null
  raca_id: number | null
  item_id: number | null
}

export interface EffectDefinition {
  id: number
  name: string
  kind: 'buff' | 'debuff'
  description: string | null
  duration_default_seconds: number | null
  stackable: boolean
  created_at: string | null
}

export type CharacterType = 'player' | 'npc' | 'boss' | 'dead'

/** Linha de GET /api/master/characters/ */
export interface MasterCharacter {
  id: number
  name: string
  age: number | null
  subclass: string | null
  raca_id: number
  classe_id: number
  user_id: number | null
  current_map_id: number | null
  free_points: number
  codename: string | null
  description: string | null
  portrait: string | null
  hp: number | null
  max_hp: number | null
  mana: number | null
  max_mana: number | null
  buffs: string | null
  debuffs: string | null
  tipo: CharacterType
  visibility: string | null
  is_dead: boolean
  is_npc: boolean
  is_online: boolean
  owner: { id: number; login: string; role: Role; is_active: boolean } | null
  race: { id: number | null; name: string | null; image: string | null }
  class: string | null
  current_map: { id: number; name: string } | null
}

export interface AuditEntry {
  id: number
  master_id: number
  character_id: number
  action: string
  payload: string | null
  created_at: string | null
}

export type VisibilityRule = 'public' | 'owner_only' | 'same_map' | 'same_party' | 'friends' | 'allow_list'
export type PublicField = 'codename' | 'race' | 'class' | 'status' | 'portrait'

export interface Visibility {
  show_hp: boolean
  show_mana: boolean
  show_buffs: boolean
  show_debuffs: boolean
  rule: VisibilityRule
  allow_user_ids: number[]
  friend_user_ids: number[]
  public_fields: PublicField[]
}

export interface InventoryEntry {
  id: number | string
  character_id?: number
  item_id: number
  quantidade: number
  item: Pick<Item, 'id' | 'name'> & Partial<Item>
}

export interface AssignedSkill {
  id: number
  character_id: number
  habilidade_id: number
  habilidade: Pick<Skill, 'id' | 'name' | 'tipo' | 'custo_vigor' | 'custo_vida' | 'dano_base' | 'efeitos_atributos'> | null
}

/** Personagem como vem em GET /api/player-panel/ */
export interface PanelCharacter {
  id: number
  name: string
  codename: string | null
  description: string | null
  portrait: string | null
  hp: number | null
  maxHp: number | null
  mana: number | null
  maxMana: number | null
  buffs: string | null
  debuffs: string | null
  tipo: CharacterType
  status: string
  class: string
  attributes: Record<string, number>
  race: { id: number | null; name: string | null; description: string | null; image: string | null }
  freePoints: number
  totalPointsDistributed: number
  current_map_id: number | null
  current_map: { id: number; name: string; map_type: string | null; description: string | null; image: string | null } | null
  inventory: InventoryEntry[]
}

export interface MapNode {
  id: number
  name: string
  image: string | null
  description: string | null
  danger_level: string | null
  map_type: string | null
  children: MapNode[]
}

export interface WorldVillage {
  id: number
  name: string
  description: string | null
  image: string | null
  maps: MapNode[]
}

export interface WorldCountry extends WorldVillage {
  villages: WorldVillage[]
}

export interface WorldRegion {
  id: number
  name: string
  description: string | null
  climate: string | null
  maps: MapNode[]
  countries: WorldCountry[]
}

export interface PlayerPanel {
  characters: PanelCharacter[]
  races: Race[]
  world_map: WorldRegion[]
}

export interface Region {
  id: number
  name: string
  description: string | null
  climate: string | null
}

export interface Country {
  id: number
  region_id: number
  name: string
  description: string | null
  image: string | null
}

export interface Village {
  id: number
  country_id: number
  name: string
  description: string | null
  image: string | null
}

export type MapType = 'residence' | 'shop' | 'village' | 'country' | 'region'
export type DangerLevel = 'none' | 'medium' | 'high' | 'spiritual' | 'ascendant'

export interface WorldMap {
  id: number
  name: string
  image: string | null
  description: string | null
  allowed_races: number[] | null
  danger_level: DangerLevel | null
  map_type: MapType | null
  region_id: number | null
  country_id: number | null
  village_id: number | null
  parent_map_id: number | null
}

export type RequestStatus = 'pending' | 'approved' | 'rejected'

export interface CharacterRequest {
  id: number
  user_id: number
  codename: string | null
  name: string
  raca_id: number
  classe_id: number
  region_id: number | null
  age: number | null
  height: number | null
  description: string | null
  status: RequestStatus
  created_at: string | null
  approved_by: number | null
  approved_at: string | null
}

export type FightStatus = 'in_progress' | 'finished' | 'paused'
export type ActorType = 'player' | 'enemy'
export type PlayerAction = 'attack' | 'heal' | 'defend' | 'skill' | 'ready'

export interface FightEntry {
  id: number
  fight_id?: number
  actor_type: ActorType
  actor_name: string
  damage: number
  healing: number
  action: string | null
  value: number | null
  card_id?: number | null
  created_at?: string
  timestamp?: string | null
}

export interface Fight {
  id: number
  name: string
  started_at: string
  ended_at: string | null
  status: FightStatus
  duration_seconds: number
  total_player_damage: number
  total_enemy_damage: number
  total_player_healing: number
  total_enemy_healing: number
  entries: FightEntry[]
}

export interface FightResponses {
  fight_id: number
  accepted: number[]
  declined: number[]
  pending: number[]
}

export interface FightTurn {
  fight_id: number
  current_user_id: number | null
  current_index: number | null
  phase: string | null
  is_my_turn: boolean
}

export interface RankingItem {
  name: string
  value: number
}

export interface FightHistoryItem {
  id: number
  name: string
  started_at: string | null
  status: FightStatus
  player_damage: number
  enemy_damage: number
  player_healing: number
  enemy_healing: number
}

export interface FightStats {
  fight_count: number
  total_player_damage: number
  total_enemy_damage: number
  total_player_healing: number
  total_enemy_healing: number
  history: FightHistoryItem[]
  player_ranking: RankingItem[]
  enemy_ranking: RankingItem[]
}

export interface Overview {
  players: number
  characters: number
  player_characters: number
  items: number
  fights: number
  pending_requests: number
}

export interface ChatMessage {
  id?: number
  user_id: number
  username: string
  message: string
  created_at: string | null
  message_type: 'message' | 'history' | 'system' | 'error' | 'user_joined' | 'user_left'
}

/** Mensagem do canal /ws/user-updates/{id} */
export interface Notification<T = Record<string, unknown>> {
  type: string
  data: T
  timestamp?: string
}
