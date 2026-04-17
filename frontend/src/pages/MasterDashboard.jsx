import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button, NotificationCenter } from '../components/common'
import Sidebar from '../components/common/Sidebar'
import { useUserNotificationsWebSocket } from '../hooks/useUserNotificationsWebSocket'
import ItemManager from './ItemManager'
import CharacterRequests from './CharacterRequests'
import RaceManager from './RaceManager'
import ClassManager from './ClassManager'

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
          {activeTab === TABS.CHARACTERS ? (
            <CharacterRequests />
          ) : activeTab === TABS.ITEMS ? (
            <ItemManager />
          ) : activeTab === TABS.RACES ? (
            <RaceManager />
          ) : activeTab === TABS.CLASSES ? (
            <ClassManager />
          ) : (
            <p className="text-secondary">
              Seção {activeTab} em desenvolvimento...
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
