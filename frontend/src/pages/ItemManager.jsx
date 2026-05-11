import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { useUserNotificationsWebSocket } from '../hooks/useUserNotificationsWebSocket'
import { Button, Card } from '../components/common'

const EMPTY_FORM = {
  name: '',
  tipo: '',
  buffs: '',
  nerfs: '',
  quantity: 1,
  description: '',
  image: '',
}

export default function ItemManager() {
  const { user } = useAuth()
  const { isConnected, notifications, clearNotifications } = useUserNotificationsWebSocket(user?.id)
  const [items, setItems] = useState([])
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [assignCharacterId, setAssignCharacterId] = useState('')
  const [assignItemId, setAssignItemId] = useState('')
  const [assignQuantity, setAssignQuantity] = useState(1)

  const loadData = async () => {
    try {
      setLoading(true)
      const [itemsResponse, charactersResponse] = await Promise.all([api.get('/api/items/'), api.get('/api/characters/')])
      setItems(itemsResponse.data || [])
      setCharacters(charactersResponse.data || [])
      setError(null)
    } catch (err) {
      console.error('Erro ao carregar itens:', err)
      setError(err.response?.data?.detail || err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const selectedItem = useMemo(() => items.find((item) => item.id === editingId) || null, [items, editingId])

  useEffect(() => {
    if (!selectedItem) return
    setFormData({
      name: selectedItem.name || '',
      tipo: selectedItem.tipo || '',
      buffs: selectedItem.buffs || '',
      nerfs: selectedItem.nerfs || '',
      quantity: selectedItem.quantity ?? selectedItem.quantidade_maxima ?? 1,
      description: selectedItem.description || '',
      image: selectedItem.image || '',
    })
  }, [selectedItem])

  const resetForm = () => {
    setEditingId(null)
    setFormData(EMPTY_FORM)
  }

  const submitItem = async (event) => {
    event.preventDefault()

    try {
      const payload = {
        ...formData,
        quantity: Math.max(1, Number(formData.quantity) || 1),
      }

      if (editingId) {
        await api.put(`/api/items/${editingId}`, payload)
        setMessage({ type: 'success', text: 'Item atualizado com sucesso.' })
      } else {
        await api.post('/api/items/', payload)
        setMessage({ type: 'success', text: 'Item criado com sucesso.' })
      }

      resetForm()
      await loadData()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || err.message || 'Erro ao salvar item' })
    }
  }

  const handleEdit = (item) => {
    setEditingId(item.id)
    setFormData({
      name: item.name || '',
      tipo: item.tipo || '',
      buffs: item.buffs || '',
      nerfs: item.nerfs || '',
      quantity: item.quantity ?? item.quantidade_maxima ?? 1,
      description: item.description || '',
      image: item.image || '',
    })
  }

  const handleDelete = async (itemId) => {
    if (!window.confirm('Tem certeza que deseja deletar este item?')) return

    try {
      await api.delete(`/api/items/${itemId}`)
      setMessage({ type: 'success', text: 'Item removido com sucesso.' })
      await loadData()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || err.message || 'Erro ao deletar item' })
    }
  }

  const handleAssignToInventory = async (event) => {
    event.preventDefault()

    if (!assignCharacterId || !assignItemId) {
      setMessage({ type: 'error', text: 'Selecione um personagem e um item.' })
      return
    }

    try {
      await api.post(`/api/characters/${assignCharacterId}/inventory/add`, null, {
        params: {
          item_id: assignItemId,
          quantity: Math.max(1, Number(assignQuantity) || 1),
        },
      })
      setMessage({ type: 'success', text: 'Item adicionado ao inventário do personagem.' })
      setAssignCharacterId('')
      setAssignItemId('')
      setAssignQuantity(1)
      await loadData()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || err.message || 'Erro ao adicionar item ao inventário' })
    }
  }

  if (loading) {
    return <div className="text-secondary">Carregando dicionário de itens...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-orange-400">Dicionário Global de Itens</h2>
          <p className="mt-1 text-sm text-slate-300">Crie, edite e exclua itens, ou adicione-os diretamente ao inventário de qualquer personagem.</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded text-sm ${isConnected ? 'bg-green-900 text-green-100' : 'bg-red-900 text-red-100'}`}>
          <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          {isConnected ? 'Notificações ativas' : 'Desconectado'}
        </div>
      </div>

      {message && (
        <Card className={`border ${message.type === 'error' ? 'border-red-500/40 bg-red-500/10 text-red-100' : 'border-green-500/40 bg-green-500/10 text-green-100'} p-4`}>
          {message.text}
        </Card>
      )}

      {notifications.length > 0 && (
        <Card className="border border-white/10 bg-[#08111f]/90 p-4">
          <div className="space-y-2">
            {notifications.map((notif, index) => (
              <div key={`${notif.type}-${index}`} className="rounded border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-100">
                {notif.type === 'inventory_update' ? `Inventário atualizado: ${notif.data?.item_name}` : notif.type}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" onClick={clearNotifications}>Limpar notificações</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card title={editingId ? 'Editar Item' : 'Criar Item'} className="border border-white/10 bg-[#08111f]/90">
          <form onSubmit={submitItem} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Nome</label>
              <input className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none focus:border-cyan-400/50" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} required />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Tipo</label>
              <input className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none focus:border-cyan-400/50" value={formData.tipo} onChange={(e) => setFormData((prev) => ({ ...prev, tipo: e.target.value }))} required />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Quantidade</label>
              <input type="number" min="1" className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none focus:border-cyan-400/50" value={formData.quantity} onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))} required />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Imagem</label>
              <input className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none focus:border-cyan-400/50" value={formData.image} onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))} placeholder="URL da imagem" />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Buffs</label>
              <textarea className="min-h-28 w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none focus:border-cyan-400/50" value={formData.buffs} onChange={(e) => setFormData((prev) => ({ ...prev, buffs: e.target.value }))} />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Nerfs</label>
              <textarea className="min-h-28 w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none focus:border-cyan-400/50" value={formData.nerfs} onChange={(e) => setFormData((prev) => ({ ...prev, nerfs: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Descrição</label>
              <textarea className="min-h-32 w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none focus:border-cyan-400/50" value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <Button type="submit" variant="primary">{editingId ? 'Salvar alterações' : 'Criar item'}</Button>
              {editingId && <Button type="button" variant="ghost" onClick={resetForm}>Cancelar edição</Button>}
            </div>
          </form>
        </Card>

        <Card title="Adicionar ao Inventário" className="border border-white/10 bg-[#08111f]/90">
          <form onSubmit={handleAssignToInventory} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Personagem</label>
              <select className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none focus:border-cyan-400/50" value={assignCharacterId} onChange={(e) => setAssignCharacterId(e.target.value)}>
                <option value="">Selecione</option>
                {characters.map((character) => (
                  <option key={character.id} value={character.id}>{character.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Item</label>
              <select className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none focus:border-cyan-400/50" value={assignItemId} onChange={(e) => setAssignItemId(e.target.value)}>
                <option value="">Selecione</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-slate-400">Quantidade</label>
              <input type="number" min="1" className="w-full border border-white/10 bg-[#0c1528] px-4 py-3 text-white outline-none focus:border-cyan-400/50" value={assignQuantity} onChange={(e) => setAssignQuantity(e.target.value)} />
            </div>
            <Button type="submit" variant="secondary" className="w-full">Adicionar ao inventário</Button>
          </form>
        </Card>
      </div>

      <Card title={`Itens cadastrados (${items.length})`} className="border border-white/10 bg-[#08111f]/90">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="border border-white/10 bg-white/5 p-4">
              {item.image ? (
                <img src={item.image} alt={item.name} className="mb-3 h-44 w-full object-cover" />
              ) : (
                <div className="mb-3 flex h-44 items-center justify-center bg-[#0c1528] text-xs uppercase tracking-[0.35em] text-slate-400">Sem imagem</div>
              )}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-white">{item.name}</h3>
                  <p className="mt-2 text-xs uppercase tracking-[0.35em] text-cyan-200">{item.tipo}</p>
                </div>
                <span className="border border-white/10 bg-[#0c1528] px-3 py-1 text-xs uppercase tracking-[0.3em] text-orange-200">x{item.quantity ?? item.quantidade_maxima ?? 1}</span>
              </div>
              {item.description && <p className="mt-3 text-sm text-slate-300">{item.description}</p>}
              {item.buffs && <p className="mt-3 text-sm text-cyan-200">Buffs: {item.buffs}</p>}
              {item.nerfs && <p className="mt-2 text-sm text-orange-200">Nerfs: {item.nerfs}</p>}
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleEdit(item)}>Editar</Button>
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleDelete(item.id)}>Deletar</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
