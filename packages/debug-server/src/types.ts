export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug'

export interface ConsoleLogEntry {
  id: string
  timestamp: number
  level: LogLevel
  message: string
  args: unknown[]
  origin?: string
  source?: {
    file?: string
    line?: number
    column?: number
  }
}

export interface NetworkRequestEntry {
  id: string
  timestamp: number
  url: string
  method: string
  headers: Record<string, string>
  body?: string
  origin?: string
  response?: {
    status: number
    statusText: string
    headers: Record<string, string>
    body: string
  }
  error?: string
  duration?: number
}

export interface DebugMessage {
  type: 'console_log' | 'network_request' | 'error'
  sessionId: string
  data: ConsoleLogEntry | NetworkRequestEntry
}

export interface ClientInfo {
  sessionId: string
  appName?: string
  userAgent?: string
  origin?: string
  connectedAt: number
}
