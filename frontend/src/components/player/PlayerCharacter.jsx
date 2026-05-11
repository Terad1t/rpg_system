import { Card, StatBar } from '../common'

export default function PlayerCharacter({ character }) {
  const attributeLabels = {
    strength: 'Força',
    dexterity: 'Destreza',
    constitution: 'Constituição',
    intelligence: 'Inteligência',
    wisdom: 'Sabedoria',
    charisma: 'Carisma',
    hp: 'Vida',
    vigor: 'Vigor',
    agility: 'Agilidade',
    speed: 'Velocidade',
    intellect: 'Intelecto',
    investigation: 'Investigação',
    presence: 'Presença',
    occultism: 'Ocultismo',
  }

  const attributeEntries = Object.entries(character.attributes || {})
  const raceName = typeof character.race === 'string' ? character.race : character.race?.name
  const raceDescription = typeof character.race === 'string' ? null : character.race?.description
  const raceImage = typeof character.race === 'string' ? null : character.race?.image
  const buffs = typeof character.buffs === 'string' ? character.buffs : character.buffs ? JSON.stringify(character.buffs) : ''
  const debuffs = typeof character.debuffs === 'string' ? character.debuffs : character.debuffs ? JSON.stringify(character.debuffs) : ''

  return (
    <div className="w-full space-y-6">
      <Card className="overflow-hidden border border-cyan-400/20 bg-[#08111f]/90 shadow-[0_0_40px_rgba(0,0,0,0.25)]">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(56,189,248,0.14),transparent_42%,rgba(255,122,24,0.14))]" />
          <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-cyan-300 via-sky-500 to-orange-400" />
          <div className="relative grid gap-6 p-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)] xl:p-8">
            <div className="space-y-5">
              <p className="text-[11px] uppercase tracking-[0.5em] text-cyan-200/80">Character File</p>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Personagem</p>
                  <h2 className="mt-2 text-4xl font-black uppercase tracking-[0.2em] text-white">
                    {character.name}
                  </h2>
                </div>
                <span className="border border-orange-400/40 bg-orange-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-orange-200">
                  Lv {character.level}
                </span>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                {character.description || 'Nenhuma descrição registrada para este personagem.'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Raça</p>
                <p className="mt-2 text-xl font-bold uppercase tracking-[0.2em] text-white">{raceName}</p>
                {raceDescription && <p className="mt-2 text-sm text-slate-300">{raceDescription}</p>}
              </div>
              <div className="border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Classe</p>
                <p className="mt-2 text-xl font-bold uppercase tracking-[0.2em] text-cyan-200">{character.class}</p>
              </div>
              <div className="border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Codinome</p>
                <p className="mt-2 text-lg font-semibold text-orange-200">{character.codename || 'Não definido'}</p>
              </div>
              <div className="border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Nível</p>
                <p className="mt-2 text-3xl font-black text-white">{character.level}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card title="Status Operacional" className="border border-white/10 bg-[#08111f]/90">
          <div className="space-y-5">
            <StatBar label="Vida" current={character.hp} max={character.maxHp} variant="hp" />
            <StatBar label="Mana" current={character.mana} max={character.maxMana} variant="mana" width="100%" />
            <StatBar label="XP" current={character.xp} max={character.maxXp} variant="xp" />
          </div>
        </Card>

        <Card title="Resumo Tático" className="border border-white/10 bg-[#08111f]/90">
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Personagem</p>
              <p className="mt-2 text-base font-semibold text-white">{character.name}</p>
            </div>
            <div className="border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Progresso</p>
              <p className="mt-2 text-base font-semibold text-cyan-200">
                {Math.max(0, character.maxXp - character.xp)} XP restantes
              </p>
            </div>
            <div className="border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Raça</p>
              <p className="mt-2 text-base font-semibold text-white">{raceName}</p>
            </div>
            <div className="border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Classe</p>
              <p className="mt-2 text-base font-semibold text-orange-200">{character.class}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Atributos" className="border border-white/10 bg-[#08111f]/90">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {attributeEntries.map(([key, value]) => {
            const modifier = Math.floor((value - 10) / 2)
            const fill = Math.max(18, Math.min(100, (value / 25) * 100))

            return (
              <div key={key} className="relative overflow-hidden border border-white/10 bg-white/5 p-4">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300 via-sky-400 to-orange-400" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">{attributeLabels[key] || key}</p>
                    <p className="mt-3 text-3xl font-black text-white">{value}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-[#0c1528] px-3 py-1 text-xs font-semibold text-cyan-200">
                    {modifier >= 0 ? '+' : ''}{modifier}
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#0c1528]">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-300 via-sky-400 to-orange-400"
                    style={{ width: `${fill}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {(buffs || debuffs) && (
        <Card title="Efeitos Ativos" className="border border-white/10 bg-[#08111f]/90">
          <div className="grid gap-4 md:grid-cols-2">
            {buffs && (
              <div className="border border-cyan-400/20 bg-cyan-400/10 p-4 text-cyan-100">
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">Buffs</p>
                <p className="mt-2 text-sm whitespace-pre-wrap">{buffs}</p>
              </div>
            )}
            {debuffs && (
              <div className="border border-orange-400/20 bg-orange-400/10 p-4 text-orange-100">
                <p className="text-xs uppercase tracking-[0.35em] text-orange-200">Debuffs</p>
                <p className="mt-2 text-sm whitespace-pre-wrap">{debuffs}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {(character.current_map || raceImage) && (
        <Card title="Informações Adicionais" className="border border-white/10 bg-[#08111f]/90">
          <div className="grid gap-4 md:grid-cols-2">
            {raceImage && (
              <div className="overflow-hidden border border-white/10 bg-white/5">
                <img src={raceImage} alt={raceName || character.name} className="h-56 w-full object-cover" />
              </div>
            )}
            {character.current_map && (
              <div className="border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Localização Atual</p>
                <p className="mt-2 text-xl font-bold uppercase tracking-[0.2em] text-cyan-200">
                  {character.current_map.name}
                </p>
                <p className="mt-2 text-sm text-slate-300">{character.current_map.description || 'Sem descrição.'}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.35em] text-orange-200">{character.current_map.map_type}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
