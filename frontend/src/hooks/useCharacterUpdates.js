import { useEffect, useState, useCallback } from "react";

export function useCharacterUpdates() {
  const [characterUpdates, setCharacterUpdates] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const role = window.location.pathname.startsWith('/master') ? 'master' : (window.location.pathname.startsWith('/player') ? 'player' : null)
    const token = role ? localStorage.getItem(`token:${role}`) : localStorage.getItem('token')
    if (!token) return;

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsBase = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.hostname}:8000`;
    const wsUrl = `${wsBase}/api/updates/ws`;

    const sep = wsUrl.includes('?') ? '&' : '?'
    const wsWithToken = `${wsUrl}${sep}token=${encodeURIComponent(token)}`
    const ws = new WebSocket(wsWithToken);

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
