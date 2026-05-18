import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Button, Card } from '../components/common'
import CharacterRequestForm from './CharacterRequestForm'

function CharacterSelectCard({ character, selected, onSelect, onEnter }) {
  const portrait = character.portrait || character.race?.image || character.current_map?.image || null

  return (
    <button
      type="button"
      onClick={() => onSelect(character.id)}
      className={`overflow-hidden border text-left transition ${selected ? 'border-cyan-400/60 bg-cyan-400/10' : 'border-white/10 bg-white/5 hover:border-cyan-400/40 hover:bg-white/10'}`}
    >
      <div className="h-44 w-full overflow-hidden bg-[#0c1528]">
        {portrait ? (
          <img src={portrait} alt={character.codename || character.name || 'Personagem'} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.35em] text-slate-400">Sem imagem</div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">{character.status}</p>
            <h3 className="mt-2 text-xl font-semibold text-white">{character.codename || character.name}</h3>
            <p className="mt-2 text-sm text-slate-300">{character.name}</p>
          </div>
          <span className="border border-white/10 bg-[#0c1528] px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">{character.current_map?.name || 'Sem mapa'}</span>
        </div>

        <div className="grid gap-2 text-xs uppercase tracking-[0.3em] text-slate-400 sm:grid-cols-2">
          <div className="border border-white/10 bg-[#0c1528] px-3 py-2">Raça: <span className="text-white">{character.race?.name || 'Indefinida'}</span></div>
          <div className="border border-white/10 bg-[#0c1528] px-3 py-2">Classe: <span className="text-white">{character.class || 'Indefinida'}</span></div>
        </div>

        <Button
          size="sm"
          className="w-full"
          onClick={(event) => {
            event.stopPropagation()
            onEnter(character.id)
          }}
        >
          Entrar com este personagem
        </Button>
      </div>
    </button>
  )
}

export default function PlayerCharacterSelectPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [characters, setCharacters] = useState([])
  const [selectedCharacterId, setSelectedCharacterId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const storageKey = user?.id ? `player-dashboard:selected-character:${user.id}` : null
  const selectedCharacter = useMemo(
    () => characters.find((character) => character.id === selectedCharacterId) || null,
    [characters, selectedCharacterId],
  )

  const loadCharacters = async () => {
    try {
      const response = await api.get('/api/player-panel/')
      const nextCharacters = response.data?.characters || []
      setCharacters(nextCharacters)
      setError(null)

      if (!nextCharacters.length) {
        setSelectedCharacterId(null)
        return
      }

      const stored = storageKey ? Number(localStorage.getItem(storageKey)) : NaN
      if (stored && nextCharacters.some((character) => character.id === stored)) {
        setSelectedCharacterId(stored)
      } else {
        setSelectedCharacterId(nextCharacters[0].id)
      }
    } catch (err) {
      console.error('[PlayerCharacterSelectPage] Erro ao carregar personagens:', err)
      setError('Não foi possível carregar seus personagens.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCharacters()
  }, [])

  const handleSelect = (characterId) => {
    setSelectedCharacterId(characterId)
    if (storageKey) {
      localStorage.setItem(storageKey, String(characterId))
    }
  }

  const handleEnter = (characterId) => {
    handleSelect(characterId)
    navigate('/player')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#040815] px-6 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-cyan-300" />
          <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Carregando personagens...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(255,122,24,0.12),transparent_25%),linear-gradient(180deg,rgba(4,8,21,0.95)_0%,rgba(7,17,31,0.98)_100%)]" />
      <div className="pointer-events-none absolute left-0 top-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-orange-400/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-[#07111fe6] p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.45em] text-cyan-200/75">Player Interface</p>
              <h1 className="text-2xl font-black uppercase tracking-[0.12em] text-white sm:text-4xl sm:tracking-[0.2em]">Escolha seu personagem</h1>
              <p className="max-w-2xl text-sm text-slate-300">Selecione um personagem para abrir o painel completo com ficha, mapa, chat e inventário.</p>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Bem-vindo, {user?.login}</p>
            </div>

            <div className="grid gap-3 min-[480px]:grid-cols-3 xl:w-[34rem]">
              <div className="border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Personagens</p>
                <p className="mt-1 text-lg font-semibold text-cyan-200">{characters.length}/3</p>
              </div>
              <div className="border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Selecionado</p>
                <p className="mt-1 text-lg font-semibold text-white">{selectedCharacter?.codename || 'Nenhum'}</p>
              </div>
              <div className="border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Status</p>
                <p className="mt-1 text-lg font-semibold text-orange-200">Pronto para entrar</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={loadCharacters}>Atualizar personagens</Button>
            <Button size="sm" variant="ghost" onClick={logout}>Sair</Button>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm text-red-200">{error}</div>
          )}
        </div>

        {characters.length > 0 ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <Card title="Seus personagens" className="border border-white/10 bg-[#08111f]/90">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {characters.map((character) => (
                  <CharacterSelectCard
                    key={character.id}
                    character={character}
                    selected={selectedCharacter?.id === character.id}
                    onSelect={handleSelect}
                    onEnter={handleEnter}
                  />
                ))}
              </div>
            </Card>

            <Card title="Resumo rápido" className="border border-white/10 bg-[#08111f]/90">
              {selectedCharacter ? (
                <div className="space-y-4">
                  <div className="border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Personagem escolhido</p>
                    <p className="mt-2 text-2xl font-black uppercase tracking-[0.12em] text-white">{selectedCharacter.codename || selectedCharacter.name}</p>
                    <p className="mt-2 text-sm text-slate-300">{selectedCharacter.description || 'Sem descrição.'}</p>
                  </div>

                  <div className="grid gap-3">
                    <div className="border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Vida</p>
                      <p className="mt-2 text-lg font-semibold text-white">{selectedCharacter.hp}/{selectedCharacter.maxHp}</p>
                    </div>
                    <div className="border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Mana</p>
                      <p className="mt-2 text-lg font-semibold text-cyan-200">{selectedCharacter.mana}/{selectedCharacter.maxMana}</p>
                    </div>
                    <div className="border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Energia</p>
                      <p className="mt-2 text-lg font-semibold text-orange-200">{selectedCharacter.vigor}/{selectedCharacter.maxVigor}</p>
                    </div>
                    <div className="border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Próximo passo</p>
                      <p className="mt-2 text-sm text-slate-300">Clique em entrar para abrir o painel completo do personagem.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-sm text-slate-300">
                  <p>Selecione um personagem para visualizar o resumo rápido e entrar no painel completo.</p>
                  <p>Se você não tiver personagens, pode solicitar a criação abaixo.</p>
                </div>
              )}
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <Card title="Nenhum personagem criado" className="border border-white/10 bg-[#08111f]/90">
              <div className="space-y-4 text-sm text-slate-300">
                <p>Você ainda não possui personagens disponíveis para entrar no painel.</p>
                <p>Solicite a criação de um personagem abaixo e, depois de aprovado, volte para esta tela.</p>
              </div>
            </Card>
            <CharacterRequestForm />
          </div>
        )}
      </div>
    </div>
  )
}