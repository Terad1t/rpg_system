import { useEffect, useState, useCallback } from "react";

export function useInventoryWebSocket(characterId) {
  const [inventory, setInventory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carrega inventário inicial
  const loadInventory = useCallback(async () => {
    try {
      const response = await fetch(`/api/characters/${characterId}/inventory/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Resposta não é JSON: ${contentType}`);
      }
      const data = await response.json();
      setInventory(data);
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar inventário:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Conecta ao WebSocket
  useEffect(() => {
    if (!characterId) return;

    const token = localStorage.getItem("access_token");
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/inventory/${characterId}?token=${token}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === "inventory_update") {
          const { action, item_id, item_name, quantity } = message;

          setInventory((prev) => {
            if (action === "added") {
              const existing = prev.find((inv) => inv.item?.id === item_id);
              if (existing) {
                return prev.map((inv) =>
                  inv.item?.id === item_id
                    ? { ...inv, quantidade: inv.quantidade + quantity }
                    : inv
                );
              } else {
                return [
                  ...prev,
                  {
                    item_id,
                    item: { id: item_id, name: item_name },
                    quantidade: quantity,
                  },
                ];
              }
            } else if (action === "removed") {
              return prev
                .map((inv) =>
                  inv.item?.id === item_id
                    ? { ...inv, quantidade: inv.quantidade - quantity }
                    : inv
                )
                .filter((inv) => inv.quantidade > 0);
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Erro ao processar mensagem WebSocket:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [characterId]);

  return { inventory, isConnected, loading, error, reloadInventory: loadInventory };
}
