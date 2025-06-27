import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { v4 as uuidv4 } from "uuid";
import type {
  DebugMessage,
  ConsoleLogEntry,
  NetworkRequestEntry,
  ClientInfo,
} from "./types.js";

const app = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

// In-memory storage for sessions and connections
const sessions = new Map<string, ClientInfo>();
const logHistory = new Map<string, ConsoleLogEntry[]>();
const networkHistory = new Map<string, NetworkRequestEntry[]>();
const logIds = new Map<string, Set<string>>(); // sessionId -> Set of log IDs
const networkIds = new Map<string, Set<string>>(); // sessionId -> Set of network request IDs
const clients = new Map<string, unknown>();
const debuggers = new Set<unknown>();

if (process.env.NODE_ENV === "development") {
  app.use(logger());
}

// Enable CORS for frontend connections
app.use(
  cors({
    origin: "*", // Accept all origins for demo
    credentials: true,
  }),
);

// WebSocket endpoint
app.get(
  "/ws",
  upgradeWebSocket((c) => {
    const url = new URL(c.req.url);
    const clientType = url.searchParams.get("type") || "client";
    const sessionId = url.searchParams.get("sessionId") || uuidv4();

    console.log(`New ${clientType} connection`, { sessionId });

    return {
      onOpen(_event, ws) {
        if (clientType === "debugger") {
          debuggers.add(ws);

          // Send current client list
          const clientList = Array.from(sessions.values());
          ws.send(
            JSON.stringify({
              type: "client_list",
              data: clientList,
            }),
          );

          // Send log history for all sessions
          for (const [sid, logs] of logHistory.entries()) {
            for (const log of logs) {
              ws.send(
                JSON.stringify({
                  type: "console_log",
                  sessionId: sid,
                  data: log,
                }),
              );
            }
          }

          // Send network request history for all sessions
          for (const [sid, requests] of networkHistory.entries()) {
            for (const request of requests) {
              ws.send(
                JSON.stringify({
                  type: "network_request",
                  sessionId: sid,
                  data: request,
                }),
              );
            }
          }
        } else {
          // Handle client connection
          clients.set(sessionId, ws);
          
          // Capture origin from headers
          const origin = c.req.header('origin') || c.req.header('referer') || 'unknown';
          
          sessions.set(sessionId, {
            sessionId,
            origin,
            connectedAt: Date.now(),
          });

          if (!logHistory.has(sessionId)) {
            logHistory.set(sessionId, []);
            logIds.set(sessionId, new Set());
          }
          if (!networkHistory.has(sessionId)) {
            networkHistory.set(sessionId, []);
            networkIds.set(sessionId, new Set());
          }

          // Notify debuggers of new client
          broadcastToDebuggers({
            type: "client_connected",
            data: sessions.get(sessionId)!,
          });
        }
      },

      onMessage(event) {
        if (clientType === "client") {
          try {
            const message: DebugMessage = JSON.parse(event.data.toString());
            handleClientMessage(sessionId, message);
          } catch (error) {
            console.error("Failed to parse message:", error);
          }
        }
      },

      onClose(_event, ws) {
        console.log(`${clientType} disconnected`, { sessionId });
        if (clientType === "debugger") {
          debuggers.delete(ws);
        } else {
          clients.delete(sessionId);
          sessions.delete(sessionId);
        }
      },

      onError(error) {
        console.error("WebSocket error:", error);
      },
    };
  }),
);

function handleClientMessage(sessionId: string, message: DebugMessage) {
  switch (message.type) {
    case "console_log":
      handleConsoleLog(sessionId, message.data as ConsoleLogEntry);
      break;
    case "network_request":
      handleNetworkRequest(sessionId, message.data as NetworkRequestEntry);
      break;
    default:
      console.warn("Unknown message type:", message.type);
  }
}

function handleConsoleLog(sessionId: string, logEntry: ConsoleLogEntry) {
  // Get history and ID tracking
  const logs = logHistory.get(sessionId) || [];
  const seenIds = logIds.get(sessionId) || new Set();

  // Check for duplicate by ID (O(1) lookup)
  if (seenIds.has(logEntry.id)) {
    console.log(`[${sessionId}] Duplicate log ignored: ${logEntry.id}`);
    return;
  }

  // Get session info for origin
  const session = sessions.get(sessionId);
  const origin = session?.origin || 'unknown';

  // Add origin to log entry
  const logWithOrigin = { ...logEntry, origin };

  // Add to tracking and history
  seenIds.add(logEntry.id);
  logs.push(logWithOrigin);

  // Keep only last 1000 logs per session
  if (logs.length > 1000) {
    const removedLog = logs.shift();
    if (removedLog) {
      seenIds.delete(removedLog.id); // Clean up old ID
    }
  }

  logHistory.set(sessionId, logs);
  logIds.set(sessionId, seenIds);

  // Broadcast to all debuggers
  broadcastToDebuggers({
    type: "console_log",
    sessionId,
    data: logWithOrigin,
  });

  console.log(
    `[${sessionId}] ${logEntry.level.toUpperCase()}: ${logEntry.message}`,
  );
}

function handleNetworkRequest(
  sessionId: string,
  requestEntry: NetworkRequestEntry,
) {
  // Get history and ID tracking
  const requests = networkHistory.get(sessionId) || [];
  const seenIds = networkIds.get(sessionId) || new Set();

  // Check for duplicate by ID (O(1) lookup)
  if (seenIds.has(requestEntry.id)) {
    console.log(
      `[${sessionId}] Duplicate network request ignored: ${requestEntry.id}`,
    );
    return;
  }

  // Get session info for origin
  const session = sessions.get(sessionId);
  const origin = session?.origin || 'unknown';

  // Add origin to request entry
  const requestWithOrigin = { ...requestEntry, origin };

  // Add to tracking and history
  seenIds.add(requestEntry.id);
  requests.push(requestWithOrigin);

  // Keep only last 1000 requests per session
  if (requests.length > 1000) {
    const removedRequest = requests.shift();
    if (removedRequest) {
      seenIds.delete(removedRequest.id); // Clean up old ID
    }
  }

  networkHistory.set(sessionId, requests);
  networkIds.set(sessionId, seenIds);

  // Broadcast to all debuggers
  broadcastToDebuggers({
    type: "network_request",
    sessionId,
    data: requestWithOrigin,
  });

  const status =
    requestEntry.response?.status || (requestEntry.error ? "ERROR" : "PENDING");
  console.log(
    `[${sessionId}] ${requestEntry.method} ${requestEntry.url} - ${status}`,
  );
}

function broadcastToDebuggers(message: unknown) {
  const data = JSON.stringify(message);
  debuggers.forEach((ws) => {
    try {
      (ws as WebSocket).send(data);
    } catch (error) {
      console.error("Failed to send to debugger:", error);
      debuggers.delete(ws);
    }
  });
}

function getStats() {
  return {
    clients: clients.size,
    debuggers: debuggers.size,
    sessions: logHistory.size,
    totalLogs: Array.from(logHistory.values()).reduce(
      (sum, logs) => sum + logs.length,
      0,
    ),
    totalNetworkRequests: Array.from(networkHistory.values()).reduce(
      (sum, requests) => sum + requests.length,
      0,
    ),
  };
}

app.get("/", (c) => {
  return c.json({
    message: "Debug server running",
    stats: getStats(),
  });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", ...getStats() });
});

const port = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT) : 3002;

console.log(`Debug server running on http://localhost:${port}`);
console.log(`WebSocket endpoint: ws://localhost:${port}/ws`);

const server = serve({
  fetch: app.fetch,
  port,
});

injectWebSocket(server);
