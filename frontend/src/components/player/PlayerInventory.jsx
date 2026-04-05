import { Card, Button } from '../common'

const MOCK_ITEMS = [
  { id: 1, name: 'Espada de Ferro', quantity: 1, rarity: 'comum', type: 'arma' },
  { id: 2, name: 'Armadura de Couro', quantity: 1, rarity: 'comum', type: 'armadura' },
  { id: 3, name: 'Poção de Vida', quantity: 5, rarity: 'comum', type: 'consumível' },
  { id: 4, name: 'Antídoto', quantity: 3, rarity: 'comum', type: 'consumível' },
  { id: 5, name: 'Moedas de Ouro', quantity: 250, rarity: 'comum', type: 'moeda' },
  { id: 6, name: 'Escudo de Aço', quantity: 1, rarity: 'raro', type: 'armadura' },
]

const rarityColors = {
  comum: 'text-gray-400 border-gray-600',
  incomum: 'text-green-400 border-green-600',
  raro: 'text-blue-400 border-blue-600',
  epico: 'text-purple-400 border-purple-600',
  lendario: 'text-orange-400 border-orange-600',
}

export default function PlayerInventory() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Card title="Inventário">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_ITEMS.map((item) => (
            <div
              key={item.id}
              className={`
                bg-dark rounded-lg p-4 border-2 cursor-pointer
                transition-all duration-200 hover:shadow-lg
                ${rarityColors[item.rarity] || rarityColors.comum}
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-white flex-1">{item.name}</h4>
                {item.quantity > 1 && (
                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                    x{item.quantity}
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary mb-3 capitalize">{item.type}</p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                >
                  Usar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                >
                  Vender
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Resumo */}
      <Card title="Resumo">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-dark rounded-lg">
            <p className="text-secondary text-sm mb-1">Total de Itens</p>
            <p className="text-2xl font-bold text-orange-500">
              {MOCK_ITEMS.reduce((sum, item) => sum + item.quantity, 0)}
            </p>
          </div>
          <div className="text-center p-3 bg-dark rounded-lg">
            <p className="text-secondary text-sm mb-1">Tipos</p>
            <p className="text-2xl font-bold text-orange-500">
              {new Set(MOCK_ITEMS.map(item => item.type)).size}
            </p>
          </div>
          <div className="text-center p-3 bg-dark rounded-lg">
            <p className="text-secondary text-sm mb-1">Peso</p>
            <p className="text-2xl font-bold text-orange-500">45/100</p>
          </div>
          <div className="text-center p-3 bg-dark rounded-lg">
            <p className="text-secondary text-sm mb-1">Espaço</p>
            <p className="text-2xl font-bold text-orange-500">9/20</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
