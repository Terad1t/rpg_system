import { afterEach, describe, expect, it } from 'vitest'
import { errorMessage } from '@/api/client'
import { applyInventoryEvent } from '@/features/player/Inventory'
import { parseEffects, remainingLabel } from './effects'
import { parseServerDate } from './format'
import { describeNotification } from './notifications'
import { clearSession, getSession, isTokenExpired, roleFromPath, saveSession } from './session'

function fakeToken(expSeconds: number) {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, '')
  return `${encode({ alg: 'HS256' })}.${encode({ sub: '1', exp: expSeconds })}.assinatura`
}

describe('session', () => {
  afterEach(() => localStorage.clear())

  it('guarda sessões separadas por papel', () => {
    const future = Math.floor(Date.now() / 1000) + 3600
    saveSession({ token: fakeToken(future), user: { id: 1, login: 'mestre', role: 'master' } })
    saveSession({ token: fakeToken(future), user: { id: 2, login: 'ana', role: 'player' } })
    expect(getSession('master')?.user.login).toBe('mestre')
    expect(getSession('player')?.user.login).toBe('ana')
    clearSession('player')
    expect(getSession('player')).toBeNull()
    expect(getSession('master')).not.toBeNull()
  })

  it('descarta token vencido', () => {
    const past = Math.floor(Date.now() / 1000) - 10
    saveSession({ token: fakeToken(past), user: { id: 1, login: 'ana', role: 'player' } })
    expect(isTokenExpired(fakeToken(past))).toBe(true)
    expect(getSession('player')).toBeNull()
  })

  it('descobre o papel pela rota', () => {
    expect(roleFromPath('/mestre/lutas')).toBe('master')
    expect(roleFromPath('/jogador/personagem/3')).toBe('player')
    expect(roleFromPath('/entrar')).toBeNull()
  })
})

describe('applyInventoryEvent', () => {
  const potion = { id: 10, item_id: 5, item: { id: 5, name: 'Poção' }, quantidade: 2 }

  it('soma, cria, subtrai e define quantidade', () => {
    expect(applyInventoryEvent([potion], { action: 'added', item_id: 5, item_name: 'Poção', quantity: 3 })[0].quantidade).toBe(5)
    expect(applyInventoryEvent([], { action: 'added', item_id: 7, item_name: 'Espada', quantity: 1 })[0].item.name).toBe('Espada')
    expect(applyInventoryEvent([potion], { action: 'removed', item_id: 5, item_name: 'Poção', quantity: 2 })).toEqual([])
    expect(applyInventoryEvent([potion], { action: 'updated', item_id: 5, item_name: 'Poção', quantity: 9 })[0].quantidade).toBe(9)
  })
})

describe('effects e datas', () => {
  it('aceita JSON, lista e texto livre', () => {
    expect(parseEffects('[{"name":"Escudo"}]')).toEqual([{ name: 'Escudo', expiresAt: null }])
    expect(parseEffects(['Fúria'])).toEqual([{ name: 'Fúria', expiresAt: null }])
    expect(parseEffects('Veneno, Lentidão').map((e) => e.name)).toEqual(['Veneno', 'Lentidão'])
    expect(parseEffects(null)).toEqual([])
  })

  it('formata tempo restante', () => {
    const now = Date.parse('2026-01-01T00:00:00Z')
    expect(remainingLabel(new Date(now + 90_000), now)).toBe('2 min')
    expect(remainingLabel(new Date(now + 30_000), now)).toBe('30 s')
    expect(remainingLabel(null, now)).toBeNull()
  })

  it('trata datas do servidor como UTC', () => {
    expect(parseServerDate('2026-10-22T18:00:00')?.toISOString()).toBe('2026-10-22T18:00:00.000Z')
    expect(parseServerDate('2026-10-22T18:00:00+00:00')?.toISOString()).toBe('2026-10-22T18:00:00.000Z')
    expect(parseServerDate(null)).toBeNull()
  })
})

describe('mensagens', () => {
  it('lê erros do FastAPI', () => {
    expect(errorMessage({ response: { data: { detail: 'Not your turn' } } })).toBe('Not your turn')
    expect(errorMessage({ response: { data: { detail: [{ loc: ['body', 'name'], msg: 'Field required' }] } } })).toBe('name: Field required')
    expect(errorMessage({ message: 'Network Error' })).toBe('Não foi possível falar com o servidor.')
    expect(errorMessage({}, 'padrão')).toBe('padrão')
  })

  it('descreve notificações em português', () => {
    expect(describeNotification({ type: 'fight_started', data: { fight_id: 3, name: 'Emboscada' } })).toBe('A luta Emboscada começou!')
    expect(describeNotification({ type: 'algo_novo', data: {} })).toBe('algo novo')
  })
})
