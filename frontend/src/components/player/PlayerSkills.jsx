import { useEffect, useState } from 'react'
import { Card } from '../common'
import api, { errorMessage } from '../../services/api'

const TYPE_LABELS = { race: 'Raça', class: 'Classe', item: 'Item' }

function SkillStat({ label, value, className = 'text-white' }) {
  return (
    <div className="rounded border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className={`text-base font-bold ${className}`}>{value}</p>
    </div>
  )
}

/** Habilidades atribuídas pelo mestre ao personagem. */
export default function PlayerSkills({ characterId }) {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!characterId) return undefined
    let active = true
    setLoading(true)
    api
      .get(`/api/characters/${characterId}/habilidades/`)
      .then((response) => {
        if (active) {
          setSkills(response.data || [])
          setError(null)
        }
      })
      .catch((err) => active && setError(errorMessage(err, 'Não foi possível carregar as habilidades.')))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [characterId])

  return (
    <Card title="Habilidades" className="border border-white/10 bg-[#08111f]/90">
      {loading ? (
        <p className="text-sm text-slate-400">Carregando habilidades...</p>
      ) : error ? (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : skills.length === 0 ? (
        <p className="rounded border border-dashed border-white/10 p-4 text-sm text-slate-400">
          Nenhuma habilidade atribuída ainda.
        </p>
      ) : (
        <ul className="space-y-3">
          {skills.map(({ id, habilidade }) => (
            <li key={id} className="border border-white/10 bg-[#0c1528] p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-semibold text-white">{habilidade?.name}</h4>
                <span className="rounded border border-orange-400/40 bg-orange-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.25em] text-orange-200">
                  {TYPE_LABELS[habilidade?.tipo] || habilidade?.tipo}
                </span>
              </div>
              {habilidade?.efeitos_atributos && <p className="mt-2 text-sm text-slate-300">{habilidade.efeitos_atributos}</p>}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <SkillStat label="Dano" value={habilidade?.dano_base ?? 0} className="text-orange-200" />
                <SkillStat label="Vigor" value={`-${habilidade?.custo_vigor ?? 0}`} className="text-cyan-200" />
                <SkillStat label="Vida" value={`-${habilidade?.custo_vida ?? 0}`} className="text-red-300" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
