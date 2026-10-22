import { useCallback, useEffect, useState } from 'react'
import api, { errorMessage } from '../services/api'
import { useSocket } from './useSocket'

/** Aplica um evento `inventory_update` do servidor à lista local. */
export function applyInventoryEvent(inventory, { action, item_id: itemId, item_name: itemName, quantity }) {
  const existing = inventory.find((entry) => entry.item?.id === itemId)

  if (action === 'added') {
    if (existing) {
      return inventory.map((entry) => (entry === existing ? { ...entry, quantidade: entry.quantidade + quantity } : entry))
    }
    return [...inventory, { id: `item-${itemId}`, item_id: itemId, item: { id: itemId, name: itemName }, quantidade: quantity }]
  }

  if (action === 'removed' || action === 'updated') {
    const nextQuantity = action === 'removed' ? (existing?.quantidade ?? 0) - quantity : quantity
    if (!existing) {
      return nextQuantity > 0
        ? [...inventory, { id: `item-${itemId}`, item_id: itemId, item: { id: itemId, name: itemName }, quantidade: nextQuantity }]
        : inventory
    }
    return inventory
      .map((entry) => (entry === existing ? { ...entry, quantidade: nextQuantity } : entry))
      .filter((entry) => entry.quantidade > 0)
  }

  return inventory
}

/** Inventário do personagem, carregado da API e mantido atualizado por WebSocket. */
export function useInventoryWebSocket(characterId) {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(Boolean(characterId))
  const [error, setError] = useState(null)

  const reloadInventory = useCallback(async () => {
    if (!characterId) {
      setInventory([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const response = await api.get(`/api/characters/${characterId}/inventory/`)
      setInventory(response.data || [])
      setError(null)
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível carregar o inventário.'))
    } finally {
      setLoading(false)
    }
  }, [characterId])

  useEffect(() => {
    reloadInventory()
  }, [reloadInventory])

  const handleMessage = useCallback((message) => {
    if (message?.type === 'inventory_update') setInventory((prev) => applyInventoryEvent(prev, message))
  }, [])

  const { isConnected } = useSocket(characterId ? `/ws/inventory/${characterId}` : null, handleMessage)

  return { inventory, isConnected, loading, error, reloadInventory }
}
