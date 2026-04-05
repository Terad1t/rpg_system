export default function StatBar({
  label,
  current,
  max,
  variant = 'hp',
  width = '100%'
}) {
  const percentage = (current / max) * 100

  const colors = {
    hp: {
      bar: 'bg-red-600',
      text: 'text-red-500',
    },
    vigor: {
      bar: 'bg-blue-600',
      text: 'text-blue-500',
    },
    mana: {
      bar: 'bg-purple-600',
      text: 'text-purple-500',
    },
    xp: {
      bar: 'bg-green-600',
      text: 'text-green-500',
    }
  }

  const color = colors[variant] || colors.hp

  return (
    <div style={{ width }}>
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-semibold text-white">{label}</label>
        <span className={`text-sm font-bold ${color.text}`}>
          {current} / {max}
        </span>
      </div>
      <div className="w-full bg-dark-secondary rounded-full h-5 border border-dark-border overflow-hidden">
        <div
          className={`${color.bar} h-full rounded-full transition-all duration-300 flex items-center justify-center`}
          style={{ width: `${percentage}%` }}
        >
          {percentage > 20 && (
            <span className="text-xs font-bold text-white drop-shadow-md">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
