import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUserNotificationsWebSocket } from '../hooks/useUserNotificationsWebSocket'
import { Button, Card } from '../components/common'
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
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [selectedAction, setSelectedAction] = useState('attack')
  const [actionValue, setActionValue] = useState(1)

  const relevantEntries = useMemo(() => {
    return entries.filter((entry) => Number(entry.fight_id) === fightId)
  }, [entries, fightId])

  const loadBattle = async () => {
    try {
      setLoading(true)
      const [fightResponse, turnResponse] = await Promise.all([
        api.get(`/api/fights/${fightId}`),
        api.get(`/api/fights/${fightId}/turn/me`),
      ])
      setEntries(fightResponse.data?.entries || [])
      setIsMyTurn(Boolean(turnResponse.data?.is_my_turn))
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Falha ao carregar entradas de combate')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBattle()
  }, [fightId])

  useEffect(() => {
    if (!notifications || notifications.length === 0) return

    const latest = notifications[notifications.length - 1]
    if (latest?.type === 'fight_event' && Number(latest?.data?.fight_id) === fightId) {
      const nextEntry = latest.data?.entry
      if (nextEntry) {
        setEntries((prev) => [...prev, nextEntry])
      }
    }

    if (latest?.type === 'turn_changed' && Number(latest?.data?.fight_id) === fightId) {
      setIsMyTurn(Boolean(latest.data?.current_user_id === user?.id))
    }
  }, [notifications, fightId, user])

  const handleBack = () => navigate('/player', { replace: true })

  const sendTestAttack = async () => {
    try {
      const payload = {
        actor_type: 'player',
        actor_name: user?.login,
        action: selectedAction,
        value: Number(actionValue),
      }

      if (selectedAction === 'attack') payload.damage = Number(actionValue)
      if (selectedAction === 'heal') payload.healing = Number(actionValue)

      await api.post(`/api/fights/${fightId}/entries/player`, payload)
    } catch (err) {
      console.error('Falha ao enviar ação de combate', err)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="border border-white/10 bg-[#07111fec] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.55em] text-cyan-200/75">Battle</p>
              <h1 className="text-3xl font-black uppercase tracking-[0.12em] text-white">{fightName}</h1>
              <p className="text-sm text-slate-300">Entradas de combate em tempo real</p>
              <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                {isMyTurn ? 'Sua vez de agir' : 'Aguardando sua vez'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleBack}>Voltar</Button>
              <Button size="sm" variant="ghost" onClick={logout}>Sair</Button>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                className="rounded px-3 py-2 bg-[#0c1528]"
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                disabled={!isMyTurn}
              >
                <option value="attack">Ataque</option>
                <option value="heal">Cura</option>
                <option value="defend">Defesa</option>
                <option value="skill">Habilidade</option>
              </select>
              <input
                type="number"
                min="0"
                className="w-24 rounded px-3 py-2 bg-[#0c1528]"
                value={actionValue}
                onChange={(e) => setActionValue(e.target.value)}
                disabled={!isMyTurn}
              />
              <Button size="sm" onClick={sendTestAttack} disabled={!isMyTurn}>Enviar</Button>
            </div>
            {!isMyTurn && <p className="mt-2 text-sm text-slate-400">Você só pode agir quando a vez estiver com seu personagem.</p>}
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
                  <div key={entry.id || idx} className="rounded border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{entry.actor_name} ({entry.actor_type})</p>
                        <p className="text-xs text-slate-300">Ação: {entry.action || '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-cyan-200">Valor: {entry.value ?? 0}</p>
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
