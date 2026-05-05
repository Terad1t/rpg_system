import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import ChartCard from '../common/ChartCard'

const sampleData = [
  { category: 'Armas', count: 120 },
  { category: 'Armaduras', count: 80 },
  { category: 'Consumíveis', count: 240 },
  { category: 'Artefatos', count: 35 },
]

export default function ItemsBarChart({ data }) {
  const chartData = data || sampleData

  return (
    <ChartCard title="Itens por categoria">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#2a2a2a" />
          <XAxis dataKey="category" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip />
          <Bar dataKey="count" fill="#60A5FA" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
