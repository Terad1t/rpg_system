import { useEffect, useState, useCallback } from "react";

export function useInventoryWebSocket(characterId) {
  const [inventory, setInventory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carrega inventário inicial
  const loadInventory = useCallback(async () => {
    if (!characterId) {
      setInventory([]);
      setLoading(false);
      return;
    }

    try {
      const role = window.location.pathname.startsWith('/master') ? 'master' : (window.location.pathname.startsWith('/player') ? 'player' : null)
      const token = role ? localStorage.getItem(`token:${role}`) : localStorage.getItem('token')
      const response = await fetch(`/api/characters/${characterId}/inventory/`, {
        headers: {
          Authorization: `Bearer ${token}`,
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
    if (!characterId) return;
    loadInventory();
  }, [loadInventory]);

  // Conecta ao WebSocket
  useEffect(() => {
    if (!characterId) return;

    const role = window.location.pathname.startsWith('/master') ? 'master' : (window.location.pathname.startsWith('/player') ? 'player' : null)
    const token = role ? localStorage.getItem(`token:${role}`) : localStorage.getItem('token')
    if (!token) {
      setLoading(false);
      return;
    }
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsBase = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.hostname}:8000`;
    const wsUrl = `${wsBase}/ws/inventory/${characterId}`;

    const sep = wsUrl.includes('?') ? '&' : '?'
    const wsWithToken = `${wsUrl}${sep}token=${encodeURIComponent(token)}`
    const ws = new WebSocket(wsWithToken);

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
