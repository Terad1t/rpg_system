import { useEffect, useState } from 'react'

export function useCharacterViewWebSocket(characterId) {
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState([])

  useEffect(() => {
    if (!characterId) return
    const role = window.location.pathname.startsWith('/master') ? 'master' : (window.location.pathname.startsWith('/player') ? 'player' : null)
    const token = role ? localStorage.getItem(`token:${role}`) : localStorage.getItem('token')
    if (!token) return
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsBase = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.hostname}:8000`
    const wsUrl = `${wsBase}/api/ws/character-view/${characterId}`

    const sep = wsUrl.includes('?') ? '&' : '?'
    const wsWithToken = `${wsUrl}${sep}token=${encodeURIComponent(token)}`
    const ws = new WebSocket(wsWithToken)

    ws.onopen = () => setConnected(true)
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        setMessages((prev) => [...prev, msg])
      } catch (err) {
        console.error('Failed to parse character view ws message', err)
      }
    }
    ws.onerror = (err) => {
      console.error('Character view ws error', err)
      setConnected(false)
    }
    ws.onclose = () => setConnected(false)

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close()
    }
  }, [characterId])

  return { connected, messages }
}
