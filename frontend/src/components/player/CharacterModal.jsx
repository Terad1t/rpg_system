import { useEffect, useState } from 'react'
import { Button, Card } from '../common'
import api from '../../services/api'
import { useCharacterViewWebSocket } from '../../hooks/useCharacterViewWebSocket'

export default function CharacterModal({ characterId, open, onClose }) {
  const [data, setData] = useState(null)
  const { connected, messages } = useCharacterViewWebSocket(characterId)

  useEffect(() => {
    if (!open || !characterId) return
    let mounted = true
    api
      .get(`/api/player-panel/characters/${characterId}/view`)
      .then((res) => {
        if (!mounted) return
        setData(res.data)
      })
      .catch((err) => {
        console.error('Erro ao carregar ficha:', err)
        setData({ error: 'Não foi possível carregar a ficha.' })
      })

    return () => {
      mounted = false
    }
  }, [open, characterId])

  useEffect(() => {
    if (!messages || messages.length === 0) return
    const last = messages[messages.length - 1]
    if (last?.type === 'character_update' || last?.type === 'inventory_update' || last?.type === 'character_applied') {
      // Atualiza a visão com o payload parcial
      setData((prev) => ({ ...(prev || {}), _realtime: last }))
    }
  }, [messages])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Ficha do Personagem</h2>
              <p className="text-sm text-slate-300">Visualização rápida</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">WS: {connected ? 'on' : 'off'}</span>
              <Button variant="ghost" onClick={onClose}>Fechar</Button>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {!data && <p className="text-sm text-slate-300">Carregando...</p>}
            {data?.message && <p className="text-sm text-slate-300">{data.message}</p>}
            {data?.error && <p className="text-sm text-red-400">{data.error}</p>}

            {data && !data.message && !data.error && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="h-48 w-full overflow-hidden border border-white/10 bg-[#0c1528]">
                    {data.portrait ? (
                      <img src={data.portrait} alt={data.codename || data.name || 'Personagem'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.35em] text-slate-400">Sem imagem</div>
                    )}
                  </div>

                  <div className="mt-3 space-y-1">
                    <h3 className="text-lg font-semibold text-white">{data.codename || data.name}</h3>
                    <p className="text-sm text-slate-300">{data.class || ''} • {data.race || ''}</p>
                    {data.hp !== undefined && <p className="text-sm text-slate-300">HP: {data.hp}/{data.maxHp}</p>}
                    {data.mana !== undefined && <p className="text-sm text-slate-300">Mana: {data.mana}/{data.maxMana}</p>}
                    {data.buffs && <p className="text-sm text-cyan-200">Buffs: {data.buffs}</p>}
                    {data.debuffs && <p className="text-sm text-orange-200">Debuffs: {data.debuffs}</p>}
                    {data.xp !== undefined && <p className="text-sm text-slate-300">XP: {data.xp}/{data.maxXp}</p>}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm uppercase text-slate-400">Descrição</h4>
                  <p className="mt-2 text-sm text-slate-300">{data.description || 'Sem descrição.'}</p>

                  {data.attributes && (
                    <div className="mt-4">
                      <h4 className="text-sm uppercase text-slate-400">Atributos</h4>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        {Object.entries(data.attributes).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between border border-white/5 px-3 py-2">
                            <span className="text-sm text-slate-300">{k}</span>
                            <strong className="text-sm text-white">{v}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.inventory && (
                    <div className="mt-4">
                      <h4 className="text-sm uppercase text-slate-400">Inventário</h4>
                      <ul className="mt-2 space-y-2">
                        {data.inventory.map((entry) => (
                          <li key={entry.id} className="text-sm text-slate-300">{entry.item?.name} x{entry.quantidade}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
