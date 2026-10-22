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

export default function StatsGrid({ overview = {}, stats = {} }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatItem label="Jogadores ativos" value={overview.players ?? 0} icon={<IconUsers className="h-9 w-9" />} />
      <StatItem label="Personagens" value={overview.characters ?? 0} icon={<IconUser className="h-9 w-9" />} />
      <StatItem label="Lutas" value={overview.fights ?? stats.fight_count ?? 0} icon={<IconBolt className="h-9 w-9" />} />
      <StatItem label="Itens" value={overview.items ?? 0} icon={<IconGem className="h-9 w-9" />} />
      <StatItem label="Dano dos jogadores" value={stats.total_player_damage ?? 0} icon={<IconSword className="h-9 w-9" />} />
    </div>
  )
}
