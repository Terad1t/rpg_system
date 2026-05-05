import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button, NotificationCenter } from '../components/common'
import Sidebar from '../components/common/Sidebar'
import { useUserNotificationsWebSocket } from '../hooks/useUserNotificationsWebSocket'
import ItemManager from './ItemManager'
import CharacterRequests from './CharacterRequests'
import RaceManager from './RaceManager'
import ClassManager from './ClassManager'
import api from '../services/api'
import StatsGrid from '../components/dashboard/StatsGrid'
import PlayerGrowthChart from '../components/dashboard/PlayerGrowthChart'
import ClassDistributionPie from '../components/dashboard/ClassDistributionPie'
import ItemsBarChart from '../components/dashboard/ItemsBarChart'

const TABS = {
  DASHBOARD: 'dashboard',
  PLAYERS: 'players',
  CHARACTERS: 'characters',
  ITEMS: 'items',
  RACES: 'races',
  CLASSES: 'classes',
  SKILLS: 'skills',
  MAP: 'map',
}

export default function MasterDashboard() {
  const { user, logout } = useAuth()
  const { isConnected, notifications, clearNotifications } = useUserNotificationsWebSocket(user?.id)
  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let mounted = true

    const loadStats = async () => {
      try {
        const res = await api.get('/master/stats')
        if (mounted && res?.data) setStats(res.data)
      } catch (err) {
        // Falha ao buscar dados: usar dados mock por segurança
        if (mounted) {
          setStats({
            players: 128,
            characters: 342,
            activeSessions: 12,
            items: 475,
            growth: [
              { date: '01/04', players: 12 },
              { date: '02/04', players: 18 },
              { date: '03/04', players: 22 },
              { date: '04/04', players: 30 },
              { date: '05/04', players: 27 },
              { date: '06/04', players: 35 },
            ],
            classDistribution: [
              { name: 'Guerreiro', value: 40 },
              { name: 'Mago', value: 25 },
              { name: 'Ladino', value: 15 },
              { name: 'Clérigo', value: 12 },
              { name: 'Outro', value: 8 },
            ],
            itemsByCategory: [
              { category: 'Armas', count: 120 },
              { category: 'Armaduras', count: 80 },
              { category: 'Consumíveis', count: 240 },
              { category: 'Artefatos', count: 35 },
            ],
          })
        }
      }
    }

    loadStats()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="flex h-screen bg-dark">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isMaster={true} />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-dark-secondary border-b border-dark-border p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-orange-500">Painel Master</h1>
              <p className="text-secondary mt-1">Bem-vindo, Mestre</p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationCenter
                notifications={notifications}
                isConnected={isConnected}
                onClear={clearNotifications}
              />
              <Button variant="ghost" onClick={logout}>
                Sair
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === TABS.DASHBOARD ? (
            <>
              <StatsGrid stats={stats} />

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <PlayerGrowthChart data={stats?.growth} />
                <ClassDistributionPie data={stats?.classDistribution} />
              </div>

              <div className="mt-6">
                <ItemsBarChart data={stats?.itemsByCategory} />
              </div>
            </>
          ) : activeTab === TABS.CHARACTERS ? (
            <CharacterRequests />
          ) : activeTab === TABS.ITEMS ? (
            <ItemManager />
          ) : activeTab === TABS.RACES ? (
            <RaceManager />
          ) : activeTab === TABS.CLASSES ? (
            <ClassManager />
          ) : (
            <p className="text-secondary">Seção {activeTab} em desenvolvimento...</p>
          )}
        </div>
      </main>
    </div>
  )
}
