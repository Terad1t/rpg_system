import { useEffect, useState, useCallback } from "react";

export function useUserNotificationsWebSocket(userId) {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!userId) return;

    const token = localStorage.getItem("access_token");
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/user-updates/${userId}?token=${token}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setNotifications(prev => [...prev, message]);
        
        // Auto-remove notificação após 5 segundos
        setTimeout(() => {
          setNotifications(prev => prev.slice(1));
        }, 5000);
      } catch (err) {
        console.error("Erro ao processar notificação:", err);
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
  }, [userId]);

  return { isConnected, notifications };
}
