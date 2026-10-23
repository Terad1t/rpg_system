import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from '@/api/client'
import type { PanelCharacter } from '@/api/types'
import { renderWithApp } from '@/test/render'
import { LoginPage } from './auth/LoginPage'
import { CharacterSheet } from './player/CharacterSheet'
import { StatBar } from '@/ui/StatBar'
import { render } from '@testing-library/react'

beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

const character: PanelCharacter = {
  id: 1,
  name: 'Aria',
  codename: 'Coruja',
  description: 'Veio do norte.',
  portrait: null,
  hp: 8,
  maxHp: 10,
  mana: 3,
  maxMana: 5,
  buffs: JSON.stringify([{ name: 'Escudo' }]),
  debuffs: null,
  tipo: 'player',
  status: 'player',
  class: 'Maga',
  attributes: { intellect: 7, vigor: 4 },
  race: { id: 1, name: 'Elfo', description: null, image: null },
  freePoints: 2,
  totalPointsDistributed: 0,
  current_map_id: null,
  current_map: null,
  inventory: [],
}

describe('LoginPage', () => {
  it('mostra mensagem clara quando as credenciais estão erradas', async () => {
    vi.spyOn(http, 'post').mockRejectedValueOnce({ response: { status: 401, data: { detail: 'Invalid login credentials' } } })
    renderWithApp(<LoginPage />, { route: '/entrar' })

    await userEvent.type(screen.getByLabelText(/Usuário/), 'ana')
    await userEvent.type(screen.getByLabelText(/Senha/), 'errada1')
    await userEvent.type(screen.getByLabelText(/PIN/), '1234')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuário, senha ou PIN incorretos.')
    expect(http.post).toHaveBeenCalledWith('/api/auth/login', { login: 'ana', password: 'errada1', pin: '1234' })
  })

  it('guarda a sessão depois de entrar', async () => {
    vi.spyOn(http, 'post').mockResolvedValueOnce({
      data: { access_token: 'a.eyJleHAiOjk5OTk5OTk5OTl9.b', token_type: 'bearer', user_id: 2, role: 'player', login: 'ana' },
    })
    renderWithApp(<LoginPage />, { route: '/entrar' })
    await userEvent.type(screen.getByLabelText(/Usuário/), 'ana')
    await userEvent.type(screen.getByLabelText(/Senha/), 'senha12')
    await userEvent.type(screen.getByLabelText(/PIN/), '1234')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(localStorage.getItem('user:player')).toContain('"login":"ana"'))
  })
})

describe('CharacterSheet', () => {
  it('mostra atributos traduzidos e efeitos como etiquetas', () => {
    renderWithApp(<CharacterSheet character={character} />)
    expect(screen.getByText('Intelecto')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText(/Escudo/)).toBeInTheDocument()
    expect(screen.getByText('2 ponto(s) para distribuir')).toBeInTheDocument()
  })

  it('distribui um ponto no atributo escolhido', async () => {
    const spy = vi.spyOn(http, 'post').mockResolvedValueOnce({ data: { free_points: 1, attributes: [] } })
    renderWithApp(<CharacterSheet character={character} />)
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar 1 ponto em Intelecto' }))
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith('/api/characters/1/distribute-points', { attribute_name: 'intellect', points_to_add: 1 }, { params: undefined }),
    )
  })

  it('esconde os botões de ponto quando não há pontos livres', () => {
    renderWithApp(<CharacterSheet character={{ ...character, freePoints: 0 }} />)
    expect(screen.queryByRole('button', { name: /Adicionar 1 ponto/ })).not.toBeInTheDocument()
  })
})

describe('StatBar', () => {
  it('expõe o valor para leitores de tela e não quebra sem máximo', () => {
    render(<StatBar kind="hp" current={8} max={10} />)
    expect(screen.getByRole('progressbar', { name: 'Vida' })).toHaveAttribute('aria-valuenow', '8')
    render(<StatBar kind="mana" current={null} max={null} />)
    expect(screen.getByRole('progressbar', { name: 'Mana' })).toHaveAttribute('aria-valuemax', '0')
  })
})
