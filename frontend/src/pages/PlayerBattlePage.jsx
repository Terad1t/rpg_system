import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUserNotificationsWebSocket } from '../hooks/useUserNotificationsWebSocket'
import { Card, Button } from '../components/common'
import api from '../services/api'

export default function PlayerBattlePage() {
  const { user, logout } = useAuth()
  const { notifications } = useUserNotificationsWebSocket(user?.id)
  const params = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const fightId = Number(params.fightId)
  const fightName = location.state?.fightName || `#${fightId}`

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const relevantEntries = useMemo(() => {
    return entries.filter((e) => Number(e.fight_id) === fightId)
  }, [entries, fightId])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/api/fights/${fightId}`)
        setEntries(res.data?.entries || [])
        setError(null)
      } catch (err) {
        setError(err.response?.data?.detail || 'Falha ao carregar entradas de combate')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [fightId])

  useEffect(() => {
    if (!notifications || notifications.length === 0) return
    const newOnes = notifications.filter((n) => n?.type === 'fight_event' && Number(n?.data?.fight_id) === fightId)
    if (newOnes.length === 0) return
    setEntries((prev) => [...prev, ...newOnes.map((n) => n.data?.entry).filter(Boolean)])
  }, [notifications, fightId])

  const handleBack = () => navigate('/player', { replace: true })

  const sendTestAttack = async () => {
    try {
      // simple test attack with random small damage
      const damage = Math.floor(Math.random() * 6) + 1
      await api.post(`/api/fights/${fightId}/entries/player`, { actor_type: 'player', actor_name: user?.login, action: 'attack', value: damage, damage })
    } catch (err) {
      console.error('Falha ao enviar ataque de teste', err)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="border border-white/10 bg-[#07111fec] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.55em] text-cyan-200/75">Battle</p>
              <h1 className="text-3xl font-black uppercase tracking-[0.12em] text-white">{fightName}</h1>
              <p className="text-sm text-slate-300">Entradas de combate em tempo real</p>
            </div>
            <div className="flex gap-2">
                  <Button size="sm" onClick={handleBack}>Voltar</Button>
              <Button size="sm" variant="ghost" onClick={logout}>Sair</Button>
            </div>
          </div>

          <div className="mt-4">
            <Button size="sm" onClick={sendTestAttack}>Enviar ataque (teste)</Button>
          </div>

          <div className="mt-6">
            {loading ? (
              <p className="text-sm text-slate-300">Carregando...</p>
            ) : error ? (
              <p className="text-sm text-red-300">{error}</p>
            ) : (
              <div className="space-y-3">
                {relevantEntries.length === 0 && <p className="text-sm text-slate-300">Nenhuma ação registrada ainda.</p>}
                {relevantEntries.map((entry, idx) => (
                  <div key={idx} className="rounded border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{entry.actor_name} ({entry.actor_type})</p>
                        <p className="text-xs text-slate-300">Ação: {entry.action || entry.action}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-cyan-200">Dano: {entry.value ?? entry.damage ?? 0}</p>
                        <p className="text-xs text-slate-400">ID: {entry.id || '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
