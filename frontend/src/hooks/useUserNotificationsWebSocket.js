import { useEffect, useState, useCallback } from "react";

export function useUserNotificationsWebSocket(userId) {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    if (!userId) {
      console.log('[useUserNotificationsWebSocket] userId não definido, pulando...')
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.log('[useUserNotificationsWebSocket] Token não encontrado, pulando...')
      return;
    }
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}/api/updates/ws`;

    console.log('[useUserNotificationsWebSocket] Conectando WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl, ['bearer', token]);

    ws.onopen = () => {
      console.log('[useUserNotificationsWebSocket] WebSocket conectado com sucesso');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[useUserNotificationsWebSocket] Nova notificação recebida:', message);
        setNotifications((prev) => {
          const next = [...prev, message];
          // Evita crescer indefinidamente
          return next.length > 50 ? next.slice(next.length - 50) : next;
        });
      } catch (err) {
        console.error("Erro ao processar notificação:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("[useUserNotificationsWebSocket] WebSocket error:", error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('[useUserNotificationsWebSocket] WebSocket desconectado');
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [userId]);

  return { isConnected, notifications, clearNotifications };
}
