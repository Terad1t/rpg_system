import { afterEach, describe, expect, it } from 'vitest'
import { clearSession, getSession, isTokenExpired, saveSession } from './session'
import { parseEffects, remainingLabel } from './effects'
import { applyInventoryEvent } from '../hooks/useInventoryWebSocket'
import { errorMessage } from '../services/api'

function fakeToken(expSeconds) {
  const encode = (value) => btoa(JSON.stringify(value)).replace(/=+$/, '')
  return `${encode({ alg: 'HS256' })}.${encode({ sub: '1', exp: expSeconds })}.assinatura`
}

describe('session', () => {
  afterEach(() => localStorage.clear())

  it('guarda sessões separadas por papel', () => {
    const future = Math.floor(Date.now() / 1000) + 3600
    saveSession({ token: fakeToken(future), user: { id: 1, login: 'mestre', role: 'master' } })
    saveSession({ token: fakeToken(future), user: { id: 2, login: 'ana', role: 'player' } })

    expect(getSession('master').user.login).toBe('mestre')
    expect(getSession('player').user.login).toBe('ana')

    clearSession('player')
    expect(getSession('player')).toBeNull()
    expect(getSession('master')).not.toBeNull()
  })

  it('descarta sessão com token vencido', () => {
    const past = Math.floor(Date.now() / 1000) - 10
    saveSession({ token: fakeToken(past), user: { id: 1, login: 'ana', role: 'player' } })
    expect(isTokenExpired(fakeToken(past))).toBe(true)
    expect(getSession('player')).toBeNull()
    expect(localStorage.getItem('token:player')).toBeNull()
  })
})

describe('applyInventoryEvent', () => {
  const potion = { id: 10, item: { id: 5, name: 'Poção' }, quantidade: 2 }

  it('soma, cria, subtrai e define quantidade', () => {
    expect(applyInventoryEvent([potion], { action: 'added', item_id: 5, quantity: 3 })[0].quantidade).toBe(5)
    expect(applyInventoryEvent([], { action: 'added', item_id: 7, item_name: 'Espada', quantity: 1 })[0].item.name).toBe('Espada')
    expect(applyInventoryEvent([potion], { action: 'removed', item_id: 5, quantity: 2 })).toEqual([])
    expect(applyInventoryEvent([potion], { action: 'updated', item_id: 5, quantity: 9 })[0].quantidade).toBe(9)
  })
})

describe('parseEffects', () => {
  it('aceita JSON, lista e texto livre', () => {
    expect(parseEffects('[{"name":"Escudo"}]')).toEqual([{ name: 'Escudo', expiresAt: null }])
    expect(parseEffects(['Fúria'])).toEqual([{ name: 'Fúria', expiresAt: null }])
    expect(parseEffects('Veneno, Lentidão').map((e) => e.name)).toEqual(['Veneno', 'Lentidão'])
    expect(parseEffects(null)).toEqual([])
  })

  it('formata o tempo restante', () => {
    const now = Date.parse('2026-01-01T00:00:00Z')
    expect(remainingLabel(new Date(now + 90_000), now)).toBe('2 min')
    expect(remainingLabel(new Date(now + 30_000), now)).toBe('30 s')
    expect(remainingLabel(null, now)).toBeNull()
  })
})

describe('errorMessage', () => {
  it('lê detail em texto e erros de validação do FastAPI', () => {
    expect(errorMessage({ response: { data: { detail: 'Not your turn' } } })).toBe('Not your turn')
    const validation = { response: { data: { detail: [{ loc: ['body', 'name'], msg: 'Field required' }] } } }
    expect(errorMessage(validation)).toBe('name: Field required')
    expect(errorMessage({ message: 'Network Error' })).toBe('Não foi possível falar com o servidor.')
    expect(errorMessage({}, 'padrão')).toBe('padrão')
  })
})
