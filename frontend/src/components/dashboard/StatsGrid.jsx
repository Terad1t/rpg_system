import Card from '../common/Card'

function StatItem({ label, value, icon }) {
  return (
    <Card className="p-4 flex items-center gap-4" title="">
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-sm text-secondary">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </Card>
  )
}

export default function StatsGrid({ stats = {} }) {
  const data = {
    players: stats.players ?? 128,
    characters: stats.characters ?? 342,
    activeSessions: stats.activeSessions ?? 12,
    items: stats.items ?? 475,
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatItem label="Jogadores" value={data.players} icon="👥" />
      <StatItem label="Personagens" value={data.characters} icon="🧙" />
      <StatItem label="Sessões ativas" value={data.activeSessions} icon="⚡" />
      <StatItem label="Itens" value={data.items} icon="💎" />
    </div>
  )
}
