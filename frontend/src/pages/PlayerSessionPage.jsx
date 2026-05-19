import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUserNotificationsWebSocket } from '../hooks/useUserNotificationsWebSocket'
import api from '../services/api'
import { Button, Card, Modal } from '../components/common'
import PlayerCharacter from '../components/player/PlayerCharacter'
import PlayerInventory from '../components/player/PlayerInventory'
import PlayerChat from '../components/player/PlayerChat'

function getCharacterMapId(character) {
  return character?.current_map?.id ?? character?.current_map_id ?? null
}

function getCharacterMapName(character) {
  return character?.current_map?.name || character?.current_map?.title || 'Sem mapa'
}

function getCharacterPortrait(character) {
  return character?.portrait || character?.race?.image || character?.current_map?.image || null
}

function MapNode({ node, depth = 0, selectedMapId = null }) {
  const isSelected = selectedMapId && node.id === selectedMapId

  return (
    <div className="space-y-3">
      <div
        className={`border px-4 py-3 ${
          isSelected ? 'border-cyan-400/60 bg-cyan-400/10' : 'border-white/10 bg-white/5'
        }`}
        style={{ marginLeft: `${depth * 16}px` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">{node.map_type || 'mapa'}</p>
            <h4 className="mt-2 text-lg font-semibold text-white">{node.name}</h4>
            {node.description && <p className="mt-2 text-sm text-slate-300">{node.description}</p>}
          </div>
          {isSelected && (
            <span className="border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">
              Local atual
            </span>
          )}
        </div>
      </div>

      {Array.isArray(node.children) && node.children.length > 0 && (
        <div className="space-y-3">
          {node.children.map((child) => (
            <MapNode key={child.id} node={child} depth={depth + 1} selectedMapId={selectedMapId} />
          ))}
        </div>
      )}
    </div>
  )
}

function MapHierarchy({ worldMap = [], selectedMapId = null }) {
  if (!worldMap.length) {
    return (
      <Card title="Mapa" className="border border-white/10 bg-[#08111f]/90">
        <p className="text-sm text-slate-300">Nenhum mapa disponível para esta sessão.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {worldMap.map((region) => (
        <Card key={region.id} title={region.name} className="border border-white/10 bg-[#08111f]/90">
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Região</p>
                <p className="mt-2 text-lg font-semibold text-white">{region.description || 'Sem descrição.'}</p>
                <p className="mt-2 text-sm uppercase tracking-[0.35em] text-cyan-200">{region.climate || 'Sem clima definido'}</p>
              </div>
              <div className="border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Leitura rápida</p>
                <p className="mt-2 text-sm text-slate-300">A marcação em ciano destaca a posição atual do personagem.</p>
              </div>
            </div>

            {region.countries?.map((country) => (
              <div key={country.id} className="border border-white/10 bg-[#0c1528] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">País</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{country.name}</h3>
                    {country.description && <p className="mt-2 text-sm text-slate-300">{country.description}</p>}
                  </div>
                </div>

                {country.maps?.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {country.maps.map((mapNode) => (
                      <MapNode key={mapNode.id} node={mapNode} selectedMapId={selectedMapId} />
                    ))}
                  </div>
                )}

                {country.villages?.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {country.villages.map((village) => (
                      <div key={village.id} className="border border-white/10 bg-white/5 p-4">
                        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Vila / Cidade</p>
                        <h4 className="mt-2 text-lg font-semibold text-cyan-200">{village.name}</h4>
                        {village.description && <p className="mt-2 text-sm text-slate-300">{village.description}</p>}

                        {village.maps?.length > 0 && (
                          <div className="mt-4 space-y-3">
                            {village.maps.map((mapNode) => (
                              <MapNode key={mapNode.id} node={mapNode} depth={1} selectedMapId={selectedMapId} />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}

function SessionMetric({ label, value, accentClassName = 'text-white' }) {
  return (
    <div className="border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${accentClassName}`}>{value}</p>
    </div>
  )
}

export default function PlayerSessionPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { notifications } = useUserNotificationsWebSocket(user?.id)
  const [panelData, setPanelData] = useState({ characters: [], races: [], world_map: [] })
  const [selectedCharacterId, setSelectedCharacterId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectionResolved, setSelectionResolved] = useState(false)
  const [error, setError] = useState(null)
  const [inviteModal, setInviteModal] = useState(null)
  const selectionStorageKey = user?.id ? `player-dashboard:selected-character:${user.id}` : null

  const loadPanel = async () => {
    try {
      const response = await api.get('/api/player-panel/')
      const nextPanelData = response.data || { characters: [], races: [], world_map: [] }
      setPanelData(nextPanelData)

      const nextCharacters = (nextPanelData.characters || []).slice(0, 3)
      const storedCharacterId = selectionStorageKey ? Number(localStorage.getItem(selectionStorageKey)) : NaN

      if (storedCharacterId && nextCharacters.some((character) => character.id === storedCharacterId)) {
        setSelectedCharacterId(storedCharacterId)
      } else if (nextCharacters.length > 0) {
        setSelectedCharacterId(nextCharacters[0].id)
        if (selectionStorageKey) {
          localStorage.setItem(selectionStorageKey, String(nextCharacters[0].id))
        }
      } else {
        setSelectedCharacterId(null)
      }

      setError(null)
    } catch (err) {
      console.error('Erro ao carregar painel do jogador:', err)
      setError('Não foi possível carregar os dados da sessão.')
    } finally {
      setLoading(false)
      setSelectionResolved(true)
    }
  }

  useEffect(() => {
    loadPanel()
  }, [])

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1]
      if (latestNotification?.data?.action === 'created' && latestNotification?.data?.character_id) {
        loadPanel()
      }

      // handle fight invite
      if (latestNotification?.type === 'fight_invite') {
        setInviteModal(latestNotification.data || { fight_id: latestNotification?.data?.fight_id })
      }
    }
  }, [notifications])

  const respondToInvite = async (accept) => {
    if (!inviteModal) return
    try {
      await api.post(`/api/fights/${inviteModal.fight_id}/respond`, { user_id: user.id, accept })
    } catch (err) {
      console.error('Erro ao responder invite', err)
    } finally {
      setInviteModal(null)
    }
  }

  const visibleCharacters = useMemo(() => (panelData.characters || []).slice(0, 3), [panelData.characters])
  const selectedCharacter = visibleCharacters.find((character) => character.id === selectedCharacterId) || null

  const handleSelectCharacter = (characterId) => {
    setSelectedCharacterId(characterId)
    if (selectionStorageKey) {
      localStorage.setItem(selectionStorageKey, String(characterId))
    }
  }

  const handleReturnToSelection = () => {
    navigate('/player/select')
  }

  if (loading || !selectionResolved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-cyan-300" />
          <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Carregando sessão...</p>
        </div>
      </div>
    )
  }

  if (!selectedCharacter) {
    return <Navigate to="/player/select" replace />
  }

  const selectedMapId = getCharacterMapId(selectedCharacter)
  const selectedMapName = getCharacterMapName(selectedCharacter)
  const portrait = getCharacterPortrait(selectedCharacter)
  const worldMap = panelData.world_map || []
  const inventoryCount = (selectedCharacter.inventory || []).reduce((sum, entry) => sum + (entry.quantidade || 0), 0)
  const characterLabel = selectedCharacter.codename || selectedCharacter.name || 'Sem personagem'
  const raceName = typeof selectedCharacter.race === 'string' ? selectedCharacter.race : selectedCharacter.race?.name

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(255,122,24,0.12),transparent_24%),linear-gradient(180deg,rgba(3,7,18,0.98)_0%,rgba(7,12,25,0.96)_100%)]" />
      <div className="pointer-events-none absolute left-0 top-0 h-64 w-64 rounded-full bg-cyan-400/12 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full bg-orange-400/12 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 pb-28">
        <header className="rounded-[28px] border border-white/10 bg-[#07111fec] p-6 shadow-[0_0_50px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:items-end">
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.55em] text-cyan-200/75">Player Session</p>
              <div className="flex flex-wrap items-end gap-4">
                <h1 className="text-3xl font-black uppercase tracking-[0.12em] text-white sm:text-5xl sm:tracking-[0.16em]">
                  Sessão do personagem
                </h1>
                <span className="border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-cyan-100">
                  {selectedMapName}
                </span>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                Seu personagem ativo, a ficha, o mapa e os recursos principais no mesmo espaço, com o chat recolhido no canto.
              </p>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Bem-vindo, {user?.login}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SessionMetric label="HP" value={`${selectedCharacter.hp}/${selectedCharacter.maxHp}`} accentClassName="text-white" />
              <SessionMetric label="Mana" value={`${selectedCharacter.mana}/${selectedCharacter.maxMana}`} accentClassName="text-cyan-200" />
              <SessionMetric label="Energia" value={`${selectedCharacter.vigor}/${selectedCharacter.maxVigor}`} accentClassName="text-orange-200" />
              <SessionMetric label="Itens" value={`${inventoryCount}`} accentClassName="text-white" />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={loadPanel}>Atualizar sessão</Button>
            <Button size="sm" variant="ghost" onClick={handleReturnToSelection}>Trocar personagem</Button>
            <Button size="sm" variant="ghost" onClick={logout}>Sair</Button>
          </div>

          {inviteModal && (
            <Modal isOpen={true} onClose={() => setInviteModal(null)} title={`Convite para sessão: ${inviteModal.name || inviteModal.fight_id}`} actions={[{ label: 'Aceitar', onClick: () => respondToInvite(true) }, { label: 'Recusar', variant: 'ghost', onClick: () => respondToInvite(false) }]}>
              <div className="space-y-3">
                <p className="text-sm text-slate-300">O mestre convidou você para a sessão <strong>{inviteModal.name || `#${inviteModal.fight_id}`}</strong>.</p>
                <p className="text-sm text-slate-400">Tempo para responder: {inviteModal.expires_in ? `${inviteModal.expires_in}s` : '20s'}</p>
              </div>
            </Modal>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
          <section className="space-y-6">
            <Card className="overflow-hidden border border-white/10 bg-[#08111f]/90">
              <div className="grid gap-6 p-6 md:grid-cols-[260px_minmax(0,1fr)] xl:p-8">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0c1528]">
                    {portrait ? (
                      <img src={portrait} alt={characterLabel} className="h-[18rem] w-full object-cover" />
                    ) : (
                      <div className="flex h-[18rem] w-full items-center justify-center text-xs uppercase tracking-[0.35em] text-slate-400">
                        Sem imagem
                      </div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Sessão ativa</p>
                    <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.12em] text-white">{characterLabel}</h2>
                    <p className="mt-2 text-sm text-slate-300">{selectedCharacter.name}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.35em] text-cyan-200">{raceName || 'Raça indefinida'} • {selectedCharacter.class || 'Classe indefinida'}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Vida</p>
                      <p className="mt-2 text-2xl font-black text-white">{selectedCharacter.hp}/{selectedCharacter.maxHp}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Mana</p>
                      <p className="mt-2 text-2xl font-black text-cyan-200">{selectedCharacter.mana}/{selectedCharacter.maxMana}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Energia</p>
                      <p className="mt-2 text-2xl font-black text-orange-200">{selectedCharacter.vigor}/{selectedCharacter.maxVigor}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Resumo da sessão</p>
                      <span className="rounded-full border border-white/10 bg-[#0c1528] px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-300">
                        ativo
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {selectedCharacter.description || 'Sem descrição registrada para este personagem.'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Status do mapa</p>
                        <h3 className="mt-2 text-xl font-semibold text-white">{selectedMapName}</h3>
                      </div>
                      <span className="border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-100">
                        {selectedCharacter.current_map?.map_type || 'Sem tipo'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">
                      {selectedCharacter.current_map?.description || 'O personagem ainda não possui uma descrição de localização.'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Mapa da sessão" className="border border-white/10 bg-[#08111f]/90">
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                    <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Leitura tática</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      O mapa abaixo deixa a posição do personagem destacada, para combinar atuação, deslocamento e contexto visual sem poluir a tela.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Sessão</p>
                    <p className="mt-2 text-lg font-semibold text-white">{selectedCharacter.codename || selectedCharacter.name}</p>
                  </div>
                </div>

                <MapHierarchy worldMap={worldMap} selectedMapId={selectedMapId} />
              </div>
            </Card>
          </section>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <PlayerCharacter character={selectedCharacter} />
            <PlayerInventory characterId={selectedCharacter.id} />

            <Card title="Personagens" className="border border-white/10 bg-[#08111f]/90">
              <div className="space-y-3">
                {visibleCharacters.map((character) => {
                  const isSelected = selectedCharacter?.id === character.id
                  const portraitThumb = getCharacterPortrait(character)

                  return (
                    <button
                      key={character.id}
                      onClick={() => handleSelectCharacter(character.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                        isSelected
                          ? 'border-cyan-400/60 bg-cyan-400/10'
                          : 'border-white/10 bg-white/5 hover:border-cyan-400/40 hover:bg-white/10'
                      }`}
                    >
                      <div className="h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-[#0c1528]">
                        {portraitThumb ? (
                          <img src={portraitThumb} alt={character.codename || character.name || 'Personagem'} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.25em] text-slate-500">
                            Sem foto
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">{character.status}</p>
                        <p className="mt-2 truncate text-sm font-semibold text-white">{character.codename || 'Sem codinome'}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-cyan-200">{getCharacterMapName(character)}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </Card>
          </aside>
        </div>

        <PlayerChat
          compact
          defaultCollapsed
          dock="left"
          identityLabel={characterLabel}
          characterId={selectedCharacter.id}
        />
      </div>
    </div>
  )
}
