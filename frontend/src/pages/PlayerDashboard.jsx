import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useUserNotificationsWebSocket } from '../hooks/useUserNotificationsWebSocket'
import api from '../services/api'
import { Button, Card } from '../components/common'
import PlayerCharacter from '../components/player/PlayerCharacter'
import PlayerCharacterEditor from '../components/player/PlayerCharacterEditor'
import PlayerInventory from '../components/player/PlayerInventory'
import PlayerSkills from '../components/player/PlayerSkills'
import PlayerChat from '../components/player/PlayerChat'
import Sidebar from '../components/common/Sidebar'
import CharacterRequestForm from './CharacterRequestForm'

const TABS = {
  OVERVIEW: 'overview',
  RACES: 'races',
  ITEMS: 'items',
  CHARACTERS: 'characters',
  MAP: 'map',
}

const TAB_META = {
  [TABS.OVERVIEW]: {
    label: 'Painel dos Jogadores',
    description: 'Visão geral das raças, itens, personagens e mapa do jogador.',
  },
  [TABS.RACES]: {
    label: 'Raças',
    description: 'Dicionário de raças com foto, descrição e status.',
  },
  [TABS.ITEMS]: {
    label: 'Itens',
    description: 'Itens coletados pelos personagens do jogador.',
  },
  [TABS.CHARACTERS]: {
    label: 'Personagens',
    description: 'Lista de personagens, raça, nome, status e descrição.',
  },
  [TABS.MAP]: {
    label: 'Mapa',
    description: 'Mapa em árvore com localização atual do personagem.',
  },
}

function aggregateItems(characters = []) {
  const grouped = new Map()

  characters.forEach((character) => {
    ;(character.inventory || []).forEach((entry) => {
      const item = entry.item
      if (!item?.id) return

      const current = grouped.get(item.id) || {
        ...item,
        quantity: 0,
        owners: [],
      }

      current.quantity += entry.quantidade || 0
      if (!current.owners.includes(character.name)) {
        current.owners.push(character.name)
      }

      grouped.set(item.id, current)
    })
  })

  return Array.from(grouped.values())
}

function MapNode({ node, depth = 0, selectedMapId = null }) {
  const isSelected = selectedMapId && node.id === selectedMapId

  return (
    <div className="space-y-3">
      <div
        className={`border px-4 py-3 ${
          isSelected
            ? 'border-cyan-400/60 bg-cyan-400/10'
            : 'border-white/10 bg-white/5'
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
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Mapa Mundial</p>
                <p className="mt-2 text-sm text-slate-300">Navegue pelas cidades, vilas e mapas internos abaixo.</p>
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

export default function PlayerDashboard() {
  const { user, logout } = useAuth()
  const { notifications } = useUserNotificationsWebSocket(user?.id)
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW)
  const [panelData, setPanelData] = useState({ characters: [], races: [], world_map: [] })
  const [selectedCharacterId, setSelectedCharacterId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadPanel = async () => {
    try {
      const response = await api.get('/api/player-panel/')
      setPanelData(response.data || { characters: [], races: [], world_map: [] })
      setError(null)
    } catch (err) {
      console.error('Erro ao carregar painel do jogador:', err)
      setError('Não foi possível carregar os dados do painel.')
    } finally {
      setLoading(false)
    }
  }

  // Carrega painel inicialmente
  useEffect(() => {
    loadPanel()
  }, [])

  // Refetch ao receber notificação de personagem criado
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1]
      if (latestNotification?.data?.action === 'created' && latestNotification?.data?.character_id) {
        loadPanel()
      }
    }
  }, [notifications])

  const activeTabMeta = TAB_META[activeTab] || TAB_META[TABS.OVERVIEW]
  const visibleCharacters = useMemo(() => (panelData.characters || []).slice(0, 3), [panelData.characters])
  const selectedCharacter = visibleCharacters.find((character) => character.id === selectedCharacterId) || visibleCharacters[0] || null
  const playerItems = useMemo(() => aggregateItems(visibleCharacters), [visibleCharacters])

  useEffect(() => {
    if (!selectedCharacterId && visibleCharacters.length > 0) {
      setSelectedCharacterId(visibleCharacters[0].id)
    }
  }, [selectedCharacterId, visibleCharacters])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-cyan-300"></div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(255,122,24,0.12),transparent_25%),linear-gradient(180deg,rgba(4,8,21,0.95)_0%,rgba(7,17,31,0.98)_100%)]" />
      <div className="pointer-events-none absolute left-0 top-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-orange-400/10 blur-3xl" />

      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="relative flex-1 overflow-auto">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-[#07111fe6] px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.45em] text-cyan-200/75">
                Player Interface
              </p>
              <h1 className="text-2xl font-black uppercase tracking-[0.12em] text-white sm:text-4xl sm:tracking-[0.2em]">Painel dos Jogadores</h1>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Bem-vindo, {user?.login}</p>
              <p className="max-w-2xl text-sm text-slate-300">
                {activeTabMeta.label}: {activeTabMeta.description}
              </p>
            </div>
            <div className="grid gap-3 min-[480px]:grid-cols-3 xl:w-[34rem]">
              <div className="border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Personagem</p>
                <p className="mt-1 text-lg font-semibold text-white">{selectedCharacter?.name || 'Sem personagem'}</p>
              </div>
              <div className="border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Personagens</p>
                <p className="mt-1 text-lg font-semibold text-cyan-200">{visibleCharacters.length}/3</p>
              </div>
              <div className="border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Itens</p>
                <p className="mt-1 text-lg font-semibold text-orange-200">{playerItems.length}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={loadPanel}>Atualizar painel</Button>
            <Button size="sm" variant="ghost" onClick={logout}>Sair</Button>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {Object.values(TABS).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap border px-3 py-2 text-xs uppercase tracking-[0.25em] transition ${
                  activeTab === tab
                    ? 'border-cyan-400/60 bg-cyan-400/10 text-white'
                    : 'border-white/10 bg-white/5 text-slate-300'
                }`}
              >
                {TAB_META[tab]?.label || tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === TABS.OVERVIEW && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card title="Raças" className="border border-white/10 bg-[#08111f]/90">
                  <p className="text-4xl font-black text-cyan-200">{panelData.races.length}</p>
                  <p className="mt-2 text-sm text-slate-300">Raças disponíveis no dicionário.</p>
                </Card>
                <Card title="Itens" className="border border-white/10 bg-[#08111f]/90">
                  <p className="text-4xl font-black text-orange-200">{playerItems.length}</p>
                  <p className="mt-2 text-sm text-slate-300">Itens coletados pelos personagens do jogador.</p>
                </Card>
                <Card title="Personagens" className="border border-white/10 bg-[#08111f]/90">
                  <p className="text-4xl font-black text-white">{visibleCharacters.length}/3</p>
                  <p className="mt-2 text-sm text-slate-300">Máximo de 3 personagens por jogador.</p>
                </Card>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <Card title="Dicionário de Raças" className="border border-white/10 bg-[#08111f]/90">
                  <div className="grid gap-4 md:grid-cols-2">
                    {panelData.races.map((race) => (
                      <button
                        key={race.id}
                        onClick={() => setActiveTab(TABS.RACES)}
                        className="overflow-hidden border border-white/10 bg-white/5 text-left transition hover:border-cyan-400/50"
                      >
                        {race.image ? (
                          <img src={race.image} alt={race.name} className="h-44 w-full object-cover" />
                        ) : (
                          <div className="flex h-44 items-center justify-center bg-[#0c1528] text-xs uppercase tracking-[0.35em] text-slate-400">
                            Sem imagem
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-white">{race.name}</h3>
                          <p className="mt-2 text-sm text-slate-300">{race.description || 'Sem descrição.'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>

                <Card title="Personagens" className="border border-white/10 bg-[#08111f]/90">
                  <div className="space-y-3">
                    {visibleCharacters.map((character) => (
                      <button
                        key={character.id}
                        onClick={() => setSelectedCharacterId(character.id)}
                        className={`w-full border p-4 text-left transition ${
                          selectedCharacter?.id === character.id
                            ? 'border-cyan-400/60 bg-cyan-400/10'
                            : 'border-white/10 bg-white/5 hover:border-cyan-400/40 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">{character.status}</p>
                            <h3 className="mt-2 text-xl font-semibold text-white">{character.name}</h3>
                            <p className="mt-2 text-sm text-slate-300">
                              {character.race?.name || 'Raça indefinida'} • {character.class}
                            </p>
                          </div>
                          <span className="border border-white/10 bg-[#0c1528] px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">
                            {character.current_map?.name || 'Sem mapa'}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-300">{character.description || 'Sem descrição.'}</p>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === TABS.RACES && (
            <Card title="Dicionário de Raças" className="border border-white/10 bg-[#08111f]/90">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {panelData.races.map((race) => (
                  <div key={race.id} className="overflow-hidden border border-white/10 bg-white/5">
                    {race.image ? (
                      <img src={race.image} alt={race.name} className="h-48 w-full object-cover" />
                    ) : (
                      <div className="flex h-48 items-center justify-center bg-[#0c1528] text-xs uppercase tracking-[0.35em] text-slate-400">
                        Sem imagem
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-xl font-semibold text-white">{race.name}</h3>
                      <p className="mt-3 text-sm text-slate-300">{race.description || 'Sem descrição.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === TABS.ITEMS && (
            <Card title="Dicionário de Itens do Jogador" className="border border-white/10 bg-[#08111f]/90">
              {playerItems.length === 0 ? (
                <p className="text-sm text-slate-300">Nenhum item encontrado para os personagens deste jogador.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {playerItems.map((item) => (
                    <div key={item.id} className="border border-white/10 bg-white/5 p-4">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="mb-3 h-40 w-full object-cover" />
                      ) : (
                        <div className="mb-3 flex h-40 items-center justify-center bg-[#0c1528] text-xs uppercase tracking-[0.35em] text-slate-400">
                          Sem imagem
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                        <span className="border border-white/10 bg-[#0c1528] px-3 py-1 text-xs uppercase tracking-[0.3em] text-orange-200">
                          x{item.quantity}
                        </span>
                      </div>
                      <p className="mt-2 text-xs uppercase tracking-[0.35em] text-slate-400">{item.tipo}</p>
                      {item.description && <p className="mt-3 text-sm text-slate-300">{item.description}</p>}
                      {item.buffs && <p className="mt-3 text-sm text-cyan-200">Buffs: {item.buffs}</p>}
                      {item.nerfs && <p className="mt-2 text-sm text-orange-200">Nerfs: {item.nerfs}</p>}
                      <p className="mt-3 text-xs uppercase tracking-[0.3em] text-slate-400">
                        Donos: {item.owners.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {activeTab === TABS.CHARACTERS && (
            <div className="space-y-6">
              <Card title="Personagens do Jogador" className="border border-white/10 bg-[#08111f]/90">
                {visibleCharacters.length === 0 ? (
                  <div className="space-y-4">
                    <p className="text-slate-300">Você ainda não possui personagens criados.</p>
                    <CharacterRequestForm />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {visibleCharacters.map((character) => (
                      <button
                        key={character.id}
                        onClick={() => setSelectedCharacterId(character.id)}
                        className={`border p-4 text-left transition ${
                          selectedCharacter?.id === character.id
                            ? 'border-cyan-400/60 bg-cyan-400/10'
                            : 'border-white/10 bg-white/5 hover:border-cyan-400/40 hover:bg-white/10'
                        }`}
                      >
                        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">{character.race?.name || 'Raça indefinida'}</p>
                        <h3 className="mt-2 text-xl font-semibold text-white">{character.name}</h3>
                        <p className="mt-2 text-sm text-slate-300">{character.status}</p>
                        <p className="mt-3 text-sm text-slate-300">{character.description || 'Sem descrição.'}</p>
                      </button>
                    ))}
                  </div>
                )}
              </Card>

              {selectedCharacter && (
                <div className="space-y-6">
                  <PlayerCharacter character={selectedCharacter} />
                  <PlayerCharacterEditor
                    character={selectedCharacter}
                    onUpdate={(updated) => {
                      setPanelData((prev) => ({
                        ...prev,
                        characters: prev.characters.map((character) =>
                          character.id === selectedCharacter.id ? { ...character, ...updated } : character,
                        ),
                      }))
                    }}
                  />
                  <PlayerInventory characterId={selectedCharacter.id} inventory={selectedCharacter.inventory} />
                  <PlayerSkills />
                  <div className="hidden lg:block">
                    <PlayerChat />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === TABS.MAP && (
            <MapHierarchy worldMap={panelData.world_map || []} selectedMapId={selectedCharacter?.current_map_id || null} />
          )}

          {selectedCharacter && activeTab === TABS.OVERVIEW && (
            <div className="mt-8 space-y-6">
              <Card title={`Painel do Personagem // ${selectedCharacter.name}`} className="border border-white/10 bg-[#08111f]/90">
                <p className="text-sm text-slate-300">
                  Inventário, chat, habilidades e localização atual do personagem selecionado.
                </p>
              </Card>
              <PlayerCharacter character={selectedCharacter} />
              <PlayerCharacterEditor
                character={selectedCharacter}
                onUpdate={(updated) => {
                  setPanelData((prev) => ({
                    ...prev,
                    characters: prev.characters.map((character) =>
                      character.id === selectedCharacter.id ? { ...character, ...updated } : character,
                    ),
                  }))
                }}
              />
              <PlayerInventory characterId={selectedCharacter.id} inventory={selectedCharacter.inventory} />
              <PlayerSkills />
              <div className="hidden lg:block">
                <PlayerChat />
              </div>
              {/* Mobile chat drawer trigger */}
              <div className="lg:hidden">
                <div className="fixed z-40 bottom-6 right-4">
                  <Button size="md" onClick={() => setMobileChatOpen(true)} className="rounded-full px-4 py-3 shadow-lg">Chat</Button>
                </div>
                {mobileChatOpen && (
                  <div className="fixed inset-0 z-50 flex items-end lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setMobileChatOpen(false)} />
                    <div className="relative w-full h-3/4 bg-[#07111fe6] p-4 overflow-auto">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-white">Chat</h3>
                        <Button size="sm" variant="ghost" onClick={() => setMobileChatOpen(false)}>Fechar</Button>
                      </div>
                      <PlayerChat />
                    </div>
                  </div>
                )}
              </div>
              {selectedCharacter.current_map && (
                <Card title="Localização Atual" className="border border-white/10 bg-[#08111f]/90">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Mapa Atual</p>
                      <p className="mt-2 text-xl font-semibold text-cyan-200">{selectedCharacter.current_map.name}</p>
                      <p className="mt-2 text-sm text-slate-300">{selectedCharacter.current_map.description || 'Sem descrição.'}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.35em] text-orange-200">{selectedCharacter.current_map.map_type}</p>
                    </div>
                    {selectedCharacter.current_map.image && (
                      <img src={selectedCharacter.current_map.image} alt={selectedCharacter.current_map.name} className="h-56 w-full object-cover" />
                    )}
                  </div>
                </Card>
              )}
            </div>
          )}

          {error && (
            <Card className="mt-6 border border-red-500/40 bg-red-500/10 p-6 text-red-200">
              <p>{error}</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
