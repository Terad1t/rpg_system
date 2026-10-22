import { Card, StatBar } from '../common'
import { parseEffects, remainingLabel } from '../../lib/effects'
import { assetUrl } from '../../services/api'

export const ATTRIBUTE_LABELS = {
  strength: 'Força',
  defense: 'Defesa',
  energy: 'Energia',
  healing: 'Cura',
  magic: 'Magia',
  mana: 'Mana',
  damage: 'Dano',
  intelligence: 'Inteligência',
  intellect: 'Intelecto',
  charisma: 'Carisma',
  hp: 'Vida',
  vigor: 'Vigor',
  agility: 'Agilidade',
  speed: 'Velocidade',
  investigation: 'Investigação',
  presence: 'Presença',
  occultism: 'Ocultismo',
}

function EffectList({ title, effects, tone }) {
  const styles =
    tone === 'buff'
      ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100'
      : 'border-orange-400/30 bg-orange-400/10 text-orange-100'
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.35em] text-slate-400">{title}</p>
      <ul className="flex flex-wrap gap-2">
        {effects.map((effect, index) => {
          const remaining = remainingLabel(effect.expiresAt)
          return (
            <li key={`${effect.name}-${index}`} className={`rounded-full border px-3 py-1 text-xs ${styles}`}>
              {effect.name}
              {remaining && <span className="ml-2 opacity-70">{remaining}</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function PlayerCharacter({ character }) {
  const attributeEntries = Object.entries(character.attributes || {})
  const raceName = typeof character.race === 'string' ? character.race : character.race?.name
  const raceDescription = typeof character.race === 'string' ? null : character.race?.description
  const buffs = parseEffects(character.buffs)
  const debuffs = parseEffects(character.debuffs)
  const portrait = assetUrl(character.portrait)

  return (
    <div className="w-full space-y-6">
      <Card className="overflow-hidden border border-cyan-400/20 bg-[#08111f]/90">
        <div className="flex gap-4">
          {portrait && <img src={portrait} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />}
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.5em] text-cyan-200/80">Ficha</p>
            <h2 className="mt-1 truncate text-2xl font-black uppercase tracking-[0.15em] text-white">{character.name}</h2>
            <p className="mt-1 text-sm text-orange-200">{character.codename || 'Sem codinome'}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-400">
              {raceName || 'Raça indefinida'} • {character.class || 'Classe indefinida'}
            </p>
          </div>
        </div>
        {raceDescription && <p className="mt-4 text-sm text-slate-300">{raceDescription}</p>}
      </Card>

      <Card title="Status" className="border border-white/10 bg-[#08111f]/90">
        <div className="space-y-5">
          <StatBar label="Vida" current={character.hp ?? 0} max={character.maxHp ?? 0} variant="hp" />
          <StatBar label="Mana" current={character.mana ?? 0} max={character.maxMana ?? 0} variant="mana" />
          {character.freePoints > 0 && (
            <p className="text-sm text-cyan-200">
              {character.freePoints} ponto(s) livre(s) para distribuir nos atributos.
            </p>
          )}
        </div>
      </Card>

      {attributeEntries.length > 0 && (
        <Card title="Atributos" className="border border-white/10 bg-[#08111f]/90">
          <dl className="grid grid-cols-2 gap-3">
            {attributeEntries.map(([key, value]) => (
              <div key={key} className="border border-white/10 bg-white/5 p-3">
                <dt className="text-[11px] uppercase tracking-[0.3em] text-slate-400">{ATTRIBUTE_LABELS[key] || key}</dt>
                <dd className="mt-1 text-2xl font-black text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {(buffs.length > 0 || debuffs.length > 0) && (
        <Card title="Efeitos ativos" className="border border-white/10 bg-[#08111f]/90">
          <div className="space-y-4">
            {buffs.length > 0 && <EffectList title="Buffs" effects={buffs} tone="buff" />}
            {debuffs.length > 0 && <EffectList title="Debuffs" effects={debuffs} tone="debuff" />}
          </div>
        </Card>
      )}
    </div>
  )
}
