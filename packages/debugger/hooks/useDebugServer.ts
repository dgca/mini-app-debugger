'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ConsoleLogEntry } from '@/lib/types'

interface DebugServerMessage {
  type: 'console_log' | 'client_list' | 'client_connected'
  sessionId?: string
  data: any
}

interface DebugSession {
  sessionId: string
  logs: ConsoleLogEntry[]
  connectedAt: number
  appName?: string
}

interface UseDebugServerReturn {
  sessions: Map<string, DebugSession>
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  allLogs: ConsoleLogEntry[]
  connect: () => void
  disconnect: () => void
}

const DEBUG_SERVER_URL = 'ws://localhost:3001/ws?type=debugger'

export function useDebugServer(): UseDebugServerReturn {
  const [sessions, setSessions] = useState<Map<string, DebugSession>>(new Map())
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setConnectionStatus('connecting')
    
    try {
      const ws = new WebSocket(DEBUG_SERVER_URL)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('Connected to debug server')
        setConnectionStatus('connected')
      }

      ws.onmessage = (event) => {
        try {
          const message: DebugServerMessage = JSON.parse(event.data)
          handleServerMessage(message)
        } catch (error) {
          console.error('Failed to parse server message:', error)
        }
      }

      ws.onclose = () => {
        console.log('Disconnected from debug server')
        setConnectionStatus('disconnected')
        wsRef.current = null
        
        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 3000)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('error')
      }
    } catch (error) {
      console.error('Failed to connect to debug server:', error)
      setConnectionStatus('error')
    }
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setConnectionStatus('disconnected')
  }, [])

  const handleServerMessage = useCallback((message: DebugServerMessage) => {
    switch (message.type) {
      case 'console_log':
        if (message.sessionId) {
          setSessions(prev => {
            const newSessions = new Map(prev)
            const session = newSessions.get(message.sessionId!) || {
              sessionId: message.sessionId!,
              logs: [],
              connectedAt: Date.now()
            }
            
            session.logs = [...session.logs, message.data].slice(-1000) // Keep last 1000 logs
            newSessions.set(message.sessionId!, session)
            return newSessions
          })
        }
        break

      case 'client_connected':
        setSessions(prev => {
          const newSessions = new Map(prev)
          if (!newSessions.has(message.data.sessionId)) {
            newSessions.set(message.data.sessionId, {
              sessionId: message.data.sessionId,
              logs: [],
              connectedAt: message.data.connectedAt,
              appName: message.data.appName
            })
          }
          return newSessions
        })
        break

      case 'client_list':
        // Handle initial client list if needed
        if (Array.isArray(message.data)) {
          setSessions(prev => {
            const newSessions = new Map(prev)
            message.data.forEach((client: any) => {
              if (!newSessions.has(client.sessionId)) {
                newSessions.set(client.sessionId, {
                  sessionId: client.sessionId,
                  logs: [],
                  connectedAt: client.connectedAt,
                  appName: client.appName
                })
              }
            })
            return newSessions
          })
        }
        break
    }
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  // Get all logs from all sessions, sorted by timestamp
  const allLogs = Array.from(sessions.values())
    .flatMap(session => session.logs)
    .sort((a, b) => a.timestamp - b.timestamp)

  return {
    sessions,
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    allLogs,
    connect,
    disconnect
  }
}
