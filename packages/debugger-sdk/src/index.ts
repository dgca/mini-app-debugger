export type LogLevel = "log" | "info" | "warn" | "error" | "debug";

export interface ConsoleLogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  args: unknown[];
  source?: {
    file?: string;
    line?: number;
    column?: number;
  };
}

export interface NetworkRequestEntry {
  id: string;
  timestamp: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
  };
  error?: string;
  duration?: number;
}

export interface DebuggerSDKConfig {
  debugServer: string;
  sessionId?: string;
  appName?: string;
  enabled?: boolean;
}

export interface DebugMessage {
  type: "console_log" | "network_request" | "error";
  sessionId: string;
  data: ConsoleLogEntry | NetworkRequestEntry;
}

let isInitialized = false;
let config: DebuggerSDKConfig | null = null;
let websocket: WebSocket | null = null;
let sessionId: string = "";

// Store original methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

const originalFetch = window.fetch;

function generateId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function connectWebSocket(): void {
  if (!config) return;

  try {
    const url = new URL("/ws", config.debugServer);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.searchParams.set("type", "client");
    url.searchParams.set("sessionId", sessionId);

    websocket = new WebSocket(url.toString());

    websocket.onopen = () => {
      console.log("[Debugger SDK] Connected to debug server");
    };

    websocket.onclose = () => {
      console.log("[Debugger SDK] Disconnected from debug server");
      websocket = null;

      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (config && isInitialized) {
          connectWebSocket();
        }
      }, 5000);
    };

    websocket.onerror = (error) => {
      console.error("[Debugger SDK] WebSocket error:", error);
    };
  } catch (error) {
    console.error("[Debugger SDK] Failed to connect to debug server:", error);
  }
}

function sendMessage(message: DebugMessage): void {
  if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    return;
  }

  try {
    websocket.send(JSON.stringify(message));
  } catch (error) {
    console.error("[Debugger SDK] Failed to send message:", error);
  }
}

function createConsoleProxy(level: LogLevel): (...args: unknown[]) => void {
  return (...args: unknown[]) => {
    // Call original console method
    originalConsole[level](...args);

    if (!isInitialized || !config) return;

    // Create log entry
    const logEntry: ConsoleLogEntry = {
      id: generateId(),
      timestamp: Date.now(),
      level,
      message: args
        .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
        .join(" "),
      args,
      source: getStackTrace(),
    };

    // Send to debug server
    sendMessage({
      type: "console_log",
      sessionId,
      data: logEntry,
    });
  };
}

function getStackTrace():
  | { file?: string; line?: number; column?: number }
  | undefined {
  try {
    const stack = new Error().stack;
    if (!stack) return undefined;

    const lines = stack.split("\n");
    // Skip the first few lines (Error, getStackTrace, createConsoleProxy)
    const relevantLine = lines[4];

    if (!relevantLine) return undefined;

    const match = relevantLine.match(/\((.+):(\d+):(\d+)\)/);
    if (match) {
      return {
        file: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
      };
    }
  } catch {
    // Ignore errors in stack trace parsing
  }
  return undefined;
}

function createFetchProxy(): typeof fetch {
  return async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const startTime = Date.now();
    const requestId = generateId();

    // Extract request details
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const method = init?.method || "GET";
    const headers: Record<string, string> = {};

    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, init.headers);
      }
    }

    const requestBody = init?.body ? String(init.body) : undefined;

    try {
      const response = await originalFetch(input, init);
      const duration = Date.now() - startTime;

      if (isInitialized && config) {
        // Clone response to read body without consuming it
        const clonedResponse = response.clone();
        let responseBody = "";

        try {
          responseBody = await clonedResponse.text();
        } catch {
          responseBody = "[unreadable]";
        }

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        const networkEntry: NetworkRequestEntry = {
          id: requestId,
          timestamp: startTime,
          url,
          method,
          headers,
          body: requestBody,
          response: {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            body: responseBody,
          },
          duration,
        };

        sendMessage({
          type: "network_request",
          sessionId,
          data: networkEntry,
        });
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (isInitialized && config) {
        const networkEntry: NetworkRequestEntry = {
          id: requestId,
          timestamp: startTime,
          url,
          method,
          headers,
          body: requestBody,
          error: error instanceof Error ? error.message : String(error),
          duration,
        };

        sendMessage({
          type: "network_request",
          sessionId,
          data: networkEntry,
        });
      }

      throw error;
    }
  };
}

function setupErrorHandling(): void {
  // Global error handler
  window.addEventListener("error", (event) => {
    if (!isInitialized || !config) return;

    const errorEntry: ConsoleLogEntry = {
      id: generateId(),
      timestamp: Date.now(),
      level: "error",
      message: `Uncaught Error: ${event.error?.message || event.message}`,
      args: [event.error || event.message],
      source: {
        file: event.filename,
        line: event.lineno,
        column: event.colno,
      },
    };

    sendMessage({
      type: "console_log",
      sessionId,
      data: errorEntry,
    });
  });

  // Unhandled promise rejection handler
  window.addEventListener("unhandledrejection", (event) => {
    if (!isInitialized || !config) return;

    const errorEntry: ConsoleLogEntry = {
      id: generateId(),
      timestamp: Date.now(),
      level: "error",
      message: `Unhandled Promise Rejection: ${event.reason}`,
      args: [event.reason],
    };

    sendMessage({
      type: "console_log",
      sessionId,
      data: errorEntry,
    });
  });
}

export function initMiniAppDebuggerSDK({
  debugServer,
  sessionId,
  appName,
  enabled,
}: DebuggerSDKConfig): void {
  if (isInitialized) {
    console.warn("[Debugger SDK] Already initialized");
    return;
  }

  // Check if we should enable debugging
  if (enabled === false) {
    return;
  }

  config = {
    enabled: true,
    debugServer,
    sessionId,
    appName,
  };

  sessionId = config.sessionId || generateSessionId();
  isInitialized = true;

  console.log("[Debugger SDK] Initializing with config:", {
    debugServer: config.debugServer,
    sessionId,
    appName: config.appName,
  });

  // Set up console proxies
  console.log = createConsoleProxy("log");
  console.info = createConsoleProxy("info");
  console.warn = createConsoleProxy("warn");
  console.error = createConsoleProxy("error");
  console.debug = createConsoleProxy("debug");

  // Set up fetch proxy
  window.fetch = createFetchProxy();

  // Set up error handling
  setupErrorHandling();

  // Connect to WebSocket
  connectWebSocket();
}

export function destroyMiniAppDebuggerSDK(): void {
  if (!isInitialized) return;

  console.log("[Debugger SDK] Destroying SDK");

  // Restore original methods
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
  window.fetch = originalFetch;

  // Close WebSocket
  if (websocket) {
    websocket.close();
    websocket = null;
  }

  // Reset state
  isInitialized = false;
  config = null;
  sessionId = "";
}

export function getSDKInfo() {
  return {
    isInitialized,
    sessionId,
    config: config ? { ...config } : null,
    connected: websocket?.readyState === WebSocket.OPEN,
  };
}
