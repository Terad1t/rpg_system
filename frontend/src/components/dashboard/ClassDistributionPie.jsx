import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import ChartCard from '../common/ChartCard'

const COLORS = ['#FF8C00', '#FFB86C', '#60A5FA', '#A78BFA', '#34D399']

const sampleData = [
  { name: 'Guerreiro', value: 40 },
  { name: 'Mago', value: 25 },
  { name: 'Ladino', value: 15 },
  { name: 'Clérigo', value: 12 },
  { name: 'Outro', value: 8 },
]

export default function ClassDistributionPie({ data }) {
  const chartData = data || sampleData

  return (
    <ChartCard title="Distribuição por classe">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label />
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
