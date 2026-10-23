import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { CheckCircle2, Clock, Hourglass, XCircle } from 'lucide-react'
import { useFight, useFightResponses } from '@/api/queries'
import { useCurrentUser } from '@/auth/AuthProvider'
import { Spinner } from '@/ui/feedback'
import { Panel } from '@/ui/Panel'

/** Sala de espera depois de aceitar o convite; a luta abre sozinha quando o mestre inicia. */
export function FightLobbyPage() {
  const { fightId } = useParams()
  const id = Number(fightId)
  const location = useLocation()
  const me = useCurrentUser()
  const fight = useFight(id)
  const responses = useFightResponses(id)
  const name = fight.data?.name ?? (location.state as { name?: string } | null)?.name ?? `Luta #${id}`

  if (fight.data?.status === 'in_progress') return <Navigate to={`/jogador/luta/${id}/combate`} replace />

  const counts = responses.data
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Panel>
        <div className="text-center">
          <Hourglass className="mx-auto h-10 w-10 animate-pulse text-gold" aria-hidden />
          <p className="eyebrow mt-4">Sala de espera</p>
          <h1 className="mt-1 text-3xl font-bold text-parchment">{name}</h1>
          <p className="mt-2 text-sm text-parchment-muted">Você aceitou o convite. Assim que o mestre iniciar, a tela de combate abre sozinha.</p>
          <Spinner label="Aguardando o mestre..." className="mt-4 justify-center" />
        </div>
      </Panel>
      {counts && (
        <Panel title="Quem já respondeu">
          <ul className="grid grid-cols-3 gap-3 text-center text-sm">
            <li className="rounded-md border border-line p-3">
              <CheckCircle2 className="mx-auto h-5 w-5 text-moss" aria-hidden />
              <p className="mt-1 font-display text-2xl font-bold text-parchment">{counts.accepted.length}</p>
              <p className="text-xs text-parchment-muted">aceitaram{counts.accepted.includes(me.id) && ' (você)'}</p>
            </li>
            <li className="rounded-md border border-line p-3">
              <Clock className="mx-auto h-5 w-5 text-amber" aria-hidden />
              <p className="mt-1 font-display text-2xl font-bold text-parchment">{counts.pending.length}</p>
              <p className="text-xs text-parchment-muted">pensando</p>
            </li>
            <li className="rounded-md border border-line p-3">
              <XCircle className="mx-auto h-5 w-5 text-blood" aria-hidden />
              <p className="mt-1 font-display text-2xl font-bold text-parchment">{counts.declined.length}</p>
              <p className="text-xs text-parchment-muted">recusaram</p>
            </li>
          </ul>
        </Panel>
      )}
      <p className="text-center">
        <Link to="/jogador" className="text-sm text-parchment-muted hover:text-gold">
          Voltar aos personagens
        </Link>
      </p>
    </div>
  )
}
