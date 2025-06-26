import { WebSocketServer, WebSocket } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import { Server } from 'http'
import { DebugMessage, ConsoleLogEntry, ClientInfo } from './types.js'

export class DebugWebSocketServer {
  private wss: WebSocketServer
  private clients = new Map<string, WebSocket>()
  private debuggers = new Set<WebSocket>()
  private clientInfo = new Map<string, ClientInfo>()
  private logHistory = new Map<string, ConsoleLogEntry[]>()

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    })

    this.wss.on('connection', this.handleConnection.bind(this))
    console.log('WebSocket server initialized on /ws')
  }

  private handleConnection(ws: WebSocket, req: Request) {
    const url = new URL(req.url!, `http://${req.headers.host}`)
    const clientType = url.searchParams.get('type') || 'client'
    const sessionId = url.searchParams.get('sessionId')

    console.log(`New ${clientType} connection`, { sessionId })

    if (clientType === 'debugger') {
      this.handleDebuggerConnection(ws)
    } else {
      this.handleClientConnection(ws, sessionId)
    }

    ws.on('close', () => {
      console.log(`${clientType} disconnected`, { sessionId })
      if (clientType === 'debugger') {
        this.debuggers.delete(ws)
      } else if (sessionId) {
        this.clients.delete(sessionId)
        this.clientInfo.delete(sessionId)
      }
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
    })
  }

  private handleDebuggerConnection(ws: WebSocket) {
    this.debuggers.add(ws)

    // Send current client list and log history
    const clientList = Array.from(this.clientInfo.values())
    ws.send(JSON.stringify({
      type: 'client_list',
      data: clientList
    }))

    // Send log history for all sessions
    for (const [sessionId, logs] of this.logHistory.entries()) {
      for (const log of logs) {
        ws.send(JSON.stringify({
          type: 'console_log',
          sessionId,
          data: log
        }))
      }
    }
  }

  private handleClientConnection(ws: WebSocket, sessionId: string | null) {
    if (!sessionId) {
      sessionId = uuidv4()
    }

    this.clients.set(sessionId, ws)
    this.clientInfo.set(sessionId, {
      sessionId,
      connectedAt: Date.now()
    })

    if (!this.logHistory.has(sessionId)) {
      this.logHistory.set(sessionId, [])
    }

    // Notify debuggers of new client
    this.broadcastToDebuggers({
      type: 'client_connected',
      data: this.clientInfo.get(sessionId)!
    })

    ws.on('message', (data) => {
      try {
        const message: DebugMessage = JSON.parse(data.toString())
        this.handleClientMessage(sessionId!, message)
      } catch (error) {
        console.error('Failed to parse message:', error)
      }
    })
  }

  private handleClientMessage(sessionId: string, message: DebugMessage) {
    switch (message.type) {
      case 'console_log':
        this.handleConsoleLog(sessionId, message.data)
        break
      default:
        console.warn('Unknown message type:', message.type)
    }
  }

  private handleConsoleLog(sessionId: string, logEntry: ConsoleLogEntry) {
    // Store in history
    const logs = this.logHistory.get(sessionId) || []
    logs.push(logEntry)
    
    // Keep only last 1000 logs per session
    if (logs.length > 1000) {
      logs.shift()
    }
    
    this.logHistory.set(sessionId, logs)

    // Broadcast to all debuggers
    this.broadcastToDebuggers({
      type: 'console_log',
      sessionId,
      data: logEntry
    })

    console.log(`[${sessionId}] ${logEntry.level.toUpperCase()}: ${logEntry.message}`)
  }

  private broadcastToDebuggers(message: any) {
    const data = JSON.stringify(message)
    this.debuggers.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data)
      }
    })
  }

  getStats() {
    return {
      clients: this.clients.size,
      debuggers: this.debuggers.size,
      sessions: this.logHistory.size,
      totalLogs: Array.from(this.logHistory.values()).reduce((sum, logs) => sum + logs.length, 0)
    }
  }
}
