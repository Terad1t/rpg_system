import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import PlayerCharacter from './PlayerCharacter'

// Formato devolvido por GET /api/player-panel/
const baseCharacter = {
  id: 1,
  name: 'Aragorn',
  codename: 'O Montador',
  race: { id: 1, name: 'Humano', description: 'Versátil e adaptável' },
  class: 'Guerreiro',
  hp: 80,
  maxHp: 100,
  mana: 10,
  maxMana: 40,
  freePoints: 0,
  attributes: { strength: 18, vigor: 12, intellect: 9 },
  buffs: null,
  debuffs: null,
}

describe('PlayerCharacter', () => {
  it('mostra nome, codinome, raça e classe', () => {
    render(<PlayerCharacter character={baseCharacter} />)
    expect(screen.getByText('Aragorn')).toBeInTheDocument()
    expect(screen.getByText('O Montador')).toBeInTheDocument()
    expect(screen.getByText(/Humano • Guerreiro/)).toBeInTheDocument()
  })

  it('mostra barras de vida e mana com os valores atuais', () => {
    render(<PlayerCharacter character={baseCharacter} />)
    expect(screen.getByRole('progressbar', { name: 'Vida' })).toHaveAttribute('aria-valuenow', '80')
    expect(screen.getByRole('progressbar', { name: 'Mana' })).toHaveAttribute('aria-valuemax', '40')
    expect(screen.getByText('80 / 100')).toBeInTheDocument()
  })

  it('traduz os nomes dos atributos', () => {
    render(<PlayerCharacter character={baseCharacter} />)
    expect(screen.getByText('Força')).toBeInTheDocument()
    expect(screen.getByText('Vigor')).toBeInTheDocument()
    expect(screen.getByText('Intelecto')).toBeInTheDocument()
    expect(screen.getByText('18')).toBeInTheDocument()
  })

  it('não quebra sem atributos, raça ou valores de status', () => {
    render(<PlayerCharacter character={{ id: 2, name: 'Sem dados' }} />)
    expect(screen.getByText('Sem dados')).toBeInTheDocument()
    expect(screen.getByText(/Raça indefinida/)).toBeInTheDocument()
    expect(screen.queryByText('Atributos')).not.toBeInTheDocument()
  })

  it('avisa quando há pontos livres', () => {
    render(<PlayerCharacter character={{ ...baseCharacter, freePoints: 3 }} />)
    expect(screen.getByText(/3 ponto\(s\) livre\(s\)/)).toBeInTheDocument()
  })

  it('lista buffs e debuffs como etiquetas em vez de JSON', () => {
    const expiresAt = new Date(Date.now() + 120_000).toISOString().replace('Z', '')
    render(
      <PlayerCharacter
        character={{
          ...baseCharacter,
          buffs: JSON.stringify([{ name: 'Escudo', expires_at: expiresAt }]),
          debuffs: JSON.stringify([{ name: 'Veneno' }]),
        }}
      />,
    )
    expect(screen.getByText('Escudo')).toBeInTheDocument()
    expect(screen.getByText('2 min')).toBeInTheDocument()
    expect(screen.getByText('Veneno')).toBeInTheDocument()
    expect(screen.queryByText(/expires_at/)).not.toBeInTheDocument()
  })
})
