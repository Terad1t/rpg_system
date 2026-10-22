import { useCallback, useState } from 'react'
import { useSocket } from './useSocket'

const MAX_MESSAGES = 50

/** Atualizações ao vivo da ficha (dono do personagem ou Master). */
export function useCharacterViewWebSocket(characterId) {
  const [messages, setMessages] = useState([])
  const handleMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message].slice(-MAX_MESSAGES))
  }, [])
  const { isConnected } = useSocket(characterId ? `/ws/character-view/${characterId}` : null, handleMessage)
  return { connected: isConnected, messages }
}
