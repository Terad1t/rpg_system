import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button, Card, StatBar } from '../components/common'
import PlayerCharacter from '../components/player/PlayerCharacter'
import PlayerInventory from '../components/player/PlayerInventory'
import PlayerSkills from '../components/player/PlayerSkills'
import PlayerChat from '../components/player/PlayerChat'
import Sidebar from '../components/common/Sidebar'

const TABS = {
  CHARACTER: 'character',
  INVENTORY: 'inventory',
  SKILLS: 'skills',
  CHAT: 'chat',
}

export default function PlayerDashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState(TABS.CHARACTER)
  const [characterData, setCharacterData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Aqui você carregaria os dados do personagem da API
    // Por enquanto, vamos usar dados mock
    setTimeout(() => {
      setCharacterData({
        id: 1,
        name: 'Aragorn',
        race: 'Humano',
        class: 'Guerreiro',
        level: 25,
        hp: 150,
        maxHp: 200,
        vigor: 80,
        maxVigor: 100,
        attributes: {
          strength: 18,
          dexterity: 14,
          constitution: 16,
          intelligence: 12,
          wisdom: 13,
          charisma: 15,
        },
        xp: 7500,
        maxXp: 10000,
      })
      setLoading(false)
    }, 500)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-secondary">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-dark">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-dark-secondary border-b border-dark-border p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-orange-500">Bem-vindo, {user?.login}</h1>
              <p className="text-secondary mt-1">Personagem: {characterData?.name}</p>
            </div>
            <Button variant="ghost" onClick={logout}>
              Sair
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === TABS.CHARACTER && characterData && (
            <PlayerCharacter character={characterData} />
          )}
          {activeTab === TABS.INVENTORY && <PlayerInventory />}
          {activeTab === TABS.SKILLS && <PlayerSkills />}
          {activeTab === TABS.CHAT && <PlayerChat />}
        </div>
      </main>
    </div>
  )
}
