import { Card } from '../common'
import { useInventoryWebSocket } from '../../hooks/useInventoryWebSocket'
import { assetUrl } from '../../services/api'

function InventoryItem({ entry }) {
  const item = entry.item || {}
  return (
    <li className="flex gap-3 border border-white/10 bg-[#0c1528] p-4">
      {item.image ? (
        <img src={assetUrl(item.image)} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-white/5 text-[10px] uppercase text-slate-500">
          item
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="truncate font-semibold text-white">{item.name || 'Item'}</h4>
          {entry.quantidade > 1 && (
            <span className="rounded bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">x{entry.quantidade}</span>
          )}
        </div>
        {item.tipo && <p className="text-xs capitalize text-slate-400">{item.tipo}</p>}
        {item.description && <p className="mt-1 text-xs text-slate-300">{item.description}</p>}
      </div>
    </li>
  )
}

export default function PlayerInventory({ characterId }) {
  const { inventory, isConnected, loading, error } = useInventoryWebSocket(characterId)
  const totalItems = inventory.reduce((sum, entry) => sum + (entry.quantidade || 0), 0)
  const kinds = new Set(inventory.map((entry) => entry.item?.tipo).filter(Boolean)).size

  return (
    <Card title="Inventário" className="border border-white/10 bg-[#08111f]/90">
      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-400">
        <span>{totalItems} itens</span>
        <span aria-hidden="true">•</span>
        <span>{kinds} tipos</span>
        <span className={`ml-auto inline-flex items-center gap-2 ${isConnected ? 'text-emerald-300' : 'text-slate-500'}`}>
          <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          {isConnected ? 'ao vivo' : 'offline'}
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Carregando inventário...</p>
      ) : error ? (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : inventory.length === 0 ? (
        <p className="rounded border border-dashed border-white/10 p-4 text-sm text-slate-400">
          Nenhum item ainda. O mestre entrega os itens durante a sessão.
        </p>
      ) : (
        <ul className="grid gap-3">
          {inventory.map((entry) => (
            <InventoryItem key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </Card>
  )
}
