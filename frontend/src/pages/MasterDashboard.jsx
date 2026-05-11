import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button, NotificationCenter } from '../components/common'
import Sidebar from '../components/common/Sidebar'
import { useUserNotificationsWebSocket } from '../hooks/useUserNotificationsWebSocket'
import ItemManager from './ItemManager'
import CharacterRequests from './CharacterRequests'
import MasterCharacterManager from './MasterCharacterManager'
import RaceManager from './RaceManager'
import ClassManager from './ClassManager'
import FightManager from './FightManager'
import api from '../services/api'
import StatsGrid from '../components/dashboard/StatsGrid'
import FightStatsPanel from '../components/dashboard/FightStatsPanel'

const TABS = {
  DASHBOARD: 'dashboard',
  PLAYERS: 'players',
  CHARACTERS: 'characters',
  ITEMS: 'items',
  FIGHT: 'fight',
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
        const res = await api.get('/api/fights/stats')
        if (mounted && res?.data) setStats(res.data)
      } catch (err) {
        // Falha ao buscar dados: usar dados mock por segurança
        if (mounted) {
          setStats({
            players: 128,
            characters: 342,
            fight_count: 12,
            items: 475,
            total_player_damage: 820,
            total_enemy_damage: 670,
            total_player_healing: 410,
            total_enemy_healing: 180,
            average_session: {
              player_damage: 136.6,
              enemy_damage: 111.6,
              player_healing: 68.3,
              enemy_healing: 30,
            },
            damage_chart: [
              { session: 'Fight 01', players: 160, enemies: 120 },
              { session: 'Fight 02', players: 230, enemies: 190 },
            ],
            healing_chart: [
              { session: 'Fight 01', players: 90, enemies: 20 },
              { session: 'Fight 02', players: 120, enemies: 60 },
            ],
            evolution: [
              { date: '01/04', players: 250, enemies: 140 },
              { date: '02/04', players: 350, enemies: 210 },
            ],
            history: [
              {
                id: 1,
                name: 'Fight 01',
                started_at: '2026-04-01T18:00:00',
                status: 'finished',
                duration_seconds: 420,
                player_damage: 160,
                enemy_damage: 120,
                player_healing: 90,
                enemy_healing: 20,
              },
            ],
            player_ranking: [{ name: 'Akira', value: 240 }],
            enemy_ranking: [{ name: 'Shadow', value: 180 }],
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

              <div className="mt-6">
                <FightStatsPanel stats={stats} />
              </div>
            </>
          ) : activeTab === TABS.CHARACTERS ? (
            <MasterCharacterManager />
          ) : activeTab === TABS.ITEMS ? (
            <ItemManager />
          ) : activeTab === TABS.FIGHT ? (
            <FightManager />
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
