import Card from '../common/Card'

import { IconBolt, IconGem, IconSword, IconUser, IconUsers } from '../common/Icons'

function StatItem({ label, value, icon }) {
  return (
    <Card className="p-4 flex items-center gap-4" title="">
      <div className="text-orange-500">{icon}</div>
      <div>
        <div className="text-sm text-secondary">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </Card>
  )
}

export default function StatsGrid({ stats }) {
  const s = stats || {}

  const data = {
    players: s.players ?? 128,
    characters: s.characters ?? 342,
    fights: s.fight_count ?? s.fights ?? 12,
    items: s.items ?? 475,
    damage: s.total_player_damage ?? 0,
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      <StatItem label="Jogadores" value={data.players} icon={<IconUsers className="w-9 h-9" />} />
      <StatItem label="Personagens" value={data.characters} icon={<IconUser className="w-9 h-9" />} />
      <StatItem label="Fights" value={data.fights} icon={<IconBolt className="w-9 h-9" />} />
      <StatItem label="Itens" value={data.items} icon={<IconGem className="w-9 h-9" />} />
      <StatItem label="Dano jogador" value={data.damage} icon={<IconSword className="w-9 h-9" />} />
    </div>
  )
}
