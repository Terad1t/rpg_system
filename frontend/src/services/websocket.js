class WebSocketService {
  constructor() {
    this.ws = null
    this.url = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000'
    this.listeners = {}
  }

  connect(token, path = '/api/chat/ws') {
    return new Promise((resolve, reject) => {
      try {
        if (!token) {
          reject(new Error('Token ausente'))
          return
        }

        // Avoid sending token via Sec-WebSocket-Protocol (some browsers require server to echo it).
        // Use query param instead so server can read it from the handshake headers or query.
        const sep = path.includes('?') ? '&' : '?'
        const urlWithToken = `${this.url}${path}${sep}token=${encodeURIComponent(token)}`
        this.ws = new WebSocket(urlWithToken)

        this.ws.onopen = () => {
          console.log('WebSocket conectado')
          resolve()
        }

        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data)
          this.emit('message', data)
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket erro:', error)
          reject(error)
        }

        this.ws.onclose = () => {
          console.log('WebSocket desconectado')
          this.emit('disconnect')
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket não está conectado')
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)

    // Retorna função para remover listener
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data))
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }
}

export default new WebSocketService()
