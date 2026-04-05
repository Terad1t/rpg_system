import { useState, useEffect, useRef } from 'react'
import { Card, Input, Button } from '../common'
import websocket from '../../services/websocket'
import { useAuth } from '../../context/AuthContext'

const MOCK_MESSAGES = [
  { id: 1, author: 'Aragorn', message: 'Olá pessoal!', timestamp: '10:30', isOwn: false },
  { id: 2, author: 'Você', message: 'Oi! Como vai?', timestamp: '10:31', isOwn: true },
  { id: 3, author: 'Legolas', message: 'Tudo bem, e vocês?', timestamp: '10:32', isOwn: false },
]

export default function PlayerChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState(MOCK_MESSAGES)
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    // Conectar ao WebSocket
    const token = localStorage.getItem('token')
    if (token) {
      websocket.connect(token).then(() => {
        setIsConnected(true)
      }).catch((error) => {
        console.error('Erro ao conectar ao WebSocket:', error)
        setIsConnected(false)
      })

      // Listener para novas mensagens
      const unsubscribe = websocket.on('message', (data) => {
        const newMsg = {
          id: messages.length + 1,
          author: data.username || 'Desconhecido',
          message: data.message,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          isOwn: data.user_id === user?.id,
        }
        setMessages((prev) => [...prev, newMsg])
      })

      return () => {
        unsubscribe()
        websocket.disconnect()
      }
    }
  }, [user?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      websocket.send({
        message: newMessage,
      })
      setNewMessage('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      <Card className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-dark-border mb-4">
          <h3 className="text-lg font-bold text-orange-500">Chat Global</h3>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-secondary">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md rounded-lg px-4 py-2 ${
                  msg.isOwn
                    ? 'bg-orange-500 text-white rounded-br-none'
                    : 'bg-dark-secondary border border-dark-border text-white rounded-bl-none'
                }`}
              >
                {!msg.isOwn && (
                  <p className="text-xs font-semibold text-orange-400 mb-1">
                    {msg.author}
                  </p>
                )}
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs opacity-70 mt-1 text-right">{msg.timestamp}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem... (Enter para enviar)"
            className="flex-1 bg-dark border border-dark-border rounded-lg px-4 py-2 text-white placeholder-secondary focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            rows="3"
            disabled={!isConnected}
          />
          <Button
            variant="primary"
            onClick={handleSendMessage}
            disabled={!isConnected || !newMessage.trim()}
            className="self-end"
          >
            Enviar
          </Button>
        </div>
      </Card>
    </div>
  )
}
