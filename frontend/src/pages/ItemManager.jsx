import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useUserNotificationsWebSocket } from "../hooks/useUserNotificationsWebSocket";

export default function ItemManager() {
  const { user } = useAuth();
  const { isConnected, notifications } = useUserNotificationsWebSocket(user?.id);
  const [items, setItems] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Buscar itens e personagens ao carregar
  useEffect(() => {
    Promise.all([
      fetch("/api/items")
        .then((res) => {
          if (!res.ok) throw new Error(`Erro ao buscar itens: ${res.status}`);
          return res.json();
        })
        .catch((err) => {
          console.error("Erro ao buscar itens:", err);
          return [];
        }),
      fetch("/api/characters", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Erro ao buscar personagens: ${res.status}`);
          return res.json();
        })
        .catch((err) => {
          console.error("Erro ao buscar personagens:", err);
          return [];
        }),
    ])
      .then(([itemsData, charsData]) => {
        setItems(itemsData || []);
        setCharacters(charsData || []);
      })
      .catch((err) => {
        console.error("Erro geral:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddItemToInventory = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!selectedCharacterId || !selectedItemId || quantity < 1) {
      setFormError("Preencha todos os campos corretamente");
      return;
    }

    try {
      const response = await fetch(
        `/api/inventario/add?character_id=${selectedCharacterId}&item_id=${selectedItemId}&quantity=${quantity}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao adicionar item ao inventário");
      }

      setSuccessMessage("Item adicionado ao inventário com sucesso!");
      setSelectedCharacterId("");
      setSelectedItemId("");
      setQuantity(1);
      setShowForm(false);

      // Recarregar itens após adicionar
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setFormError(err.message);
    }
  };

  if (loading)
    return <div className="text-secondary">Carregando dicionário de itens...</div>;
  if (error) return <div className="text-red-500">Erro: {error}</div>;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-orange-500">Dicionário de Itens</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded text-sm ${isConnected ? 'bg-green-900 text-green-100' : 'bg-red-900 text-red-100'}`}>
            <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {isConnected ? "Notificações Ativas" : "Desconectado"}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition"
          >
            {showForm ? "Cancelar" : "+ Adicionar Item ao Inventário"}
          </button>
        </div>
      </div>

      {/* Notificações em tempo real */}
      {notifications.length > 0 && (
        <div className="mb-6 space-y-2">
          {notifications.map((notif, idx) => (
            <div
              key={idx}
              className="bg-green-900 border border-green-500 text-green-100 px-4 py-3 rounded animate-pulse"
            >
              {notif.type === "inventory_update" && (
                <span>
                  Item adicionado em tempo real! {notif.data?.item_name}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formulário de Adição */}
      {showForm && (
        <div className="bg-dark-secondary border border-orange-500 rounded p-6 mb-6">
          <h3 className="text-lg font-bold text-orange-500 mb-4">
            Adicionar Item ao Inventário
          </h3>

          {formError && (
            <div className="bg-red-900 border border-red-500 text-red-100 px-4 py-3 rounded mb-4">
              {formError}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-900 border border-green-500 text-green-100 px-4 py-3 rounded mb-4">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleAddItemToInventory} className="space-y-4">
            <div>
              <label className="block text-secondary text-sm mb-2">
                Personagem
              </label>
              <select
                value={selectedCharacterId}
                onChange={(e) => setSelectedCharacterId(e.target.value)}
                className="w-full bg-dark border border-dark-border rounded px-3 py-2 text-white focus:border-orange-500 outline-none"
              >
                <option value="">Selecione um personagem</option>
                {characters.map((char) => (
                  <option key={char.id} value={char.id}>
                    {char.name} ({char.tipo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-secondary text-sm mb-2">
                Item
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full bg-dark border border-dark-border rounded px-3 py-2 text-white focus:border-orange-500 outline-none"
              >
                <option value="">Selecione um item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.tipo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-secondary text-sm mb-2">
                Quantidade
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-dark border border-dark-border rounded px-3 py-2 text-white focus:border-orange-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition"
            >
              Adicionar ao Inventário
            </button>
          </form>
        </div>
      )}

      {/* Lista de Itens */}
      <h3 className="text-xl font-bold text-orange-500 mb-4 mt-8">
        Itens Disponíveis ({items.length})
      </h3>
      {items.length === 0 && (
        <div className="text-secondary">Nenhum item cadastrado.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="border border-dark-border rounded p-4 bg-dark-secondary hover:bg-dark-tertiary transition"
          >
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                className="h-24 w-full object-cover rounded mb-2"
              />
            )}
            <h4 className="font-bold text-orange-500">{item.name}</h4>
            <p className="text-sm text-secondary">Tipo: {item.tipo}</p>
            <p className="text-sm text-secondary mt-1">
              Máximo: <span className="font-semibold">{item.quantidade_maxima}</span>
            </p>
            {item.description && (
              <p className="text-xs text-gray-400 mt-2">{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
