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

export interface NetworkRequestEntry {
  id: string
  timestamp: number
  url: string
  method: string
  headers: Record<string, string>
  body?: string
  response?: {
    status: number
    statusText: string
    headers: Record<string, string>
    body: string
  }
  error?: string
  duration?: number
}

export interface DebuggerSDKConfig {
  debugServer: string
  sessionId?: string
  appName?: string
  enabled?: boolean
}

export interface DebugMessage {
  type: 'console_log' | 'network_request' | 'error'
  sessionId: string
  data: ConsoleLogEntry | NetworkRequestEntry
}
