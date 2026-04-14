import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Button, Card, StatBar } from '../components/common'
import PlayerCharacter from '../components/player/PlayerCharacter'
import PlayerCharacterEditor from '../components/player/PlayerCharacterEditor'
import PlayerInventory from '../components/player/PlayerInventory'
import PlayerSkills from '../components/player/PlayerSkills'
import PlayerChat from '../components/player/PlayerChat'
import Sidebar from '../components/common/Sidebar'
import CharacterRequestForm from './CharacterRequestForm'

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
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadCharacter = async () => {
      try {
        const response = await api.get('/my-characters/')
        const characters = response.data || []

        if (characters.length > 0) {
          const raw = characters[0]
          setCharacterData({
            id: raw.id,
            name: raw.name,
            race: raw.race || raw.raca_name || 'Desconhecida',
            class: raw.class || raw.classe_name || 'Desconhecida',
            level: raw.level ?? 1,
            hp: raw.hp ?? 0,
            maxHp: raw.maxHp ?? raw.hp ?? 0,
            vigor: raw.vigor ?? 0,
            maxVigor: raw.maxVigor ?? raw.vigor ?? 0,
            xp: raw.xp ?? 0,
            maxXp: raw.maxXp ?? 0,
            codename: raw.codename,
            description: raw.description,
            attributes: raw.attributes || {},
          })
        } else {
          setError('Nenhum personagem encontrado para este jogador.')
        }
      } catch (err) {
        console.error('Erro ao carregar personagem:', err)
        setError('Não foi possível carregar os dados do personagem.')
      } finally {
        setLoading(false)
      }
    }

    loadCharacter()
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
          {activeTab === TABS.CHARACTER && (
            <>
              {characterData ? (
                <>
                  <PlayerCharacter character={characterData} />
                  <div className="mt-6">
                    <PlayerCharacterEditor
                      character={characterData}
                      onUpdate={(updated) => setCharacterData((prev) => ({ ...prev, ...updated }))}
                    />
                  </div>
                </>
              ) : error ? (
                <>
                  <Card className="p-6 mb-6 bg-red-500/10 border border-red-500 text-red-200">
                    <p>{error}</p>
                  </Card>
                  <CharacterRequestForm />
                </>
              ) : null}
            </>
          )}
          {activeTab === TABS.INVENTORY && <PlayerInventory />}
          {activeTab === TABS.SKILLS && <PlayerSkills />}
          {activeTab === TABS.CHAT && <PlayerChat />}
        </div>
      </main>
    </div>
  )
}
