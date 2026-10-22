import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotificationEvent } from '../context/NotificationsContext'
import api, { errorMessage } from '../services/api'
import { Button, Card } from '../components/common'

function getFightStateLabel(status) {
  if (status === 'started') return 'Luta iniciada'
  if (status === 'waiting') return 'Aguardando o mestre'
  return 'Sessão ativa'
}

const EMPTY_RESPONSES = { accepted: [], declined: [], pending: [] }

function applyInviteResponse(prev, userId, accept) {
  const without = (list) => (list || []).filter((entry) => entry !== userId)
  return {
    accepted: accept ? [...without(prev.accepted), userId] : without(prev.accepted),
    declined: accept ? without(prev.declined) : [...without(prev.declined), userId],
    pending: without(prev.pending),
  }
}

export default function PlayerFightRoomPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  const { user, logout } = useAuth()
  const fightId = Number(params.fightId)
  const fightName = location.state?.fightName || `#${fightId}`

  const [fightStatus, setFightStatus] = useState(location.state?.started ? 'started' : 'waiting')
  const [fightData, setFightData] = useState(null)
  const [inviteResponses, setInviteResponses] = useState(EMPTY_RESPONSES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastEvent, setLastEvent] = useState(null)
  const [currentTurnUserId, setCurrentTurnUserId] = useState(null)
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [sentReady, setSentReady] = useState(false)

  const loadFightData = useCallback(async () => {
    if (!fightId) return
    try {
      setLoading(true)
      const [fightResponse, responsesResponse, turnResponse] = await Promise.all([
        api.get(`/api/fights/${fightId}`),
        api.get(`/api/fights/${fightId}/responses`),
        api.get(`/api/fights/${fightId}/turn/me`),
      ])
      setFightData(fightResponse.data || null)
      setInviteResponses(responsesResponse.data || EMPTY_RESPONSES)
      setCurrentTurnUserId(turnResponse.data?.current_user_id || null)
      setIsMyTurn(Boolean(turnResponse.data?.is_my_turn))
      if ((fightResponse.data?.status || '').toLowerCase() === 'in_progress') setFightStatus('started')
      setError(null)
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível carregar os dados da luta.'))
    } finally {
      setLoading(false)
    }
  }, [fightId])

  useEffect(() => {
    loadFightData()
  }, [loadFightData])

  const isThisFight = (notification) => Number(notification?.data?.fight_id) === fightId

  useNotificationEvent(['fight_started', 'fight_invite_response', 'fight_invite_results'], (notification) => {
    if (!isThisFight(notification)) return
    setLastEvent(notification)
    if (notification.type === 'fight_started') setFightStatus('started')
    if (notification.type === 'fight_invite_response') {
      const { user_id: userId, accept } = notification.data || {}
      setInviteResponses((prev) => applyInviteResponse(prev, userId, accept))
    }
    if (notification.type === 'fight_invite_results') {
      setInviteResponses({
        accepted: notification.data?.accepted || [],
        declined: notification.data?.declined || [],
        pending: [],
      })
    }
  })

  useNotificationEvent('turn_changed', (notification) => {
    if (!isThisFight(notification)) return
    setCurrentTurnUserId(notification.data?.current_user_id || null)
    setIsMyTurn(notification.data?.current_user_id === user?.id)
  })

  useEffect(() => {
    if (fightStatus !== 'started') return undefined
    // Pequena pausa para o jogador ver que a luta começou antes de abrir a tela de combate.
    const timer = setTimeout(() => {
      navigate(`/player/fight/${fightId}/battle`, { replace: true, state: { fightId, fightName } })
    }, 700)
    return () => clearTimeout(timer)
  }, [fightStatus, fightId, navigate, fightName])

  const handleReturnToSession = () => navigate('/player', { replace: true })

  const sendReady = async () => {
    if (!fightId) return
    try {
      await api.post(`/api/fights/${fightId}/entries/player`, { action: 'ready' })
      setSentReady(true)
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível avisar que você está pronto.'))
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(255,122,24,0.12),transparent_24%),linear-gradient(180deg,rgba(3,7,18,0.98)_0%,rgba(7,12,25,0.96)_100%)]" />
      <div className="pointer-events-none absolute left-0 top-0 h-64 w-64 rounded-full bg-cyan-400/12 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full bg-orange-400/12 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="border border-white/10 bg-[#07111fec] p-6 shadow-[0_0_50px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.55em] text-cyan-200/75">Fight Room</p>
              <h1 className="text-3xl font-black uppercase tracking-[0.12em] text-white sm:text-5xl">{fightName}</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                Você já aceitou o convite. Esta sala mantém o personagem sincronizado enquanto o mestre prepara a luta.
              </p>
            </div>
            <span className={`border px-3 py-1 text-[11px] uppercase tracking-[0.3em] ${fightStatus === 'started' ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100' : 'border-orange-400/30 bg-orange-400/10 text-orange-100'}`}>
              {getFightStateLabel(fightStatus)}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              {loading ? (
                <div className="space-y-4">
                  <p className="text-lg font-semibold text-white">Carregando combate...</p>
                  <p className="text-sm leading-6 text-slate-300">Buscando dados da luta, resposta dos jogadores e status atual.</p>
                </div>
              ) : fightStatus === 'waiting' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 animate-pulse rounded-full bg-orange-300" />
                    <p className="text-lg font-semibold text-white">Aguardando início</p>
                  </div>
                  <p className="text-sm leading-6 text-slate-300">
                    O mestre já recebeu sua resposta. Assim que o combate começar, esta tela será atualizada automaticamente.
                  </p>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Fight ID: {fightId}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-lg font-semibold text-cyan-100">A luta começou.</p>
                  <p className="text-sm leading-6 text-slate-300">
                    O evento <span className="text-cyan-200">fight_started</span> chegou e a sala foi liberada para o fluxo de combate.
                  </p>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Pronto para continuar</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Sessão</p>
              <p className="mt-2 text-lg font-semibold text-white">{fightName}</p>
              <p className="mt-3 text-sm text-slate-300">Jogador: {user?.login}</p>
              <p className="mt-2 text-sm text-slate-300">Código da luta: #{fightId}</p>
                {currentTurnUserId !== null && (
                  <p className="mt-2 text-sm text-slate-300">Vez atual: {isMyTurn ? 'Você' : `Usuário #${currentTurnUserId}`}</p>
                )}
              {fightData?.status && <p className="mt-2 text-sm text-slate-300">Status backend: {fightData.status}</p>}
              {lastEvent && (
                <p className="mt-3 text-xs uppercase tracking-[0.3em] text-cyan-200">
                  Último evento: {lastEvent.type}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Aceitos</p>
              <p className="mt-2 text-2xl font-black text-cyan-100">{inviteResponses.accepted.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Pendentes</p>
              <p className="mt-2 text-2xl font-black text-orange-100">{inviteResponses.pending.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Recusados</p>
              <p className="mt-2 text-2xl font-black text-red-100">{inviteResponses.declined.length}</p>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

            <div className="mt-6 flex flex-wrap gap-3">
            {!sentReady && fightStatus === 'waiting' && (
              <Button size="sm" onClick={sendReady}>Pronto</Button>
            )}
            {sentReady && (
              <div className="px-3 py-2 rounded border border-white/10 bg-white/5 text-sm text-slate-300">Pronto enviado</div>
            )}
            <Button size="sm" onClick={handleReturnToSession}>Voltar à sessão</Button>
            <Button size="sm" variant="ghost" onClick={logout}>Sair</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
