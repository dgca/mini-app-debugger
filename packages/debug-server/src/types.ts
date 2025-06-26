export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug'

export interface ConsoleLogEntry {
  id: string
  timestamp: number
  level: LogLevel
  message: string
  args: unknown[]
  source?: {
    file?: string
    line?: number
    column?: number
  }
}

export interface DebugMessage {
  type: 'console_log'
  sessionId: string
  data: ConsoleLogEntry
}

export interface ClientInfo {
  sessionId: string
  appName?: string
  userAgent?: string
  connectedAt: number
}
