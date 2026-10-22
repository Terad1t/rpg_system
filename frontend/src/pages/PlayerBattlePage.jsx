import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotificationEvent } from '../context/NotificationsContext'
import { Button, Card } from '../components/common'
import api, { errorMessage } from '../services/api'

function appendEntry(entries, entry) {
  if (!entry || (entry.id && entries.some((existing) => existing.id === entry.id))) return entries
  return [...entries, entry]
}

export default function PlayerBattlePage() {
  const { user, logout } = useAuth()
  const params = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const fightId = Number(params.fightId)
  const fightName = location.state?.fightName || `#${fightId}`

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [sending, setSending] = useState(false)
  const [selectedAction, setSelectedAction] = useState('attack')
  const [actionValue, setActionValue] = useState(1)
  // Todas as entradas carregadas aqui são desta luta (o filtro antigo descartava as que chegavam ao vivo).
  const relevantEntries = entries

  const loadBattle = useCallback(async () => {
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
      setError(errorMessage(err, 'Falha ao carregar o combate.'))
    } finally {
      setLoading(false)
    }
  }, [fightId])

  useEffect(() => {
    loadBattle()
  }, [loadBattle])

  useNotificationEvent('fight_event', (notification) => {
    if (Number(notification.data?.fight_id) !== fightId) return
    setEntries((prev) => appendEntry(prev, notification.data?.entry))
  })

  useNotificationEvent('turn_changed', (notification) => {
    if (Number(notification.data?.fight_id) !== fightId) return
    setIsMyTurn(notification.data?.current_user_id === user?.id)
  })

  const handleBack = () => navigate('/player', { replace: true })

  const sendTestAttack = async () => {
    setSending(true)
    try {
      await api.post(`/api/fights/${fightId}/entries/player`, {
        action: selectedAction,
        value: Math.max(0, Number(actionValue) || 0),
      })
      setError(null)
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível enviar a ação.'))
    } finally {
      setSending(false)
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
                aria-label="Ação"
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
                aria-label="Valor"
                type="number"
                min="0"
                max="100000"
                className="w-24 rounded px-3 py-2 bg-[#0c1528]"
                value={actionValue}
                onChange={(e) => setActionValue(e.target.value)}
                disabled={!isMyTurn}
              />
              <Button size="sm" onClick={sendTestAttack} disabled={!isMyTurn || sending}>
                {sending ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
            {!isMyTurn && <p className="mt-2 text-sm text-slate-400">Você só pode agir quando a vez estiver com seu personagem.</p>}
          </div>

          {error && (
            <p className="mt-4 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
              {error}
            </p>
          )}

          <div className="mt-6">
            {loading ? (
              <p className="text-sm text-slate-300">Carregando...</p>
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
