import type { Notification } from '@/api/types'

type Data = Record<string, unknown>
const str = (value: unknown, fallback = '') => (value === undefined || value === null ? fallback : String(value))

const FORMATTERS: Record<string, (data: Data) => string> = {
  character_request_created: (d) => `Nova solicitação de personagem: ${str(d.name, 'sem nome')} (${str(d.player_login, 'jogador')})`,
  character_request_approved: (d) => `Seu personagem ${str(d.name)} foi aprovado!`,
  character_request_rejected: (d) => `A solicitação de ${str(d.name)} foi recusada.`,
  character_applied: () => 'O mestre atualizou sua ficha.',
  character_effects_updated: () => 'Um efeito da sua ficha terminou.',
  character_visibility_changed: () => 'O mestre mudou quem pode ver sua ficha.',
  fight_invite: (d) => `Convite para a luta ${str(d.name, `#${str(d.fight_id)}`)}`,
  fight_invite_response: (d) => `Jogador #${str(d.user_id)} ${d.accept ? 'aceitou' : 'recusou'} o convite da luta #${str(d.fight_id)}`,
  fight_invite_results: (d) => {
    const accepted = Array.isArray(d.accepted) ? d.accepted.length : 0
    const declined = Array.isArray(d.declined) ? d.declined.length : 0
    return `Convites da luta #${str(d.fight_id)} encerrados: ${accepted} aceito(s), ${declined} recusado(s)`
  },
  fight_started: (d) => `A luta ${str(d.name, `#${str(d.fight_id)}`)} começou!`,
  fight_event: (d) => {
    const entry = (d.entry ?? {}) as Data
    return `${str(entry.actor_name, 'Alguém')} agiu na luta #${str(d.fight_id)}`
  },
  turn_changed: (d) => `Novo turno na luta #${str(d.fight_id)}`,
  inventory_update: (d) => `Inventário atualizado: ${str(d.item_name)}`,
}

export function describeNotification(notification: Notification): string {
  const format = FORMATTERS[notification.type]
  return format ? format(notification.data ?? {}) : notification.type.replace(/_/g, ' ')
}
