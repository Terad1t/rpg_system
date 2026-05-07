import { useEffect, useState } from 'react'
import { Card, Button } from '../common'
import { useInventoryWebSocket } from '../../hooks/useInventoryWebSocket'
import { useAuth } from '../../context/AuthContext'

const rarityColors = {
  comum: 'text-gray-400 border-gray-600',
  incomum: 'text-green-400 border-green-600',
  raro: 'text-blue-400 border-blue-600',
  epico: 'text-purple-400 border-purple-600',
  lendario: 'text-orange-400 border-orange-600',
}

export default function PlayerInventory({ characterId: characterIdProp = null, inventory: inventoryProp = null }) {
  const { user } = useAuth()
  const [characterId, setCharacterId] = useState(characterIdProp)
  const resolvedCharacterId = characterIdProp ?? characterId
  const { inventory, isConnected, loading, error } = useInventoryWebSocket(resolvedCharacterId)

  useEffect(() => {
    if (characterIdProp) {
      setCharacterId(characterIdProp)
      return
    }

    if (!user?.user_id) return

    fetch('/api/my-characters', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Erro HTTP ${res.status}: ${res.statusText}`)
        }
        const contentType = res.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Resposta não é JSON: ${contentType}`)
        }
        return res.json()
      })
      .then((data) => {
        if (data.length > 0) {
          setCharacterId(data[0].id)
        }
      })
      .catch((err) => console.error('Erro ao buscar personagens:', err))
  }, [characterIdProp, user?.user_id])

  const visibleInventory = inventoryProp ?? inventory

  if (!inventoryProp && loading) return <div className="text-secondary">Carregando inventário...</div>
  if (!inventoryProp && error) return <div className="text-red-500">Erro: {error}</div>

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card title="Inventário" className="border border-white/10 bg-[#08111f]/90">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleInventory.map((item) => (
            <div
              key={item.id}
              className={`
                cursor-pointer border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
                bg-[#0c1528]
                ${rarityColors[item.item?.rarity || 'comum'] || rarityColors.comum}
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="flex-1 font-semibold text-white">{item.item?.name}</h4>
                {item.quantidade > 1 && (
                  <span className="rounded bg-orange-500 px-2 py-1 text-xs font-bold text-white">
                    x{item.quantidade}
                  </span>
                )}
              </div>
              <p className="mb-3 text-xs capitalize text-slate-400">{item.item?.tipo}</p>
              {item.item?.description && <p className="mb-3 text-xs text-slate-300">{item.item.description}</p>}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                >
                  Usar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                >
                  Vender
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Resumo */}
      <Card title="Resumo" className="border border-white/10 bg-[#08111f]/90">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
            <p className="mb-1 text-xs uppercase tracking-[0.3em] text-slate-400">Total de Itens</p>
            <p className="text-2xl font-bold text-white">
              {visibleInventory.reduce((sum, item) => sum + (item.quantidade || 0), 0)}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
            <p className="mb-1 text-xs uppercase tracking-[0.3em] text-slate-400">Tipos</p>
            <p className="text-2xl font-bold text-cyan-200">
              {new Set(visibleInventory.map((item) => item.item?.tipo)).size}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
            <p className="mb-1 text-xs uppercase tracking-[0.3em] text-slate-400">Peso</p>
            <p className="text-2xl font-bold text-orange-200">45/100</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
            <p className="mb-1 text-xs uppercase tracking-[0.3em] text-slate-400">Espaço</p>
            <p className="text-2xl font-bold text-white">9/20</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
