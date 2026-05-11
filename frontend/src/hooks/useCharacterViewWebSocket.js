import { useEffect, useState } from 'react'

export function useCharacterViewWebSocket(characterId) {
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState([])

  useEffect(() => {
    if (!characterId) return
    const token = localStorage.getItem('token')
    if (!token) return
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${wsProtocol}//${window.location.host}/api/ws/character-view/${characterId}`

    const ws = new WebSocket(wsUrl, ['bearer', token])

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
