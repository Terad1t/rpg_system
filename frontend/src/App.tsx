import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { Role } from '@/api/types'
import { useAuth } from '@/auth/AuthProvider'
import { MasterLayout } from '@/layout/MasterLayout'
import { PlayerLayout } from '@/layout/PlayerLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { FullScreenLoader } from '@/ui/feedback'

// Cada tela carrega quando é aberta.
const page = <T extends Record<string, unknown>>(load: () => Promise<T>, name: keyof T) =>
  lazy(async () => ({ default: (await load())[name] as React.ComponentType }))

const Dashboard = page(() => import('@/features/master/DashboardPage'), 'DashboardPage')
const Characters = page(() => import('@/features/master/CharactersPage'), 'CharactersPage')
const Requests = page(() => import('@/features/master/RequestsPage'), 'RequestsPage')
const Fights = page(() => import('@/features/master/FightsPage'), 'FightsPage')
const World = page(() => import('@/features/master/WorldPage'), 'WorldPage')
const Items = page(() => import('@/features/master/ItemsPage'), 'ItemsPage')
const Skills = page(() => import('@/features/master/SkillsPage'), 'SkillsPage')
const Effects = page(() => import('@/features/master/EffectsPage'), 'EffectsPage')
const Races = page(() => import('@/features/master/CatalogPages'), 'RacesPage')
const Classes = page(() => import('@/features/master/CatalogPages'), 'ClassesPage')
const Accounts = page(() => import('@/features/master/AccountsPage'), 'AccountsPage')

const CharacterSelect = page(() => import('@/features/player/CharacterSelectPage'), 'CharacterSelectPage')
const Session = page(() => import('@/features/player/SessionPage'), 'SessionPage')
const FightLobby = page(() => import('@/features/player/FightLobbyPage'), 'FightLobbyPage')
const Battle = page(() => import('@/features/player/BattlePage'), 'BattlePage')

export function homeFor(role: Role) {
  return role === 'master' ? '/mestre' : '/jogador'
}

function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/entrar" replace />
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />
  return <>{children}</>
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return user ? <Navigate to={homeFor(user.role)} replace /> : <>{children}</>
}

export function AppRoutes() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route path="/entrar" element={<PublicOnly><LoginPage /></PublicOnly>} />

        <Route path="/mestre" element={<RequireRole role="master"><MasterLayout /></RequireRole>}>
          <Route index element={<Dashboard />} />
          <Route path="personagens" element={<Characters />} />
          <Route path="solicitacoes" element={<Requests />} />
          <Route path="lutas" element={<Fights />} />
          <Route path="mundo" element={<World />} />
          <Route path="itens" element={<Items />} />
          <Route path="habilidades" element={<Skills />} />
          <Route path="efeitos" element={<Effects />} />
          <Route path="racas" element={<Races />} />
          <Route path="classes" element={<Classes />} />
          <Route path="contas" element={<Accounts />} />
        </Route>

        <Route path="/jogador" element={<RequireRole role="player"><PlayerLayout /></RequireRole>}>
          <Route index element={<CharacterSelect />} />
          <Route path="personagem/:characterId" element={<Session />} />
          <Route path="luta/:fightId" element={<FightLobby />} />
          <Route path="luta/:fightId/combate" element={<Battle />} />
        </Route>

        <Route path="*" element={<Navigate to="/entrar" replace />} />
      </Routes>
    </Suspense>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
