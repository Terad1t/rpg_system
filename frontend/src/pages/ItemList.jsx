import { useEffect, useState } from "react";

export default function ItemList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/items")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar itens");
        return res.json();
      })
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Carregando itens...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Itens</h2>
      <ul className="space-y-2">
        {items.length === 0 && <li>Nenhum item cadastrado.</li>}
        {items.map((item) => (
          <li key={item.id} className="border rounded p-2">
            <div className="font-semibold">{item.name}</div>
            <div className="text-sm text-gray-600">Tipo: {item.tipo}</div>
            {item.description && <div className="text-sm">{item.description}</div>}
            {item.image && (
              <img src={item.image} alt={item.name} className="h-12 mt-1" />
            )}
            <div className="text-xs text-gray-400">Máx: {item.quantidade_maxima}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
