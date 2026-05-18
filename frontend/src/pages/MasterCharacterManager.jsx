import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { Button, Card } from '../components/common'

const EMPTY_FORM = {
  name: '',
  tipo: 'npc',
  age: '',
  raca_id: '',
  classe_id: '',
  user_id: '',
  current_map_id: '',
}

const DEFAULT_VISIBILITY = {
  show_hp: false,
  show_mana: false,
  show_buffs: false,
  show_debuffs: false,
  rule: 'public',
  allow_user_ids: [],
  friend_user_ids: [],
  public_fields: ['codename', 'race', 'class', 'status', 'portrait'],
}

function parseVisibility(raw) {
  if (!raw) return DEFAULT_VISIBILITY
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return {
      show_hp: Boolean(parsed.show_hp),
      show_mana: Boolean(parsed.show_mana),
      show_buffs: Boolean(parsed.show_buffs),
      show_debuffs: Boolean(parsed.show_debuffs),
      rule: parsed.rule || 'public',
      allow_user_ids: Array.isArray(parsed.allow_user_ids) ? parsed.allow_user_ids : [],
      friend_user_ids: Array.isArray(parsed.friend_user_ids) ? parsed.friend_user_ids : [],
      public_fields: Array.isArray(parsed.public_fields) ? parsed.public_fields : DEFAULT_VISIBILITY.public_fields,
    }
  } catch {
    return DEFAULT_VISIBILITY
  }
}

function toggleInArray(values, value) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

export default function MasterCharacterManager() {
  const [characters, setCharacters] = useState([])
  const [races, setRaces] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [visibility, setVisibility] = useState(DEFAULT_VISIBILITY)
  const [narrativeNote, setNarrativeNote] = useState('')
  const [quickAction, setQuickAction] = useState({ hp: '', mana: '', buffs: '', debuffs: '', addBuff: '', addDebuff: '', buffDuration: '', debuffDuration: '', removeBuff: '', removeDebuff: '', note: '' })
  const [auditLog, setAuditLog] = useState([])

  const loadData = async () => {
    setLoading(true)
    try {
      const [charactersRes, racesRes, classesRes] = await Promise.all([
        api.get('/api/master/characters/'),
        api.get('/api/racas/'),
        api.get('/api/classes/'),
      ])
      setCharacters(charactersRes.data || [])
      setRaces(racesRes.data || [])
      setClasses(classesRes.data || [])
      setError(null)
    } catch (err) {
      console.error('Erro ao carregar painel do mestre:', err)
      setError(err.response?.data?.detail || err.message || 'Erro ao carregar dados do mestre')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const selectedCharacter = useMemo(
    () => characters.find((character) => character.id === selectedId) || characters[0] || null,
    [characters, selectedId],
  )

  useEffect(() => {
    if (!selectedCharacter) return
    setSelectedId(selectedCharacter.id)
    setForm({
      name: selectedCharacter.name || '',
      tipo: selectedCharacter.tipo || 'npc',
      age: selectedCharacter.age ?? '',
      raca_id: selectedCharacter.race?.id ?? selectedCharacter.raca_id ?? '',
      classe_id: selectedCharacter.class_id ?? selectedCharacter.classe_id ?? '',
      user_id: selectedCharacter.owner?.id ?? selectedCharacter.user_id ?? '',
      current_map_id: selectedCharacter.current_map?.id ?? selectedCharacter.current_map_id ?? '',
    })
    setVisibility(parseVisibility(selectedCharacter.visibility))
    setNarrativeNote(selectedCharacter.description || '')
    setQuickAction({ hp: '', mana: '', buffs: '', debuffs: '', addBuff: '', addDebuff: '', buffDuration: '', debuffDuration: '', removeBuff: '', removeDebuff: '', note: '' })
  }, [selectedCharacter])

  useEffect(() => {
    if (!selectedCharacter) return
    const loadAudit = async () => {
      try {
        const res = await api.get(`/api/master/characters/${selectedCharacter.id}/audit`)
        setAuditLog(res.data || [])
      } catch {
        setAuditLog([])
      }
    }
    loadAudit()
  }, [selectedCharacter])

  const filteredCharacters = useMemo(() => {
    const term = search.trim().toLowerCase()
    return characters.filter((character) => {
      const matchesTerm = !term || [character.name, character.codename, character.race?.name, character.class, character.owner?.login]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))

      const matchesFilter =
        filter === 'all' ||
        (filter === 'online' && character.is_online) ||
        (filter === 'offline' && character.user_id && !character.is_online) ||
        (filter === 'npc' && character.is_npc) ||
        (filter === 'boss' && character.tipo === 'boss') ||
        (filter === 'dead' && character.is_dead)

      return matchesTerm && matchesFilter
    })
  }, [characters, search, filter])

  const summary = useMemo(() => {
    const total = characters.length
    const online = characters.filter((character) => character.is_online).length
    const offline = characters.filter((character) => character.user_id && !character.is_online).length
    const npcs = characters.filter((character) => character.is_npc).length
    const dead = characters.filter((character) => character.is_dead).length
    return { total, online, offline, npcs, dead }
  }, [characters])

  const saveCharacter = async (event) => {
    event.preventDefault()
    if (!selectedCharacter) return

    setSaving(true)
    try {
      const payload = {
        name: form.name || null,
        tipo: form.tipo || null,
        age: form.age === '' ? null : Number(form.age),
        raca_id: form.raca_id === '' ? null : Number(form.raca_id),
        classe_id: form.classe_id === '' ? null : Number(form.classe_id),
        user_id: form.user_id === '' ? null : Number(form.user_id),
        current_map_id: form.current_map_id === '' ? null : Number(form.current_map_id),
      }
      await api.put(`/api/master/characters/${selectedCharacter.id}`, payload)
      setMessage({ type: 'success', text: 'Personagem atualizado com sucesso.' })
      await loadData()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || err.message || 'Erro ao salvar personagem' })
    } finally {
      setSaving(false)
    }
  }

  const saveVisibility = async () => {
    if (!selectedCharacter) return
    setSaving(true)
    try {
      await api.post(`/api/master/characters/${selectedCharacter.id}/visibility`, visibility)
      setMessage({ type: 'success', text: 'Visibilidade atualizada.' })
      await loadData()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || err.message || 'Erro ao salvar visibilidade' })
    } finally {
      setSaving(false)
    }
  }

  const saveNarrative = async () => {
    if (!selectedCharacter) return
    setSaving(true)
    try {
      await api.post(`/api/master/characters/${selectedCharacter.id}/apply`, {
        narrative: narrativeNote,
      })
      setMessage({ type: 'success', text: 'Atualização narrativa enviada.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || err.message || 'Erro ao enviar atualização narrativa' })
    } finally {
      setSaving(false)
    }
  }

  const applyQuickAction = async () => {
    if (!selectedCharacter) return

    setSaving(true)
    try {
      const payload = {
        hp: quickAction.hp === '' ? undefined : Number(quickAction.hp),
        mana: quickAction.mana === '' ? undefined : Number(quickAction.mana),
        buffs: quickAction.buffs || undefined,
        debuffs: quickAction.debuffs || undefined,
        add_buff: quickAction.addBuff || undefined,
        add_debuff: quickAction.addDebuff || undefined,
        buff_duration_seconds: quickAction.buffDuration === '' ? undefined : Number(quickAction.buffDuration),
        debuff_duration_seconds: quickAction.debuffDuration === '' ? undefined : Number(quickAction.debuffDuration),
        remove_buff: quickAction.removeBuff || undefined,
        remove_debuff: quickAction.removeDebuff || undefined,
        note: quickAction.note || undefined,
      }
      await api.post(`/api/master/characters/${selectedCharacter.id}/apply`, payload)
      setMessage({ type: 'success', text: 'Ação rápida aplicada.' })
      setQuickAction({ hp: '', mana: '', buffs: '', debuffs: '', addBuff: '', addDebuff: '', buffDuration: '', debuffDuration: '', removeBuff: '', removeDebuff: '', note: '' })
      await loadData()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || err.message || 'Erro ao aplicar ação' })
    } finally {
      setSaving(false)
    }
  }

  const applyHpDelta = async (delta) => {
    if (!selectedCharacter) return
    setSaving(true)
    try {
      await api.post(`/api/master/characters/${selectedCharacter.id}/apply`, { hp: delta })
      setMessage({ type: 'success', text: `HP ${delta > 0 ? '+' : ''}${delta} aplicado.` })
      await loadData()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || err.message || 'Erro ao aplicar HP' })
    } finally {
      setSaving(false)
    }
  }

  const applyManaDelta = async (delta) => {
    if (!selectedCharacter) return
    setSaving(true)
    try {
      await api.post(`/api/master/characters/${selectedCharacter.id}/apply`, { mana: delta })
      setMessage({ type: 'success', text: `Mana ${delta > 0 ? '+' : ''}${delta} aplicado.` })
      await loadData()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || err.message || 'Erro ao aplicar Mana' })
    } finally {
      setSaving(false)
    }
  }

  const createCharacter = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        tipo: form.tipo,
        age: form.age === '' ? null : Number(form.age),
        raca_id: Number(form.raca_id),
        classe_id: Number(form.classe_id),
        user_id: form.user_id === '' ? null : Number(form.user_id),
        current_map_id: form.current_map_id === '' ? null : Number(form.current_map_id),
      }
      await api.post('/api/characters/', payload)
      setMessage({ type: 'success', text: 'Personagem criado com sucesso.' })
      setForm(EMPTY_FORM)
      await loadData()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || err.message || 'Erro ao criar personagem' })
    } finally {
      setSaving(false)
    }
  }

  const deleteCharacter = async () => {
    if (!selectedCharacter) return
    if (!window.confirm(`Tem certeza que deseja deletar "${selectedCharacter.name}"? Todos os players receberão uma notificação em tempo real.`)) return
    
    setSaving(true)
    try {
      await api.delete(`/api/characters/${selectedCharacter.id}`)
      setMessage({ type: 'success', text: 'Personagem deletado. Notificação enviada aos players em tempo real.' })
      setSelectedId(null)
      await loadData()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || err.message || 'Erro ao deletar personagem' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sm uppercase tracking-[0.35em] text-slate-300">Carregando painel do mestre...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-[0.18em] text-white">Controle de Personagens</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">
            Lista geral, edição narrativa, visibilidade, criação e comandos rápidos em tempo real.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ['all', `Todos (${summary.total})`],
            ['online', `Online (${summary.online})`],
            ['offline', `Offline (${summary.offline})`],
            ['npc', `NPCs (${summary.npcs})`],
            ['dead', `Mortos (${summary.dead})`],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`border px-3 py-2 text-xs uppercase tracking-[0.3em] transition ${filter === key ? 'border-cyan-400/60 bg-cyan-400/10 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/40'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <Card className={`border p-4 ${message.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-100' : 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100'}`}>
          {message.text}
        </Card>
      )}

      {error && <Card className="border border-red-500/40 bg-red-500/10 p-4 text-red-100">{error}</Card>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <Card title="Lista de Personagens" className="border border-white/10 bg-[#08111f]/90">
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, codinome, raça ou usuário"
              className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none focus:border-cyan-400/50"
            />
            <div className="flex items-center justify-between gap-3 border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              <span>{filteredCharacters.length} encontrados</span>
              <span className="text-cyan-200">Tempo real</span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredCharacters.map((character) => (
              <button
                key={character.id}
                onClick={() => setSelectedId(character.id)}
                className={`overflow-hidden border text-left transition ${selectedCharacter?.id === character.id ? 'border-cyan-400/60 bg-cyan-400/10' : 'border-white/10 bg-white/5 hover:border-cyan-400/40 hover:bg-white/10'}`}
              >
                <div className="h-40 bg-[#0c1528]">
                  {character.portrait ? (
                    <img src={character.portrait} alt={character.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.35em] text-slate-400">Sem foto</div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">{character.tipo}</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">{character.codename || character.name}</h3>
                    </div>
                    <span className={`border px-2 py-1 text-[10px] uppercase tracking-[0.25em] ${character.is_online ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-slate-400/30 bg-slate-400/10 text-slate-300'}`}>
                      {character.is_online ? 'online' : character.user_id ? 'offline' : 'npc'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{character.name}</p>
                  <p className="text-xs text-slate-400">{character.race?.name || 'Raça indefinida'} • {character.class || 'Classe indefinida'}</p>
                  <p className="text-xs text-slate-400">HP {character.hp ?? 0}/{character.max_hp ?? 0} • Mana {character.mana ?? 0}/{character.max_mana ?? 0}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card title={selectedCharacter ? `Edição: ${selectedCharacter.codename || selectedCharacter.name}` : 'Selecionar personagem'} className="border border-white/10 bg-[#08111f]/90">
            {selectedCharacter ? (
              <form onSubmit={saveCharacter} className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Nome</label>
                    <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Codinome</label>
                    <input value={selectedCharacter.codename || ''} disabled className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-slate-300 outline-none" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Tipo</label>
                    <select value={form.tipo} onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))} className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none">
                      <option value="player">player</option>
                      <option value="npc">npc</option>
                      <option value="boss">boss</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Idade</label>
                    <input type="number" value={form.age} onChange={(e) => setForm((prev) => ({ ...prev, age: e.target.value }))} className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Raça</label>
                    <select value={form.raca_id} onChange={(e) => setForm((prev) => ({ ...prev, raca_id: e.target.value }))} className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none">
                      <option value="">Selecione</option>
                      {races.map((race) => <option key={race.id} value={race.id}>{race.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Classe</label>
                    <select value={form.classe_id} onChange={(e) => setForm((prev) => ({ ...prev, classe_id: e.target.value }))} className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none">
                      <option value="">Selecione</option>
                      {classes.map((classe) => <option key={classe.id} value={classe.id}>{classe.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">User ID</label>
                    <input value={form.user_id} onChange={(e) => setForm((prev) => ({ ...prev, user_id: e.target.value }))} className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Mapa atual</label>
                    <input value={form.current_map_id} onChange={(e) => setForm((prev) => ({ ...prev, current_map_id: e.target.value }))} className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={saving}>Salvar edição</Button>
                  <Button type="button" variant="ghost" onClick={createCharacter} disabled={saving}>Criar novo</Button>
                  <Button type="button" variant="ghost" onClick={deleteCharacter} disabled={saving} className="border-red-500/30 hover:bg-red-500/10 hover:border-red-500/60">Deletar</Button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-slate-300">Selecione um personagem na lista para editar.</p>
            )}
          </Card>

          <Card title="Visibilidade e Tempo Real" className="border border-white/10 bg-[#08111f]/90">
            {selectedCharacter ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={visibility.show_hp}
                      onChange={(e) => setVisibility((prev) => ({ ...prev, show_hp: e.target.checked }))}
                    />
                    Mostrar HP para outros players
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={visibility.show_mana}
                      onChange={(e) => setVisibility((prev) => ({ ...prev, show_mana: e.target.checked }))}
                    />
                    Mostrar Mana
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={visibility.show_buffs}
                      onChange={(e) => setVisibility((prev) => ({ ...prev, show_buffs: e.target.checked }))}
                    />
                    Mostrar Buffs
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={visibility.show_debuffs}
                      onChange={(e) => setVisibility((prev) => ({ ...prev, show_debuffs: e.target.checked }))}
                    />
                    Mostrar Debuffs
                  </label>
                  <Button size="sm" type="button" onClick={saveVisibility} disabled={saving}>Salvar visibilidade</Button>
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Regra de visibilidade</label>
                  <select
                    value={visibility.rule || 'public'}
                    onChange={(e) => setVisibility((prev) => ({ ...prev, rule: e.target.value }))}
                    className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none"
                  >
                    <option value="public">public</option>
                    <option value="owner_only">owner_only</option>
                    <option value="same_map">same_map</option>
                    <option value="same_party">same_party</option>
                    <option value="friends">friends</option>
                    <option value="allow_list">allow_list</option>
                  </select>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.35em] text-slate-400">Campos públicos</p>
                  <div className="flex flex-wrap gap-2">
                    {['codename', 'race', 'class', 'status', 'portrait'].map((field) => (
                      <button
                        key={field}
                        type="button"
                        onClick={() => setVisibility((prev) => ({ ...prev, public_fields: toggleInArray(prev.public_fields, field) }))}
                        className={`border px-3 py-2 text-xs uppercase tracking-[0.25em] transition ${visibility.public_fields.includes(field) ? 'border-cyan-400/60 bg-cyan-400/10 text-white' : 'border-white/10 bg-white/5 text-slate-300'}`}
                      >
                        {field}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Nota narrativa</label>
                  <textarea value={narrativeNote} onChange={(e) => setNarrativeNote(e.target.value)} className="min-h-28 w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none" placeholder="Atualização descritiva, mudança de comportamento, pista revelada..." />
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" type="button" onClick={saveNarrative} disabled={saving}>Enviar nota narrativa</Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col">
                    <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">HP delta</label>
                    <div className="flex items-center gap-3 flex-1">
                      <input type="number" value={quickAction.hp} onChange={(e) => setQuickAction((prev) => ({ ...prev, hp: e.target.value }))} className="flex-1 border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none text-lg" placeholder="-10 ou 20" />
                      <div className="flex flex-col gap-2">
                        <button type="button" onClick={() => applyHpDelta(1)} className="px-3 py-2 text-sm border border-white/10 bg-white/5 hover:bg-white/10">+1</button>
                        <button type="button" onClick={() => applyHpDelta(5)} className="px-3 py-2 text-sm border border-white/10 bg-white/5 hover:bg-white/10">+5</button>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button type="button" onClick={() => applyHpDelta(-1)} className="px-3 py-2 text-sm border border-white/10 bg-white/5 hover:bg-white/10">-1</button>
                        <button type="button" onClick={() => applyHpDelta(-5)} className="px-3 py-2 text-sm border border-white/10 bg-white/5 hover:bg-white/10">-5</button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Mana delta</label>
                    <div className="flex items-center gap-3 flex-1">
                      <input type="number" value={quickAction.mana} onChange={(e) => setQuickAction((prev) => ({ ...prev, mana: e.target.value }))} className="flex-1 border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none text-lg" placeholder="-5 ou 5" />
                      <div className="flex flex-col gap-2">
                        <button type="button" onClick={() => applyManaDelta(1)} className="px-3 py-2 text-sm border border-white/10 bg-white/5 hover:bg-white/10">+1</button>
                        <button type="button" onClick={() => applyManaDelta(5)} className="px-3 py-2 text-sm border border-white/10 bg-white/5 hover:bg-white/10">+5</button>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button type="button" onClick={() => applyManaDelta(-1)} className="px-3 py-2 text-sm border border-white/10 bg-white/5 hover:bg-white/10">-1</button>
                        <button type="button" onClick={() => applyManaDelta(-5)} className="px-3 py-2 text-sm border border-white/10 bg-white/5 hover:bg-white/10">-5</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col">
                    <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Buffs atuais</label>
                    <input value={quickAction.buffs} onChange={(e) => setQuickAction((prev) => ({ ...prev, buffs: e.target.value }))} className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none" placeholder="ex: Shield, Haste" />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Debuffs atuais</label>
                    <input value={quickAction.debuffs} onChange={(e) => setQuickAction((prev) => ({ ...prev, debuffs: e.target.value }))} className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none" placeholder="ex: Poison, Slow" />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Adicionar buff</label>
                      <div className="flex gap-3">
                        <input value={quickAction.addBuff} onChange={(e) => setQuickAction((prev) => ({ ...prev, addBuff: e.target.value }))} className="flex-1 border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none" placeholder="Nome do buff" />
                        <input type="number" min="1" value={quickAction.buffDuration} onChange={(e) => setQuickAction((prev) => ({ ...prev, buffDuration: e.target.value }))} className="w-24 border border-white/10 bg-[#0c1528] px-3 py-3 text-white outline-none text-center" placeholder="s" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Adicionar debuff</label>
                      <div className="flex gap-3">
                        <input value={quickAction.addDebuff} onChange={(e) => setQuickAction((prev) => ({ ...prev, addDebuff: e.target.value }))} className="flex-1 border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none" placeholder="Nome do debuff" />
                        <input type="number" min="1" value={quickAction.debuffDuration} onChange={(e) => setQuickAction((prev) => ({ ...prev, debuffDuration: e.target.value }))} className="w-24 border border-white/10 bg-[#0c1528] px-3 py-3 text-white outline-none text-center" placeholder="s" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Remover buff (nome)</label>
                      <input value={quickAction.removeBuff} onChange={(e) => setQuickAction((prev) => ({ ...prev, removeBuff: e.target.value }))} className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none" placeholder="Nome do buff a remover" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Remover debuff (nome)</label>
                      <input value={quickAction.removeDebuff} onChange={(e) => setQuickAction((prev) => ({ ...prev, removeDebuff: e.target.value }))} className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none" placeholder="Nome do debuff a remover" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Rótulo narrativo</label>
                  <input value={quickAction.note} onChange={(e) => setQuickAction((prev) => ({ ...prev, note: e.target.value }))} className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none" placeholder="buff, dano, cura..." />
                </div>

                <div className="flex justify-end">
                  <Button type="button" onClick={applyQuickAction} disabled={saving}>Aplicar ação rápida</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-300">Nenhum personagem selecionado.</p>
            )}
          </Card>

          <Card title="Histórico do Mestre" className="border border-white/10 bg-[#08111f]/90">
            <div className="space-y-2 max-h-72 overflow-auto">
              {auditLog.length === 0 && <p className="text-sm text-slate-400">Sem eventos registrados.</p>}
              {auditLog.map((entry) => (
                <div key={entry.id} className="border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{entry.action} • master {entry.master_id}</p>
                  <p className="mt-1 text-xs text-slate-400">{entry.created_at || '-'}</p>
                  <pre className="mt-2 text-xs text-slate-300 whitespace-pre-wrap">{entry.payload || '{}'}</pre>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
