import { useState } from 'react'

import {
  IconBackpack,
  IconBolt,
  IconChart,
  IconChat,
  IconGem,
  IconMap,
  IconMenu,
  IconSword,
  IconTag,
  IconUser,
  IconUsers,
} from './Icons'

const PLAYER_TABS = [
  { id: 'overview', label: 'Painel', icon: <IconChart /> },
  { id: 'races', label: 'Raças', icon: <IconTag /> },
  { id: 'items', label: 'Itens', icon: <IconGem /> },
  { id: 'characters', label: 'Personagens', icon: <IconUsers /> },
  { id: 'map', label: 'Mapa', icon: <IconMap /> },
]

const MASTER_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: <IconChart /> },
  { id: 'players', label: 'Jogadores', icon: <IconUsers /> },
  { id: 'characters', label: 'Personagens', icon: <IconUser /> },
  { id: 'requests', label: 'Requisições', icon: <IconChat /> },
  { id: 'items', label: 'Itens', icon: <IconGem /> },
  { id: 'fight', label: 'Fight', icon: <IconSword /> },
  { id: 'races', label: 'Raças', icon: <IconTag /> },
  { id: 'classes', label: 'Classes', icon: <IconBolt /> },
  { id: 'skills', label: 'Habilidades', icon: <IconSword /> },
  { id: 'map', label: 'Mapa', icon: <IconMap /> },
  { id: 'buffs', label: 'Buffs/Debuffs', icon: <IconBolt /> },
]

export default function Sidebar({ activeTab, onTabChange, isMaster = false, badges = {} }) {
  const [isOpen, setIsOpen] = useState(false)
  const tabs = isMaster ? MASTER_TABS : PLAYER_TABS

  return (
    <>
      {/* Hamburger Button (mobile) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-5 left-5 z-30 rounded-full border border-cyan-400/30 bg-[#050b18]/80 p-3 text-cyan-200 shadow-lg backdrop-blur lg:hidden"
        aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
      >
        <IconMenu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative w-[17rem] sm:w-72 h-screen overflow-hidden border-r border-white/10
          bg-[#050b18]/95 backdrop-blur-xl shadow-[0_0_45px_rgba(0,0,0,0.35)]
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          z-20
        `}
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(56,189,248,0.12),transparent_42%,rgba(255,122,24,0.12))]" />
        <div className="relative p-6 border-b border-white/10">
          <p className="text-[11px] uppercase tracking-[0.45em] text-cyan-200/75">Player File</p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-[0.25em] text-white">RPG</h2>
          <p className="mt-2 text-[11px] uppercase tracking-[0.35em] text-slate-400">
            Tactical interface
          </p>
        </div>

        {/* Navigation */}
        <nav className="relative max-h-[calc(100vh-13rem)] overflow-y-auto p-4 space-y-3 pb-20">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id)
                setIsOpen(false) // Fecha sidebar em mobile ao clicar
              }}
              className={`
                group relative w-full overflow-hidden border px-4 py-3 text-left transition-all duration-200
                flex items-center gap-3 font-medium tracking-wide
                ${
                  activeTab === tab.id
                    ? 'border-cyan-400/60 bg-cyan-400/10 text-white shadow-[0_0_24px_rgba(56,189,248,0.18)]'
                    : 'border-white/5 bg-white/5 text-slate-300 hover:border-cyan-400/40 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <span
                className={`absolute left-0 top-0 h-full w-1 transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-b from-cyan-300 via-sky-500 to-orange-400'
                    : 'bg-transparent group-hover:bg-cyan-300/50'
                }`}
              />
              <span className="shrink-0">{tab.icon}</span>
              <span className="text-sm uppercase tracking-[0.25em]">{tab.label}</span>
              {badges?.[tab.id] > 0 && (
                <span className="ml-auto inline-flex items-center justify-center min-w-[28px] px-2 py-1 rounded-full bg-orange-500 text-white text-xs font-bold">
                  {badges[tab.id]}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[#050b18]/80 backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 text-center">
            v1.0.0 // player ops
          </p>
        </div>
      </aside>

      {/* Overlay (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 lg:hidden z-10 backdrop-blur-[1px]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
