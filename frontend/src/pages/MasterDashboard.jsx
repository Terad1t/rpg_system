import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNotificationEvent, useNotifications } from '../context/NotificationsContext'
import { Button, NotificationCenter } from '../components/common'
import Sidebar from '../components/common/Sidebar'
import ItemManager from './ItemManager'
import CharacterRequests from './CharacterRequests'
import MasterCharacterManager from './MasterCharacterManager'
import RaceManager from './RaceManager'
import ClassManager from './ClassManager'
import FightManager from './FightManager'
import MasterBuffManager from './MasterBuffManager'
import SkillManager from './SkillManager'
import UserManager from './UserManager'
import api, { errorMessage } from '../services/api'
import StatsGrid from '../components/dashboard/StatsGrid'
import FightStatsPanel from '../components/dashboard/FightStatsPanel'
import { getMasterBadges, setMasterBadges } from '../utils/badges'

function DashboardHome() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([api.get('/api/master/overview/'), api.get('/api/fights/stats')])
      .then(([overview, stats]) => active && setData({ overview: overview.data, stats: stats.data }))
      .catch((err) => active && setError(errorMessage(err, 'Não foi possível carregar as estatísticas.')))
    return () => {
      active = false
    }
  }, [])

  if (error) {
    return (
      <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200" role="alert">
        {error}
      </p>
    )
  }
  if (!data) return <p className="text-sm text-slate-400">Carregando estatísticas...</p>

  return (
    <>
      <StatsGrid overview={data.overview} stats={data.stats} />
      <div className="mt-6">
        <FightStatsPanel stats={data.stats} />
      </div>
    </>
  )
}

const SECTIONS = {
  dashboard: DashboardHome,
  players: UserManager,
  characters: MasterCharacterManager,
  requests: CharacterRequests,
  items: ItemManager,
  fight: FightManager,
  races: RaceManager,
  classes: ClassManager,
  skills: SkillManager,
  buffs: MasterBuffManager,
}

export default function MasterDashboard() {
  const { logout } = useAuth()
  const { isConnected, notifications, clearNotifications } = useNotifications()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [badges, setBadges] = useState(() => getMasterBadges())

  useEffect(() => {
    const handler = (event) => setBadges(event.detail || {})
    window.addEventListener('master-badges-updated', handler)
    return () => window.removeEventListener('master-badges-updated', handler)
  }, [])

  useNotificationEvent('character_request_created', () => {
    setMasterBadges({ ...getMasterBadges(), requests: (getMasterBadges().requests || 0) + 1 })
  })

  const changeTab = (tab) => {
    setActiveTab(tab)
    if (tab === 'requests') setMasterBadges({ ...getMasterBadges(), requests: 0 })
  }

  const Section = SECTIONS[activeTab] || DashboardHome

  return (
    <div className="flex h-screen bg-dark">
      <Sidebar activeTab={activeTab} onTabChange={changeTab} badges={badges} />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 border-b border-dark-border bg-dark-secondary p-6 pl-20 lg:pl-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-orange-500">Painel Master</h1>
              <p className="mt-1 text-secondary">Bem-vindo, Mestre</p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationCenter notifications={notifications} isConnected={isConnected} onClear={clearNotifications} />
              <Button variant="ghost" onClick={logout}>
                Sair
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          <Section />
        </div>
      </main>
    </div>
  )
}
