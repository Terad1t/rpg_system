import Card from './Card'

export default function ChartCard({ title = '', className = '', children }) {
  return (
    <Card title={title} className={`${className}`}>
      <div className="h-64 w-full">{children}</div>
    </Card>
  )
}
