import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useInventoryWebSocket } from "../hooks/useInventoryWebSocket";

export default function PlayerInventory() {
  const { user } = useAuth();
  const [characterId, setCharacterId] = useState(null);
  const { inventory, isConnected, loading, error } = useInventoryWebSocket(characterId);

  useEffect(() => {
    // Primeiro, buscar o personagem do jogador
    if (!user?.user_id) return;

    fetch(`/api/my-characters`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Erro HTTP ${res.status}: ${res.statusText}`);
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(`Resposta não é JSON: ${contentType}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.length > 0) {
          setCharacterId(data[0].id);
        }
      })
      .catch((err) => console.error("Erro ao buscar personagens:", err));
  }, [user]);

  if (loading) return <div className="text-secondary">Carregando inventário...</div>;
  if (error) return <div className="text-red-500">Erro: {error}</div>;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-orange-500">Meu Inventário</h2>
        <div className={`flex items-center gap-2 px-3 py-1 rounded text-sm ${isConnected ? 'bg-green-900 text-green-100' : 'bg-red-900 text-red-100'}`}>
          <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          {isConnected ? "Conectado" : "Desconectado"}
        </div>
      </div>
      
      {!characterId && (
        <div className="bg-dark-secondary border border-orange-500 rounded p-4 text-secondary">
          Você não possui um personagem criado ainda.
        </div>
      )}

      {characterId && inventory.length === 0 && (
        <div className="bg-dark-secondary border border-dark-border rounded p-4 text-secondary">
          Seu inventário está vazio.
        </div>
      )}

      {characterId && inventory.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventory.map((inv) => (
            <div
              key={inv.id}
              className="border border-dark-border rounded p-4 bg-dark-secondary hover:bg-dark-tertiary transition"
            >
              {inv.item?.image && (
                <img
                  src={inv.item.image}
                  alt={inv.item.name}
                  className="h-24 w-full object-cover rounded mb-2"
                />
              )}
              <h3 className="font-bold text-orange-500">{inv.item?.name}</h3>
              <p className="text-sm text-secondary">Tipo: {inv.item?.tipo}</p>
              <p className="text-sm text-secondary mt-1">
                Quantidade: <span className="font-semibold">{inv.quantidade}</span>
              </p>
              {inv.item?.description && (
                <p className="text-xs text-gray-400 mt-2">{inv.item.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
