import { useState } from 'react'

const PLAYER_TABS = [
  { id: 'character', label: '👤 Personagem', icon: '👤' },
  { id: 'inventory', label: '🎒 Inventário', icon: '🎒' },
  { id: 'skills', label: '⚔️ Habilidades', icon: '⚔️' },
  { id: 'chat', label: '💬 Chat', icon: '💬' },
]

const MASTER_TABS = [
  { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
  { id: 'players', label: '👥 Jogadores', icon: '👥' },
  { id: 'characters', label: '🧙 Personagens', icon: '🧙' },
  { id: 'items', label: '💎 Itens', icon: '💎' },
  { id: 'races', label: '🐉 Raças', icon: '🐉' },
  { id: 'classes', label: '⚡ Classes', icon: '⚡' },
  { id: 'skills', label: '✨ Habilidades', icon: '✨' },
  { id: 'map', label: '🗺️ Mapa', icon: '🗺️' },
]

export default function Sidebar({ activeTab, onTabChange, isMaster = false }) {
  const [isOpen, setIsOpen] = useState(true)
  const tabs = isMaster ? MASTER_TABS : PLAYER_TABS

  return (
    <>
      {/* Hamburger Button (mobile) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-6 left-6 z-20 lg:hidden text-orange-500 text-2xl"
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative w-64 h-screen bg-dark-secondary border-r border-dark-border
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          z-10
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-dark-border">
          <h2 className="text-2xl font-bold text-orange-500">RPG</h2>
          <p className="text-xs text-secondary mt-1">Sistema de RPG</p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id)
                setIsOpen(false) // Fecha sidebar em mobile ao clicar
              }}
              className={`
                w-full text-left px-4 py-3 rounded-lg transition-all duration-200
                flex items-center gap-3 font-medium
                ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white'
                    : 'text-secondary hover:text-white hover:bg-dark'
                }
              `}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-border">
          <p className="text-xs text-secondary text-center">
            v1.0.0
          </p>
        </div>
      </aside>

      {/* Overlay (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
