import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import ChartCard from '../common/ChartCard'

const sampleData = [
  { date: '01/04', players: 12 },
  { date: '02/04', players: 18 },
  { date: '03/04', players: 22 },
  { date: '04/04', players: 30 },
  { date: '05/04', players: 27 },
  { date: '06/04', players: 35 },
]

export default function PlayerGrowthChart({ data }) {
  const chartData = data || sampleData

  return (
    <ChartCard title="Crescimento de jogadores">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#2a2a2a" />
          <XAxis dataKey="date" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip />
          <Line type="monotone" dataKey="players" stroke="#FF8C00" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
