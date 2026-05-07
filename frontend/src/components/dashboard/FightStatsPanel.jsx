import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import ChartCard from '../common/ChartCard'
import { Card } from '../common'

function RankingList({ title, items = [] }) {
  return (
    <Card title={title} className="border border-white/10 bg-[#08111f]/90">
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-300">Sem dados suficientes.</p>
        ) : (
          items.map((item, index) => (
            <div key={`${title}-${item.name}-${index}`} className="flex items-center justify-between gap-4 border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">#{index + 1}</p>
                <p className="text-base font-semibold text-white">{item.name}</p>
              </div>
              <p className="text-lg font-black text-cyan-200">{item.value}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

export default function FightStatsPanel({ stats }) {
  const s = stats || {}
  const damageData = s.damage_chart || []
  const healingData = s.healing_chart || []
  const evolutionData = s.evolution || []

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Fights" className="border border-white/10 bg-[#08111f]/90">
          <p className="text-4xl font-black text-cyan-200">{s.fight_count ?? 0}</p>
          <p className="mt-2 text-sm text-slate-300">Sessões registradas</p>
        </Card>
        <Card title="Dano Jogadores" className="border border-white/10 bg-[#08111f]/90">
          <p className="text-4xl font-black text-orange-200">{s.total_player_damage ?? 0}</p>
          <p className="mt-2 text-sm text-slate-300">Total acumulado</p>
        </Card>
        <Card title="Cura Jogadores" className="border border-white/10 bg-[#08111f]/90">
          <p className="text-4xl font-black text-cyan-200">{s.total_player_healing ?? 0}</p>
          <p className="mt-2 text-sm text-slate-300">Total acumulado</p>
        </Card>
        <Card title="Média Geral" className="border border-white/10 bg-[#08111f]/90">
          <p className="text-4xl font-black text-white">{s.average_session?.player_damage ?? 0}</p>
          <p className="mt-2 text-sm text-slate-300">Média de dano dos jogadores por fight</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Dano por fight">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={damageData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#2a2a2a" />
              <XAxis dataKey="session" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip />
              <Legend />
              <Bar dataKey="players" fill="#38bdf8" />
              <Bar dataKey="enemies" fill="#ff7a18" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Cura por fight">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={healingData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#2a2a2a" />
              <XAxis dataKey="session" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="players" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="enemies" stroke="#ff7a18" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <RankingList title="Ranking de jogadores" items={s.player_ranking || []} />
        <RankingList title="Ranking de inimigos" items={s.enemy_ranking || []} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Histórico de fights" className="border border-white/10 bg-[#08111f]/90">
          <div className="space-y-3">
            {(s.history || []).length === 0 ? (
              <p className="text-sm text-slate-300">Nenhuma fight registrada.</p>
            ) : (
              (s.history || []).map((fight) => (
                <div key={fight.id} className="border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{fight.status}</p>
                      <p className="mt-2 text-lg font-semibold text-white">{fight.name}</p>
                      <p className="mt-2 text-sm text-slate-300">{fight.started_at || 'Sem data'}</p>
                    </div>
                    <p className="text-sm text-cyan-200">{fight.duration_seconds}s</p>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <span className="text-xs uppercase tracking-[0.3em] text-orange-200">Dano P: {fight.player_damage}</span>
                    <span className="text-xs uppercase tracking-[0.3em] text-orange-200">Dano I: {fight.enemy_damage}</span>
                    <span className="text-xs uppercase tracking-[0.3em] text-cyan-200">Cura P: {fight.player_healing}</span>
                    <span className="text-xs uppercase tracking-[0.3em] text-cyan-200">Cura I: {fight.enemy_healing}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <ChartCard title="Evolução de desempenho">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolutionData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#2a2a2a" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="players" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="enemies" stroke="#ff7a18" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
