import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { Button, Card } from '../components/common'

const EMPTY_FIGHT = {
  name: '',
  status: 'in_progress',
  duration_seconds: 0,
}

const EMPTY_ENTRY = {
  actor_type: 'player',
  actor_name: '',
  damage: 0,
  healing: 0,
}

export default function FightManager() {
  const [fights, setFights] = useState([])
  const [stats, setStats] = useState(null)
  const [selectedFightId, setSelectedFightId] = useState(null)
  const [fightForm, setFightForm] = useState(EMPTY_FIGHT)
  const [entryForm, setEntryForm] = useState(EMPTY_ENTRY)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)

  const selectedFight = useMemo(
    () => fights.find((fight) => fight.id === selectedFightId) || fights[0] || null,
    [fights, selectedFightId],
  )

  const loadData = async () => {
    try {
      setLoading(true)
      const [fightsResponse, statsResponse] = await Promise.all([
        api.get('/fights/'),
        api.get('/fights/stats'),
      ])
      const fightList = fightsResponse.data || []
      setFights(fightList)
      setStats(statsResponse.data || null)
      if (!selectedFightId && fightList.length > 0) {
        setSelectedFightId(fightList[0].id)
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || error.message || 'Erro ao carregar fights' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!selectedFight) return
    setFightForm({
      name: selectedFight.name || '',
      status: selectedFight.status || 'in_progress',
      duration_seconds: selectedFight.duration_seconds || 0,
    })
  }, [selectedFight])

  const createFight = async (event) => {
    event.preventDefault()
    try {
      await api.post('/fights/', fightForm)
      setMessage({ type: 'success', text: 'Fight salva com sucesso.' })
      setFightForm(EMPTY_FIGHT)
      await loadData()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || error.message || 'Erro ao salvar fight' })
    }
  }

  const saveFight = async (event) => {
    event.preventDefault()
    if (!selectedFight) return
    try {
      await api.put(`/fights/${selectedFight.id}`, fightForm)
      setMessage({ type: 'success', text: 'Fight atualizada com sucesso.' })
      await loadData()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || error.message || 'Erro ao atualizar fight' })
    }
  }

  const removeFight = async (fightId) => {
    if (!window.confirm('Remover esta fight?')) return
    try {
      await api.delete(`/fights/${fightId}`)
      setMessage({ type: 'success', text: 'Fight removida.' })
      setSelectedFightId(null)
      await loadData()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || error.message || 'Erro ao remover fight' })
    }
  }

  const addEntry = async (event) => {
    event.preventDefault()
    if (!selectedFight) return
    try {
      await api.post(`/fights/${selectedFight.id}/entries`, {
        ...entryForm,
        damage: Math.max(0, Number(entryForm.damage) || 0),
        healing: Math.max(0, Number(entryForm.healing) || 0),
      })
      setMessage({ type: 'success', text: 'Entrada adicionada e estatísticas recalculadas.' })
      setEntryForm(EMPTY_ENTRY)
      await loadData()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || error.message || 'Erro ao registrar entrada' })
    }
  }

  const removeEntry = async (entryId) => {
    if (!selectedFight || !window.confirm('Remover esta entrada?')) return
    try {
      await api.delete(`/fights/${selectedFight.id}/entries/${entryId}`)
      setMessage({ type: 'success', text: 'Entrada removida.' })
      await loadData()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || error.message || 'Erro ao remover entrada' })
    }
  }

  if (loading) {
    return <div className="text-secondary">Carregando fights...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-orange-400">Fight</h2>
          <p className="mt-1 text-sm text-slate-300">Registre lutas, acompanhe dano/cura em tempo real e mantenha o histórico para o dashboard.</p>
        </div>
        {message && (
          <div className={`border px-4 py-3 text-sm ${message.type === 'error' ? 'border-red-500/40 bg-red-500/10 text-red-100' : 'border-green-500/40 bg-green-500/10 text-green-100'}`}>
            {message.text}
          </div>
        )}
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card title="Dano jogadores" className="border border-white/10 bg-[#08111f]/90">
            <p className="text-3xl font-black text-cyan-200">{stats.total_player_damage}</p>
          </Card>
          <Card title="Dano inimigos" className="border border-white/10 bg-[#08111f]/90">
            <p className="text-3xl font-black text-orange-200">{stats.total_enemy_damage}</p>
          </Card>
          <Card title="Cura jogadores" className="border border-white/10 bg-[#08111f]/90">
            <p className="text-3xl font-black text-cyan-200">{stats.total_player_healing}</p>
          </Card>
          <Card title="Cura inimigos" className="border border-white/10 bg-[#08111f]/90">
            <p className="text-3xl font-black text-orange-200">{stats.total_enemy_healing}</p>
          </Card>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card title={selectedFight ? 'Editar fight' : 'Nova fight'} className="border border-white/10 bg-[#08111f]/90">
          <form onSubmit={selectedFight ? saveFight : createFight} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Nome da sessão</label>
              <input
                className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                value={fightForm.name}
                onChange={(e) => setFightForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Status</label>
              <select
                className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                value={fightForm.status}
                onChange={(e) => setFightForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="in_progress">Em andamento</option>
                <option value="paused">Pausada</option>
                <option value="finished">Finalizada</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Duração em segundos</label>
              <input
                type="number"
                min="0"
                className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                value={fightForm.duration_seconds}
                onChange={(e) => setFightForm((prev) => ({ ...prev, duration_seconds: e.target.value }))}
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" variant="primary" className="flex-1">{selectedFight ? 'Salvar fight' : 'Criar fight'}</Button>
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setFightForm(EMPTY_FIGHT)}>Limpar</Button>
            </div>
          </form>
        </Card>

        <Card title={selectedFight ? `Fight selecionada: ${selectedFight.name}` : 'Selecione uma fight'} className="border border-white/10 bg-[#08111f]/90">
          <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
            <div className="space-y-3">
              {fights.map((fight) => (
                <button
                  key={fight.id}
                  onClick={() => setSelectedFightId(fight.id)}
                  className={`w-full border p-4 text-left transition ${selectedFight?.id === fight.id ? 'border-cyan-400/60 bg-cyan-400/10' : 'border-white/10 bg-white/5 hover:border-cyan-400/40 hover:bg-white/10'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">{fight.status}</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">{fight.name}</h3>
                    </div>
                    <span className="text-xs uppercase tracking-[0.3em] text-cyan-200">#{fight.id}</span>
                  </div>
                  <p className="mt-3 text-xs text-slate-300">{fight.started_at ? new Date(fight.started_at).toLocaleString('pt-BR') : 'Sem data'}</p>
                  <div className="mt-4 flex gap-2">
                    <Button type="button" variant="ghost" size="sm" className="flex-1" onClick={(event) => { event.stopPropagation(); removeFight(fight.id) }}>Remover</Button>
                  </div>
                </button>
              ))}
            </div>

            {selectedFight ? (
              <div className="space-y-6">
                <Card title="Registrar ação" className="border border-white/10 bg-[#0c1528]">
                  <form onSubmit={addEntry} className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Tipo</label>
                      <select
                        className="w-full border border-white/10 bg-[#08111f] px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                        value={entryForm.actor_type}
                        onChange={(e) => setEntryForm((prev) => ({ ...prev, actor_type: e.target.value }))}
                      >
                        <option value="player">Jogador</option>
                        <option value="enemy">Inimigo</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Nome</label>
                      <input
                        className="w-full border border-white/10 bg-[#08111f] px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                        value={entryForm.actor_name}
                        onChange={(e) => setEntryForm((prev) => ({ ...prev, actor_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Dano</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border border-white/10 bg-[#08111f] px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                        value={entryForm.damage}
                        onChange={(e) => setEntryForm((prev) => ({ ...prev, damage: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Cura</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border border-white/10 bg-[#08111f] px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                        value={entryForm.healing}
                        onChange={(e) => setEntryForm((prev) => ({ ...prev, healing: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Button type="submit" variant="primary" className="w-full">Adicionar registro</Button>
                    </div>
                  </form>
                </Card>

                <div className="grid gap-4 md:grid-cols-4">
                  <Card title="Média dano jogador" className="border border-white/10 bg-[#08111f]/90">
                    <p className="text-3xl font-black text-cyan-200">{selectedFight.player_damage_count ? (selectedFight.total_player_damage / selectedFight.player_damage_count).toFixed(2) : '0.00'}</p>
                  </Card>
                  <Card title="Média dano inimigo" className="border border-white/10 bg-[#08111f]/90">
                    <p className="text-3xl font-black text-orange-200">{selectedFight.enemy_damage_count ? (selectedFight.total_enemy_damage / selectedFight.enemy_damage_count).toFixed(2) : '0.00'}</p>
                  </Card>
                  <Card title="Média cura jogador" className="border border-white/10 bg-[#08111f]/90">
                    <p className="text-3xl font-black text-cyan-200">{selectedFight.player_healing_count ? (selectedFight.total_player_healing / selectedFight.player_healing_count).toFixed(2) : '0.00'}</p>
                  </Card>
                  <Card title="Média cura inimigo" className="border border-white/10 bg-[#08111f]/90">
                    <p className="text-3xl font-black text-orange-200">{selectedFight.enemy_healing_count ? (selectedFight.total_enemy_healing / selectedFight.enemy_healing_count).toFixed(2) : '0.00'}</p>
                  </Card>
                </div>

                <Card title="Registros da fight" className="border border-white/10 bg-[#08111f]/90">
                  <div className="space-y-3">
                    {selectedFight.entries.length === 0 ? (
                      <p className="text-sm text-slate-300">Nenhum registro ainda.</p>
                    ) : (
                      selectedFight.entries.map((entry) => (
                        <div key={entry.id} className="flex flex-wrap items-center justify-between gap-4 border border-white/10 bg-white/5 px-4 py-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{entry.actor_type}</p>
                            <p className="mt-1 text-lg font-semibold text-white">{entry.actor_name}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                            <span>Dano: {entry.damage}</span>
                            <span>Cura: {entry.healing}</span>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeEntry(entry.id)}>Remover</Button>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            ) : (
              <div className="flex items-center justify-center border border-dashed border-white/10 bg-white/5 p-10 text-slate-300">
                Selecione uma fight na lista para ver os registros.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
