/**
 * Testes para o componente PlayerCharacter
 * Valida a renderização e comportamento do componente
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PlayerCharacter from '../components/player/PlayerCharacter'

describe('PlayerCharacter Component', () => {
  const mockCharacter = {
    id: 1,
    name: 'Aragorn',
    race: 'Humano',
    class: 'Guerreiro',
    level: 15,
    hp: 80,
    maxHp: 100,
    vigor: 50,
    maxVigor: 60,
    xp: 3500,
    maxXp: 5000,
    codename: 'O Montador',
    description: 'Um guerreiro nobre',
    attributes: {
      strength: 18,
      dexterity: 14,
      constitution: 16,
      intelligence: 12,
      wisdom: 13,
      charisma: 15,
    },
  }

  it('deve renderizar o componente com dados corretos', () => {
    render(<PlayerCharacter character={mockCharacter} />)
    
    expect(screen.getByText('Aragorn')).toBeInTheDocument()
    expect(screen.getByText('Humano')).toBeInTheDocument()
    expect(screen.getByText('Guerreiro')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('deve renderizar as barras de status corretamente', () => {
    render(<PlayerCharacter character={mockCharacter} />)
    
    // Verifica se os labels aparecem
    expect(screen.getByText('Vida')).toBeInTheDocument()
    expect(screen.getByText('Vigor')).toBeInTheDocument()
    expect(screen.getByText('XP')).toBeInTheDocument()
  })

  it('deve calcular corretamente XP faltando para próximo nível', () => {
    render(<PlayerCharacter character={mockCharacter} />)
    
    // maxXp - xp = 5000 - 3500 = 1500
    expect(screen.getByText('1500 XP para próximo nível')).toBeInTheDocument()
  })

  it('deve renderizar todos os atributos', () => {
    render(<PlayerCharacter character={mockCharacter} />)
    
    expect(screen.getByText('Força')).toBeInTheDocument()
    expect(screen.getByText('Destreza')).toBeInTheDocument()
    expect(screen.getByText('Constituição')).toBeInTheDocument()
    expect(screen.getByText('Inteligência')).toBeInTheDocument()
    expect(screen.getByText('Sabedoria')).toBeInTheDocument()
    expect(screen.getByText('Carisma')).toBeInTheDocument()
  })

  it('deve exibir os valores de atributos', () => {
    render(<PlayerCharacter character={mockCharacter} />)
    
    expect(screen.getByText('18')).toBeInTheDocument() // Strength
    expect(screen.getByText('14')).toBeInTheDocument() // Dexterity
    expect(screen.getByText('16')).toBeInTheDocument() // Constitution
  })

  it('deve calcular os modificadores de atributo corretamente', () => {
    render(<PlayerCharacter character={mockCharacter} />)
    
    // Strength: 18 => (18 - 10) / 2 = 4
    // Próximo ao 18 deve estar "(+4)"
    const labels = screen.getAllByText(/\(\+\d\)/)
    expect(labels.length).toBeGreaterThan(0)
  })

  it('deve mostrar modificador negativo para atributos baixos', () => {
    const characterLowStats = {
      ...mockCharacter,
      attributes: {
        strength: 8,  // (8 - 10) / 2 = -1
        dexterity: 9, // (9 - 10) / 2 = -0.5 = -1
        constitution: 10,
        intelligence: 10,
        wisdom: 11,
        charisma: 10,
      },
    }
    
    render(<PlayerCharacter character={characterLowStats} />)
    
    const labels = screen.getAllByText(/\(-\d\)/)
    expect(labels.length).toBeGreaterThan(0)
  })

  it('deve renderizar corretamente com valores de HP baixos', () => {
    const characterLowHp = {
      ...mockCharacter,
      hp: 10,
      maxHp: 100,
    }
    
    render(<PlayerCharacter character={characterLowHp} />)
    
    expect(screen.getByText('Aragorn')).toBeInTheDocument()
  })

  it('deve renderizar corretamente com XP no máximo', () => {
    const characterMaxXp = {
      ...mockCharacter,
      xp: 5000,
      maxXp: 5000,
    }
    
    render(<PlayerCharacter character={characterMaxXp} />)
    
    // maxXp - xp = 5000 - 5000 = 0
    expect(screen.getByText('0 XP para próximo nível')).toBeInTheDocument()
  })

  it('deve renderizar a estrutura de grid corretamente', () => {
    const { container } = render(<PlayerCharacter character={mockCharacter} />)
    
    // Verifica a presença de elementos grid
    const gridElements = container.querySelectorAll('[class*="grid"]')
    expect(gridElements.length).toBeGreaterThan(0)
  })

  it('deve renderizar as cards com conteúdo', () => {
    const { container } = render(<PlayerCharacter character={mockCharacter} />)
    
    // Verifica a presença de elementos Card
    const cardElements = container.querySelectorAll('[class*="rounded"]')
    expect(cardElements.length).toBeGreaterThan(0)
  })
})

describe('PlayerCharacter - Casos extremos', () => {
  it('deve renderizar com caracteres especiais no nome', () => {
    const character = {
      id: 1,
      name: "Aragorn's Élder\n",
      race: 'Humano',
      class: 'Guerreiro',
      level: 1,
      hp: 10,
      maxHp: 10,
      vigor: 10,
      maxVigor: 10,
      xp: 0,
      maxXp: 100,
      codename: 'Nome com Acentuação\n',
      description: 'Descrição com símbolos: @#$%',
      attributes: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
    }
    
    render(<PlayerCharacter character={character} />)
    
    expect(screen.getByText("Aragorn's Élder\n")).toBeInTheDocument()
  })

  it('deve renderizar com atributos mínimos (valor 1)', () => {
    const character = {
      id: 1,
      name: 'Fraco',
      race: 'Goblin',
      class: 'Mago',
      level: 1,
      hp: 1,
      maxHp: 1,
      vigor: 1,
      maxVigor: 1,
      xp: 0,
      maxXp: 1,
      codename: 'Miserável',
      description: 'Muito fraco',
      attributes: {
        strength: 1,
        dexterity: 1,
        constitution: 1,
        intelligence: 1,
        wisdom: 1,
        charisma: 1,
      },
    }
    
    render(<PlayerCharacter character={character} />)
    
    expect(screen.getByText('Fraco')).toBeInTheDocument()
  })

  it('deve renderizar com atributos máximos (valor 20+)', () => {
    const character = {
      id: 1,
      name: 'Lendário',
      race: 'Semideus',
      class: 'Campeão',
      level: 20,
      hp: 500,
      maxHp: 500,
      vigor: 500,
      maxVigor: 500,
      xp: 1000000,
      maxXp: 1000000,
      codename: 'O Imortal',
      description: 'Ser de poder infinito',
      attributes: {
        strength: 25,
        dexterity: 25,
        constitution: 25,
        intelligence: 25,
        wisdom: 25,
        charisma: 25,
      },
    }
    
    render(<PlayerCharacter character={character} />)
    
    expect(screen.getByText('Lendário')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
  })
})
