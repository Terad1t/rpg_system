import { Link } from 'react-router-dom'
import { ChevronRight, MapPin } from 'lucide-react'
import { useMyRequests, usePlayerPanel } from '@/api/queries'
import type { PanelCharacter } from '@/api/types'
import { useCurrentUser } from '@/auth/AuthProvider'
import { formatDateTime } from '@/lib/format'
import { selectedCharacterKey, writePreference } from '@/lib/session'
import { Badge } from '@/ui/Badge'
import { QueryBoundary } from '@/ui/feedback'
import { PageHeader, Panel } from '@/ui/Panel'
import { StatBar } from '@/ui/StatBar'
import { Avatar } from '@/ui/misc'
import { RequestCharacterForm } from './RequestCharacterForm'

const MAX_CHARACTERS = 3

function CharacterCard({ character, userId }: { character: PanelCharacter; userId: number }) {
  return (
    <Link
      to={`/jogador/personagem/${character.id}`}
      onClick={() => writePreference(selectedCharacterKey(userId), String(character.id))}
      className="group flex flex-col rounded-lg border border-line bg-surface/90 p-5 shadow-rune transition-colors hover:border-gold"
    >
      <div className="flex items-center gap-4">
        <Avatar src={character.portrait || character.race.image} name={character.codename || character.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-bold text-parchment">{character.codename || character.name}</h3>
          <p className="truncate text-sm text-parchment-muted">
            {character.race.name ?? '?'} · {character.class}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-parchment-faint transition-transform group-hover:translate-x-1 group-hover:text-gold" aria-hidden />
      </div>
      <div className="mt-5 space-y-3">
        <StatBar kind="hp" current={character.hp} max={character.maxHp} compact />
        <StatBar kind="mana" current={character.mana} max={character.maxMana} compact />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-parchment-muted">
        <MapPin className="h-3.5 w-3.5" aria-hidden />
        {character.current_map?.name ?? 'Local desconhecido'}
        {character.freePoints > 0 && <Badge tone="gold">{character.freePoints} pontos livres</Badge>}
      </div>
    </Link>
  )
}

function MyRequests() {
  const requests = useMyRequests()
  const pending = (requests.data ?? []).filter((r) => r.status !== 'approved').slice(-5).reverse()
  if (pending.length === 0) return null
  return (
    <Panel title="Seus pedidos">
      <ul className="divide-y divide-line">
        {pending.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="text-parchment">{r.name}</span>
            <span className="flex items-center gap-2 text-xs text-parchment-faint">
              {formatDateTime(r.created_at)}
              <Badge tone={r.status === 'pending' ? 'amber' : 'blood'}>{r.status === 'pending' ? 'aguardando o mestre' : 'recusado'}</Badge>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export function CharacterSelectPage() {
  const user = useCurrentUser()
  const panel = usePlayerPanel()

  return (
    <>
      <PageHeader title={`Bem-vindo, ${user.login}`} subtitle="Escolha com quem você vai jogar hoje." />
      <QueryBoundary query={panel} label="Carregando seus personagens...">
        {({ characters }) => (
          <div className="space-y-8">
            {characters.length > 0 && (
              <section aria-label="Seus personagens" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {characters.map((character) => (
                  <CharacterCard key={character.id} character={character} userId={user.id} />
                ))}
              </section>
            )}
            {characters.length === 0 && (
              <p className="rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-parchment">
                Você ainda não tem personagens. Peça o primeiro abaixo; quando o mestre aprovar, ele aparece aqui.
              </p>
            )}
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
              {characters.length < MAX_CHARACTERS ? (
                <RequestCharacterForm />
              ) : (
                <Panel title="Limite atingido">
                  <p className="text-sm text-parchment-muted">Cada jogador pode ter até {MAX_CHARACTERS} personagens ativos.</p>
                </Panel>
              )}
              <MyRequests />
            </div>
          </div>
        )}
      </QueryBoundary>
    </>
  )
}
