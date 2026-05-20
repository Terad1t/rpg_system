import { useEffect, useState, useCallback } from "react";

function getRouteRole() {
  const path = window.location.pathname || "";
  if (path.startsWith("/master")) return "master";
  if (path.startsWith("/player")) return "player";
  return localStorage.getItem("active_role") || null;
}

export function useUserNotificationsWebSocket(userId) {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const routeRole = getRouteRole();
    const token = routeRole ? localStorage.getItem(`token:${routeRole}`) : localStorage.getItem("token");
    if (!token) return;
    const storedUser = routeRole ? localStorage.getItem(`user:${routeRole}`) : localStorage.getItem("user");
    let resolvedRole = routeRole;

    if (storedUser) {
      try {
        resolvedRole = JSON.parse(storedUser)?.role || resolvedRole || null;
      } catch {
        resolvedRole = resolvedRole || null;
      }
    }

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsBase = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.hostname}:8000`;
    // Fight invites, fight responses and character notifications all arrive on the per-user channel.
    const wsPath = `/ws/user-updates/${userId}`;
    const wsUrl = `${wsBase}${wsPath}`;

    const sep = wsUrl.includes('?') ? '&' : '?'
    const wsWithToken = `${wsUrl}${sep}token=${encodeURIComponent(token)}`
    const ws = new WebSocket(wsWithToken);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
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
