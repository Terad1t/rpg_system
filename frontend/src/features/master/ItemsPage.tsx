import { useState } from 'react'
import { Gift } from 'lucide-react'
import { post } from '@/api/client'
import { keys, useAction, useItems, useMasterCharacters } from '@/api/queries'
import type { Item } from '@/api/types'
import { Badge } from '@/ui/Badge'
import { Button } from '@/ui/Button'
import { SelectField, TextField } from '@/ui/Field'
import { Avatar } from '@/ui/misc'
import { PageHeader, Panel } from '@/ui/Panel'
import { CrudPage, asString, int, options, text, type FieldDef } from './CrudPage'

const FIELDS: FieldDef[] = [
  { name: 'name', label: 'Nome', required: true, maxLength: 100 },
  { name: 'tipo', label: 'Tipo', required: true, placeholder: 'arma, armadura, consumível...' },
  { name: 'description', label: 'Descrição', type: 'textarea' },
  { name: 'buffs', label: 'Bônus', placeholder: 'Ex.: +2 força' },
  { name: 'nerfs', label: 'Penalidades', placeholder: 'Ex.: -1 agilidade' },
  { name: 'quantity', label: 'Quantidade máxima por personagem', type: 'number', min: 1, default: '1' },
  { name: 'image', label: 'Imagem (URL)', type: 'url' },
]

function GiveItem({ items }: { items: Item[] }) {
  const characters = useMasterCharacters()
  const [characterId, setCharacterId] = useState('')
  const [itemId, setItemId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const give = useAction(
    () => post(`/api/characters/${characterId}/inventory/add`, null, { item_id: Number(itemId), quantity: Math.max(1, Number(quantity) || 1) }),
    { invalidate: [keys.inventory(Number(characterId))], success: 'Item entregue. O jogador vê na hora.', failure: 'Não foi possível entregar' },
  )

  return (
    <Panel title="Entregar item" eyebrow="Inventário">
      <form
        className="grid gap-3 sm:grid-cols-[1fr_1fr_6rem_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault()
          give.mutate()
        }}
      >
        <SelectField
          label="Personagem"
          required
          value={characterId}
          onChange={(e) => setCharacterId(e.target.value)}
          options={(characters.data ?? []).map((c) => ({ value: c.id, label: c.codename ? `${c.codename} (${c.name})` : c.name }))}
        />
        <SelectField label="Item" required value={itemId} onChange={(e) => setItemId(e.target.value)} options={options(items)} />
        <TextField label="Qtd." type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <Button type="submit" icon={<Gift className="h-4 w-4" />} loading={give.isPending} disabled={!characterId || !itemId}>
          Entregar
        </Button>
      </form>
    </Panel>
  )
}

export function ItemsPage() {
  const items = useItems()
  return (
    <>
      <PageHeader title="Itens" subtitle="O catálogo de itens do mundo. Entregue itens aos personagens durante a sessão." />
      <div className="space-y-6">
        <GiveItem items={items.data ?? []} />
        <CrudPage<Item>
          title="Catálogo"
          singular="Item"
          query={items}
          queryKey={keys.items}
          endpoint="/api/items/"
          fields={FIELDS}
          toPayload={(v) => ({
            name: text(v.name),
            tipo: text(v.tipo),
            description: text(v.description),
            buffs: text(v.buffs),
            nerfs: text(v.nerfs),
            quantity: int(v.quantity) ?? 1,
            image: text(v.image),
          })}
          toForm={(item) => ({
            name: item.name,
            tipo: item.tipo,
            description: asString(item.description),
            buffs: asString(item.buffs),
            nerfs: asString(item.nerfs),
            quantity: asString(item.quantity ?? item.quantidade_maxima ?? 1),
            image: asString(item.image),
          })}
          searchText={(item) => `${item.name} ${item.tipo}`}
          renderItem={(item) => (
            <div className="flex gap-3">
              <Avatar src={item.image} name={item.name} />
              <div>
                <p className="flex flex-wrap items-center gap-2 font-semibold text-parchment">
                  {item.name}
                  <Badge>{item.tipo}</Badge>
                </p>
                {item.description && <p className="mt-0.5 text-sm text-parchment-muted">{item.description}</p>}
                <p className="mt-1 flex flex-wrap gap-2 text-xs">
                  {item.buffs && <span className="text-moss">+ {item.buffs}</span>}
                  {item.nerfs && <span className="text-blood">− {item.nerfs}</span>}
                </p>
              </div>
            </div>
          )}
        />
      </div>
    </>
  )
}
