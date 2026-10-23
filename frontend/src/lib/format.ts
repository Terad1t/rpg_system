/** Datas do backend vêm em UTC sem fuso ("2026-10-22T18:00:00"). */
export function parseServerDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const date = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDateTime(value: string | null | undefined): string {
  const date = parseServerDate(value)
  return date ? date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'
}

export function formatTime(value: string | null | undefined): string {
  const date = parseServerDate(value) ?? new Date()
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function formatNumber(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString('pt-BR')
}

export const ATTRIBUTE_LABELS: Record<string, string> = {
  strength: 'Força',
  defense: 'Defesa',
  energy: 'Energia',
  healing: 'Cura',
  magic: 'Magia',
  mana: 'Mana',
  damage: 'Dano',
  intelligence: 'Inteligência',
  intellect: 'Intelecto',
  charisma: 'Carisma',
  hp: 'Vida',
  vigor: 'Vigor',
  agility: 'Agilidade',
  speed: 'Velocidade',
  investigation: 'Investigação',
  presence: 'Presença',
  occultism: 'Ocultismo',
}

export const CHARACTER_TYPE_LABELS: Record<string, string> = {
  player: 'Jogador',
  npc: 'NPC',
  boss: 'Chefe',
  dead: 'Morto',
}

export const ACTION_LABELS: Record<string, string> = {
  attack: 'Ataque',
  heal: 'Cura',
  defend: 'Defesa',
  skill: 'Habilidade',
  ready: 'Pronto',
}

export const FIGHT_STATUS_LABELS: Record<string, string> = {
  in_progress: 'Em andamento',
  paused: 'Preparando',
  finished: 'Encerrada',
}
