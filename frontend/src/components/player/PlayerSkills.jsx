import { Card, Button } from '../common'

const MOCK_SKILLS = [
  {
    id: 1,
    name: 'Ataque Rápido',
    description: 'Realiza um ataque rápido com sua arma',
    cost: { hp: 0, vigor: 10 },
    damage: 15,
    cooldown: 0,
    level: 1,
  },
  {
    id: 2,
    name: 'Golpe Poderoso',
    description: 'Um ataque devastador que causa grande dano',
    cost: { hp: 0, vigor: 30 },
    damage: 40,
    cooldown: 5,
    level: 5,
  },
  {
    id: 3,
    name: 'Defesa de Ferro',
    description: 'Aumenta sua defesa temporariamente',
    cost: { hp: 0, vigor: 20 },
    damage: 0,
    cooldown: 3,
    level: 3,
    isDefensive: true,
  },
  {
    id: 4,
    name: 'Cura',
    description: 'Recupera HP do seu personagem',
    cost: { hp: 0, vigor: 25 },
    damage: 0,
    cooldown: 4,
    level: 2,
    isHealing: true,
  },
  {
    id: 5,
    name: 'Fúria Berserker',
    description: 'Entra em fúria, aumentando dano e velocidade',
    cost: { hp: 10, vigor: 40 },
    damage: 25,
    cooldown: 8,
    level: 10,
  },
]

export default function PlayerSkills() {
  return (
    <div className="w-full space-y-6">
      <div className="space-y-4">
        {MOCK_SKILLS.map((skill) => (
          <Card key={skill.id} className="border border-white/10 bg-[#08111f]/90 hover:shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-white">{skill.name}</h3>
                  <span className="rounded border border-orange-400/40 bg-orange-400/10 px-2 py-1 text-xs text-orange-200">
                    Nível {skill.level}
                  </span>
                </div>
                <p className="mb-4 text-slate-300">{skill.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded border border-white/10 bg-white/5 p-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Vigor</p>
                    <p className="text-lg font-bold text-cyan-200">
                      -{skill.cost.vigor}
                    </p>
                  </div>
                  {skill.cost.hp > 0 && (
                    <div className="rounded border border-white/10 bg-white/5 p-2">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Vida</p>
                      <p className="text-lg font-bold text-red-300">
                        -{skill.cost.hp}
                      </p>
                    </div>
                  )}
                  {skill.damage > 0 && (
                    <div className="rounded border border-white/10 bg-white/5 p-2">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Dano</p>
                      <p className="text-lg font-bold text-orange-200">
                        +{skill.damage}
                      </p>
                    </div>
                  )}
                  <div className="rounded border border-white/10 bg-white/5 p-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Recarga</p>
                    <p className="text-lg font-bold text-white">
                      {skill.cooldown}s
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="ml-4 whitespace-nowrap shadow-[0_0_18px_rgba(56,189,248,0.18)]"
              >
                Usar
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
