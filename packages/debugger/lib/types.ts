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

export interface LogFilter {
  search: string
  levels: LogLevel[]
  startTime?: number
  endTime?: number
}

export interface DebugSession {
  id: string
  appName: string
  startTime: number
  lastActivity: number
  logs: ConsoleLogEntry[]
}
