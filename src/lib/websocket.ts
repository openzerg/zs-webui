import { AgentEvent } from './types'

type EventHandler = (event: AgentEvent) => void

export class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private handlers: Set<EventHandler> = new Set()
  private reconnectTimer: NodeJS.Timeout | null = null
  private reconnectAttempts = 0

  constructor(url: string) {
    this.url = url
  }

  connect() {
    if (this.ws) {
      this.ws.close()
    }

    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }
    }

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'agent_event') {
          this.handlers.forEach(handler => handler(msg.data))
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e)
      }
    }

    this.ws.onclose = () => {
      console.log('WebSocket disconnected')
      this.scheduleReconnect()
    }

    this.ws.onerror = (err) => {
      console.error('WebSocket error:', err)
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    this.reconnectAttempts++
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  subscribe(handler: EventHandler) {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

export function createWebSocketClient(): WebSocketClient | null {
  if (typeof window === 'undefined') return null
  
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8082/ws'
  return new WebSocketClient(wsUrl)
}