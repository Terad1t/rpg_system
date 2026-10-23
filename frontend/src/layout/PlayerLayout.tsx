import { Link, Outlet } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/auth/AuthProvider'
import { Brand } from './Brand'
import { NotificationBell } from './NotificationBell'
import { FightInviteDialog } from '@/features/player/FightInviteDialog'

export function PlayerLayout() {
  const { user, logout } = useAuth()
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/jogador" aria-label="Início">
            <Brand subtitle="Mesa do jogador" />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <span className="hidden text-sm text-parchment-muted sm:inline">{user?.login}</span>
            <button type="button" onClick={logout} className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-parchment-muted hover:bg-surface-raised hover:text-parchment">
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 animate-fade-in px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>
      <FightInviteDialog />
    </div>
  )
}
