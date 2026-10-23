import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Swords } from 'lucide-react'
import { post } from '@/api/client'
import { keys, useAction } from '@/api/queries'
import { useNotificationEvent } from '@/realtime/NotificationsProvider'
import { Button } from '@/ui/Button'
import { Modal } from '@/ui/Modal'

interface Invite {
  fight_id: number
  name?: string
  expires_in?: number
  receivedAt: number
}

/** Convites de luta e início de luta, em qualquer tela do jogador. */
export function FightInviteDialog() {
  const navigate = useNavigate()
  const [invite, setInvite] = useState<Invite | null>(null)
  const [now, setNow] = useState(Date.now())

  useNotificationEvent<{ fight_id: number; name?: string; expires_in?: number }>('fight_invite', (message) => {
    const receivedAt = Date.now()
    setNow(receivedAt) // sem isso a contagem começaria do horário em que a tela abriu
    setInvite({ ...message.data, receivedAt })
  })
  useNotificationEvent<{ fight_id: number; name?: string }>('fight_started', (message) => {
    const fightId = Number(message.data.fight_id)
    if (fightId) navigate(`/jogador/luta/${fightId}/combate`, { state: { name: message.data.name } })
  })

  useEffect(() => {
    if (!invite) return undefined
    const timer = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(timer)
  }, [invite])

  const secondsLeft = invite ? Math.max(0, Math.ceil((invite.receivedAt + (invite.expires_in ?? 20) * 1000 - now) / 1000)) : 0

  useEffect(() => {
    if (invite && secondsLeft === 0) setInvite(null)
  }, [invite, secondsLeft])

  const respond = useAction((accept: boolean) => post(`/api/fights/${invite?.fight_id}/respond`, { accept }), {
    invalidate: invite ? [keys.fightResponses(invite.fight_id)] : [],
    failure: 'Não foi possível responder',
  })

  const answer = (accept: boolean) => {
    if (!invite) return
    const { fight_id: fightId, name } = invite
    respond.mutate(accept, {
      onSuccess: () => {
        setInvite(null)
        if (accept) navigate(`/jogador/luta/${fightId}`, { state: { name } })
      },
    })
  }

  return (
    <Modal
      open={Boolean(invite)}
      onClose={() => answer(false)}
      title="Convite para luta"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => answer(false)} disabled={respond.isPending}>
            Recusar
          </Button>
          <Button icon={<Swords className="h-4 w-4" />} onClick={() => answer(true)} loading={respond.isPending}>
            Aceitar
          </Button>
        </>
      }
    >
      <p className="text-parchment">
        O mestre chamou você para <span className="font-display font-bold text-gold-bright">{invite?.name ?? `a luta #${invite?.fight_id}`}</span>.
      </p>
      <p className="mt-2 text-sm text-parchment-muted" aria-live="polite">
        Responda em <span className="tabular-nums text-parchment">{secondsLeft}s</span>.
      </p>
    </Modal>
  )
}
