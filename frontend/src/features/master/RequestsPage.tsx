import { useState } from 'react'
import { Check, ScrollText, X } from 'lucide-react'
import { post } from '@/api/client'
import { keys, useAccounts, useAction, useClasses, useRaces, useRequests } from '@/api/queries'
import type { CharacterRequest, RequestStatus } from '@/api/types'
import { ATTRIBUTE_LABELS, formatDateTime } from '@/lib/format'
import { Badge } from '@/ui/Badge'
import { Button } from '@/ui/Button'
import { SelectField, TextField } from '@/ui/Field'
import { EmptyState, QueryBoundary } from '@/ui/feedback'
import { Modal } from '@/ui/Modal'
import { PageHeader, Panel } from '@/ui/Panel'

const ATTRIBUTES = ['vigor', 'agility', 'speed', 'charisma', 'intellect', 'presence', 'occultism'] as const
const INVESTIGATION = [
  { value: 'basic', label: 'Básica' },
  { value: 'intermediate', label: 'Intermediária' },
  { value: 'advanced', label: 'Avançada' },
  { value: 'forensic', label: 'Forense' },
]

type Approval = Record<(typeof ATTRIBUTES)[number], number> & { hp: number; investigation: string; subclass: string }

const DEFAULT_APPROVAL: Approval = {
  hp: 20,
  vigor: 10,
  agility: 10,
  speed: 10,
  charisma: 10,
  intellect: 10,
  presence: 10,
  occultism: 10,
  investigation: 'basic',
  subclass: '',
}

const STATUS: Record<RequestStatus, { label: string; tone: 'gold' | 'moss' | 'blood' }> = {
  pending: { label: 'Pendente', tone: 'gold' },
  approved: { label: 'Aprovada', tone: 'moss' },
  rejected: { label: 'Recusada', tone: 'blood' },
}

function ApproveDialog({ request, onClose }: { request: CharacterRequest; onClose: () => void }) {
  const [values, setValues] = useState<Approval>(DEFAULT_APPROVAL)
  const approve = useAction(() => post(`/api/characters/requests/${request.id}/approve`, { ...values, subclass: values.subclass.trim() || null }), {
    invalidate: [keys.requests, keys.masterCharacters, keys.overview],
    success: `${request.name} aprovado(a). O jogador já pode entrar com o personagem.`,
    failure: 'Não foi possível aprovar',
  })
  const setNumber = (field: keyof Approval) => (event: { target: { value: string } }) =>
    setValues((prev) => ({ ...prev, [field]: Math.max(0, Math.min(100, Number(event.target.value) || 0)) }))

  return (
    <Modal
      open
      onClose={onClose}
      title={`Aprovar ${request.name}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button icon={<Check className="h-4 w-4" />} loading={approve.isPending} onClick={() => approve.mutate(undefined, { onSuccess: onClose })}>
            Aprovar e criar personagem
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-parchment-muted">Defina os valores iniciais. O bônus da raça é somado automaticamente e o personagem recebe 10 pontos livres.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Vida máxima" type="number" min={1} value={values.hp} onChange={setNumber('hp')} />
        <TextField label="Subclasse" value={values.subclass} onChange={(e) => setValues((p) => ({ ...p, subclass: e.target.value }))} />
        {ATTRIBUTES.map((attribute) => (
          <TextField
            key={attribute}
            label={ATTRIBUTE_LABELS[attribute] ?? attribute}
            type="number"
            min={0}
            max={100}
            value={values[attribute]}
            onChange={setNumber(attribute)}
          />
        ))}
        <SelectField
          label="Investigação"
          options={INVESTIGATION}
          placeholder={null}
          value={values.investigation}
          onChange={(e) => setValues((p) => ({ ...p, investigation: e.target.value }))}
        />
      </div>
    </Modal>
  )
}

function RequestCard({ request, onApprove }: { request: CharacterRequest; onApprove: () => void }) {
  const races = useRaces()
  const classes = useClasses()
  const accounts = useAccounts()
  const reject = useAction(() => post(`/api/characters/requests/${request.id}/reject`), {
    invalidate: [keys.requests, keys.overview],
    success: 'Solicitação recusada. O jogador foi avisado.',
  })
  const race = races.data?.find((r) => r.id === request.raca_id)?.name ?? '?'
  const characterClass = classes.data?.find((c) => c.id === request.classe_id)?.name ?? '?'
  const player = accounts.data?.find((a) => a.id === request.user_id)?.login ?? `#${request.user_id}`

  return (
    <li className="rounded-lg border border-line bg-surface-raised/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex flex-wrap items-center gap-2 font-display text-lg font-bold text-parchment">
            {request.name}
            {request.codename && <span className="font-sans text-sm font-normal text-gold">“{request.codename}”</span>}
          </p>
          <p className="text-sm text-parchment-muted">
            {race} · {characterClass}
            {request.age !== null && ` · ${request.age} anos`}
            {request.height !== null && ` · ${request.height} m`}
          </p>
          <p className="mt-1 text-xs text-parchment-faint">
            Pedido por <span className="text-parchment-muted">{player}</span> em {formatDateTime(request.created_at)}
          </p>
        </div>
        <Badge tone={STATUS[request.status].tone}>{STATUS[request.status].label}</Badge>
      </div>
      {request.description && <p className="mt-3 whitespace-pre-line text-sm text-parchment-muted">{request.description}</p>}
      {request.status === 'pending' && (
        <div className="mt-4 flex gap-2">
          <Button size="sm" icon={<Check className="h-4 w-4" />} onClick={onApprove}>
            Aprovar
          </Button>
          <Button size="sm" variant="danger" icon={<X className="h-4 w-4" />} loading={reject.isPending} onClick={() => reject.mutate()}>
            Recusar
          </Button>
        </div>
      )}
    </li>
  )
}

export function RequestsPage() {
  const requests = useRequests()
  const [approving, setApproving] = useState<CharacterRequest | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  return (
    <>
      <PageHeader title="Solicitações de personagem" subtitle="Jogadores pedem personagens (até 3 por pessoa). Pendentes vencem em 2 dias." />
      <QueryBoundary query={requests}>
        {(list) => {
          const pending = list.filter((r) => r.status === 'pending')
          const done = list.filter((r) => r.status !== 'pending').reverse()
          return (
            <div className="space-y-6">
              <Panel title={`Aguardando você (${pending.length})`}>
                {pending.length === 0 ? (
                  <EmptyState title="Nenhuma solicitação pendente" icon={<ScrollText className="h-6 w-6" />}>
                    Quando um jogador pedir um personagem, ele aparece aqui e você recebe uma notificação.
                  </EmptyState>
                ) : (
                  <ul className="grid gap-4 lg:grid-cols-2">
                    {pending.map((request) => (
                      <RequestCard key={request.id} request={request} onApprove={() => setApproving(request)} />
                    ))}
                  </ul>
                )}
              </Panel>

              {done.length > 0 && (
                <Panel
                  title={`Histórico (${done.length})`}
                  actions={
                    <Button size="sm" variant="ghost" onClick={() => setShowHistory((v) => !v)} aria-expanded={showHistory}>
                      {showHistory ? 'Ocultar' : 'Mostrar'}
                    </Button>
                  }
                >
                  {showHistory ? (
                    <ul className="grid gap-4 lg:grid-cols-2">
                      {done.map((request) => (
                        <RequestCard key={request.id} request={request} onApprove={() => undefined} />
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-parchment-faint">Solicitações já aprovadas ou recusadas.</p>
                  )}
                </Panel>
              )}
            </div>
          )
        }}
      </QueryBoundary>
      {approving && <ApproveDialog request={approving} onClose={() => setApproving(null)} />}
    </>
  )
}
