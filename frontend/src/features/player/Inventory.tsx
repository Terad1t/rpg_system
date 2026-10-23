import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Backpack } from 'lucide-react'
import { keys, useInventory } from '@/api/queries'
import type { InventoryEntry } from '@/api/types'
import { useSocket } from '@/realtime/useSocket'
import { Badge, StatusDot } from '@/ui/Badge'
import { EmptyState, QueryBoundary } from '@/ui/feedback'
import { Panel } from '@/ui/Panel'
import { Avatar } from '@/ui/misc'

interface InventoryEvent {
  type: 'inventory_update'
  action: 'added' | 'removed' | 'updated'
  item_id: number
  item_name: string
  quantity: number
}

/** Aplica um evento do servidor à lista local, sem recarregar. */
export function applyInventoryEvent(inventory: InventoryEntry[], event: Pick<InventoryEvent, 'action' | 'item_id' | 'item_name' | 'quantity'>): InventoryEntry[] {
  const existing = inventory.find((entry) => entry.item?.id === event.item_id)
  const fresh = (quantidade: number): InventoryEntry => ({ id: `item-${event.item_id}`, item_id: event.item_id, item: { id: event.item_id, name: event.item_name }, quantidade })

  if (event.action === 'added') {
    if (!existing) return [...inventory, fresh(event.quantity)]
    return inventory.map((entry) => (entry === existing ? { ...entry, quantidade: entry.quantidade + event.quantity } : entry))
  }
  const next = event.action === 'removed' ? (existing?.quantidade ?? 0) - event.quantity : event.quantity
  if (!existing) return next > 0 ? [...inventory, fresh(next)] : inventory
  return inventory.map((entry) => (entry === existing ? { ...entry, quantidade: next } : entry)).filter((entry) => entry.quantidade > 0)
}

export function Inventory({ characterId }: { characterId: number }) {
  const queryClient = useQueryClient()
  const inventory = useInventory(characterId)

  const onEvent = useCallback(
    (event: InventoryEvent) => {
      if (event.type !== 'inventory_update') return
      queryClient.setQueryData<InventoryEntry[]>(keys.inventory(characterId), (prev = []) => applyInventoryEvent(prev, event))
      // Recarrega em segundo plano para trazer os detalhes completos do item.
      queryClient.invalidateQueries({ queryKey: keys.inventory(characterId) })
    },
    [characterId, queryClient],
  )
  const { isConnected } = useSocket<InventoryEvent>(`/ws/inventory/${characterId}`, onEvent)

  return (
    <Panel title="Inventário" actions={<StatusDot online={isConnected} />}>
      <QueryBoundary query={inventory}>
        {(entries) =>
          entries.length === 0 ? (
            <EmptyState title="Mochila vazia" icon={<Backpack className="h-6 w-6" />}>
              O mestre entrega itens durante a sessão; eles aparecem aqui na hora.
            </EmptyState>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {entries.map((entry) => (
                <li key={entry.id} className="flex gap-3 rounded-md border border-line bg-surface-sunken p-3">
                  <Avatar src={entry.item.image} name={entry.item.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold text-parchment">{entry.item.name}</p>
                      {entry.quantidade > 1 && <Badge tone="gold">×{entry.quantidade}</Badge>}
                    </div>
                    {entry.item.tipo && <p className="text-xs capitalize text-parchment-faint">{entry.item.tipo}</p>}
                    {entry.item.description && <p className="mt-1 text-xs text-parchment-muted">{entry.item.description}</p>}
                    <p className="mt-1 flex flex-wrap gap-2 text-xs">
                      {entry.item.buffs && <span className="text-moss">+ {entry.item.buffs}</span>}
                      {entry.item.nerfs && <span className="text-blood">− {entry.item.nerfs}</span>}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </QueryBoundary>
    </Panel>
  )
}
