import { useState, type ComponentType } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Gem,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Shield,
  Sparkles,
  Swords,
  UserCog,
  Users,
  Wand2,
  X,
} from 'lucide-react'
import { useOverview } from '@/api/queries'
import { useAuth } from '@/auth/AuthProvider'
import { cn } from '@/ui/cn'
import { Brand } from './Brand'
import { NotificationBell } from './NotificationBell'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  badge?: 'requests'
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Mesa',
    items: [
      { to: '/mestre', label: 'Visão geral', icon: LayoutDashboard },
      { to: '/mestre/personagens', label: 'Personagens', icon: Users },
      { to: '/mestre/solicitacoes', label: 'Solicitações', icon: ScrollText, badge: 'requests' },
      { to: '/mestre/lutas', label: 'Lutas', icon: Swords },
    ],
  },
  {
    section: 'Mundo',
    items: [
      { to: '/mestre/mundo', label: 'Mapa do mundo', icon: Globe2 },
      { to: '/mestre/itens', label: 'Itens', icon: Gem },
      { to: '/mestre/habilidades', label: 'Habilidades', icon: Wand2 },
      { to: '/mestre/efeitos', label: 'Buffs e debuffs', icon: Sparkles },
      { to: '/mestre/racas', label: 'Raças', icon: Shield },
      { to: '/mestre/classes', label: 'Classes', icon: BookOpen },
    ],
  },
  { section: 'Administração', items: [{ to: '/mestre/contas', label: 'Contas', icon: UserCog }] },
]

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const overview = useOverview()
  const pending = overview.data?.pending_requests ?? 0
  return (
    <nav aria-label="Menu do mestre" className="flex flex-col gap-6 px-3 py-5">
      {NAV.map((group) => (
        <div key={group.section}>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-parchment-faint">{group.section}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/mestre'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'bg-gold/15 text-gold-bright' : 'text-parchment-muted hover:bg-surface-raised hover:text-parchment',
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge === 'requests' && pending > 0 && (
                    <span className="rounded-full bg-gold px-1.5 text-[11px] font-bold text-ink" aria-label={`${pending} pendentes`}>
                      {pending}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export function MasterLayout() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface-sunken/80 lg:flex">
        <div className="border-b border-line px-5 py-5">
          <Brand subtitle="Painel do mestre" />
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar />
        </div>
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-ink/80" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto border-r border-line bg-surface-sunken">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Brand />
              <button type="button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} className="p-1 text-parchment-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-ink/85 px-4 py-3 backdrop-blur-sm sm:px-6">
          <button type="button" aria-label="Abrir menu" onClick={() => setMenuOpen(true)} className="rounded-md p-2 text-parchment-muted lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <span className="hidden text-sm text-parchment-muted sm:inline">{user?.login}</span>
            <button type="button" onClick={logout} className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-parchment-muted hover:bg-surface-raised hover:text-parchment">
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </header>
        <main key={location.pathname} className="mx-auto w-full max-w-7xl flex-1 animate-fade-in px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
