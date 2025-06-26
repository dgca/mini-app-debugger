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
