import { useEffect, useState, useCallback } from "react";

export function useCharacterUpdates() {
  const [characterUpdates, setCharacterUpdates] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}/api/updates/ws`;

    const ws = new WebSocket(wsUrl, ['bearer', token]);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        // Filtrar apenas mensagens de atualização de personagem
        if (message?.type === 'character_update' || message?.data?.action === 'created' || 
            message?.data?.action === 'updated' || message?.data?.action === 'deleted') {
          setCharacterUpdates((prev) => {
            const next = [...prev, { ...message, timestamp: new Date().getTime() }];
            // Manter apenas as últimas 50 atualizações
            return next.length > 50 ? next.slice(next.length - 50) : next;
          });
        }
      } catch (err) {
        console.error("Erro ao processar atualização de personagem:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("[useCharacterUpdates] WebSocket error:", error);
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
  }, []);

  const clearUpdates = useCallback(() => {
    setCharacterUpdates([]);
  }, []);

  return { isConnected, characterUpdates, clearUpdates };
}
