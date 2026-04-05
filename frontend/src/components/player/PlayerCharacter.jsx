import { Card, StatBar } from '../common'

export default function PlayerCharacter({ character }) {
  const attributeLabels = {
    strength: 'Força',
    dexterity: 'Destreza',
    constitution: 'Constituição',
    intelligence: 'Inteligência',
    wisdom: 'Sabedoria',
    charisma: 'Carisma',
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Info Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-secondary text-sm mb-2">Personagem</p>
            <p className="text-2xl font-bold text-orange-500">{character.name}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-secondary text-sm mb-2">Raça</p>
            <p className="text-2xl font-bold text-orange-500">{character.race}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-secondary text-sm mb-2">Classe</p>
            <p className="text-2xl font-bold text-orange-500">{character.class}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-secondary text-sm mb-2">Nível</p>
            <p className="text-2xl font-bold text-orange-500">{character.level}</p>
          </div>
        </Card>
      </div>

      {/* Barras de Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Saúde">
          <StatBar
            label="Vida"
            current={character.hp}
            max={character.maxHp}
            variant="hp"
          />
          <StatBar
            label="Vigor"
            current={character.vigor}
            max={character.maxVigor}
            variant="vigor"
            width="100%"
          />
        </Card>
        <Card title="Experiência">
          <StatBar
            label="XP"
            current={character.xp}
            max={character.maxXp}
            variant="xp"
          />
          <div className="mt-4 p-3 bg-dark rounded-lg">
            <p className="text-secondary text-sm">
              {character.maxXp - character.xp} XP para próximo nível
            </p>
          </div>
        </Card>
      </div>

      {/* Atributos */}
      <Card title="Atributos">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(character.attributes).map(([key, value]) => (
            <div key={key} className="bg-dark rounded-lg p-3 text-center">
              <p className="text-secondary text-sm mb-1">{attributeLabels[key]}</p>
              <p className="text-2xl font-bold text-orange-500">{value}</p>
              <p className="text-xs text-secondary mt-1">
                ({value >= 15 ? '+' : ''}{Math.floor((value - 10) / 2)})
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
