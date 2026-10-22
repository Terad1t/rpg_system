import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ErrorBoundary from './components/common/ErrorBoundary'
import LoadingScreen from './components/common/LoadingScreen'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationsProvider } from './context/NotificationsContext'
import LoginPage from './pages/LoginPage'

// Cada área carrega só quando é aberta (o painel do Master traz gráficos pesados).
const MasterDashboard = lazy(() => import('./pages/MasterDashboard'))
const PlayerCharacterSelectPage = lazy(() => import('./pages/PlayerCharacterSelectPage'))
const PlayerSessionPage = lazy(() => import('./pages/PlayerSessionPage'))
const PlayerFightRoomPage = lazy(() => import('./pages/PlayerFightRoomPage'))
const PlayerBattlePage = lazy(() => import('./pages/PlayerBattlePage'))

function homeFor(user) {
  return user?.role === 'master' ? '/master' : '/player/select'
}

function PrivateRoute({ children, requiredRole }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (requiredRole && user.role !== requiredRole) return <Navigate to={homeFor(user)} replace />
  return children
}

function PublicOnlyRoute({ children }) {
  const { user } = useAuth()
  return user ? <Navigate to={homeFor(user)} replace /> : children
}

const playerRoutes = [
  ['/player', PlayerSessionPage],
  ['/player/select', PlayerCharacterSelectPage],
  ['/player/fight/:fightId', PlayerFightRoomPage],
  ['/player/fight/:fightId/battle', PlayerBattlePage],
]

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        {playerRoutes.map(([path, Page]) => (
          <Route
            key={path}
            path={path}
            element={
              <PrivateRoute requiredRole="player">
                <Page />
              </PrivateRoute>
            }
          />
        ))}
        <Route
          path="/master"
          element={
            <PrivateRoute requiredRole="master">
              <MasterDashboard />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <NotificationsProvider>
            <AppRoutes />
          </NotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
