import { useEffect, useState } from 'react'
import api from '../services/api'
import { Button, Card, Input } from '../components/common'

export default function MasterBuffManager() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', kind: 'buff', description: '', duration_default_seconds: '' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/master/buffs/')
      setItems(res.data || [])
    } catch (err) {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const startEdit = (it) => {
    setEditing(it?.id || null)
    setForm({
      name: it?.name || '',
      kind: it?.kind || 'buff',
      description: it?.description || '',
      duration_default_seconds: it?.duration_default_seconds || '',
    })
  }

  const save = async (e) => {
    e?.preventDefault()
    try {
      if (editing) {
        await api.put(`/api/master/buffs/${editing}`, { ...form, duration_default_seconds: form.duration_default_seconds || null })
      } else {
        await api.post('/api/master/buffs/', { ...form, duration_default_seconds: form.duration_default_seconds || null })
      }
      startEdit(null)
      await load()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.detail || err.message)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Remover buff/debuff?')) return
    try {
      await api.delete(`/api/master/buffs/${id}`)
      await load()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.detail || err.message)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-[0.18em] text-white">Gerenciamento de Buffs/Debuffs</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Definições" className="border border-white/10 bg-[#08111f]/90">
          {loading ? <p className="text-sm text-slate-300">Carregando...</p> : (
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.id} className="flex items-center justify-between border border-white/5 p-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{it.name} <span className="text-xs text-slate-400">{it.kind}</span></div>
                    <div className="text-xs text-slate-300">{it.description}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(it)}>Editar</Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(it.id)} className="border-red-500/30 hover:bg-red-500/10">Remover</Button>
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-slate-400">Nenhum buff/debuff definido.</p>}
            </div>
          )}
        </Card>

        <Card title={editing ? 'Editar definição' : 'Criar nova definição'} className="border border-white/10 bg-[#08111f]/90">
          <form onSubmit={save} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400">Nome</label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({...p, name: e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs text-slate-400">Tipo</label>
              <select value={form.kind} onChange={(e) => setForm((p) => ({...p, kind: e.target.value}))} className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none">
                <option value="buff">buff</option>
                <option value="debuff">debuff</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400">Descrição</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({...p, description: e.target.value}))} className="w-full min-h-20 border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-400">Duração padrão (s)</label>
              <Input value={form.duration_default_seconds} onChange={(e) => setForm((p) => ({...p, duration_default_seconds: e.target.value}))} />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Salvar</Button>
              <Button type="button" variant="ghost" onClick={() => startEdit(null)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
