import { serve } from "@hono/node-server";
import { createServer } from "http";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { DebugWebSocketServer } from "./websocket.js";

const app = new Hono();

if (process.env.NODE_ENV === "development") {
  app.use(logger());
}

// Enable CORS for frontend connections
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

let wsServer: DebugWebSocketServer;

app.get("/", (c) => {
  return c.json({ message: "Debug server running", stats: wsServer?.getStats() });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", ...wsServer?.getStats() });
});

const port = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT) : 3001;

// Create HTTP server
const server = createServer();

// Initialize WebSocket server
wsServer = new DebugWebSocketServer(server);

console.log(`Debug server running on http://localhost:${port}`);
console.log(`WebSocket endpoint: ws://localhost:${port}/ws`);

// Start the server with both HTTP and WebSocket support
serve({
  fetch: app.fetch,
  port,
  createServer: () => server
});
