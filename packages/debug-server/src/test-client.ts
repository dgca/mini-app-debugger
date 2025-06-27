import WebSocket from "ws";

const ws = new WebSocket(
  "ws://localhost:3001/ws?type=client&sessionId=test-session",
);

ws.on("open", () => {
  console.log("Connected to debug server");

  // Send a test console log
  ws.send(
    JSON.stringify({
      type: "console_log",
      sessionId: "test-session",
      data: {
        id: "test-1",
        timestamp: Date.now(),
        level: "info",
        message: "Test message from client",
        args: [{ test: "data" }],
      },
    }),
  );
});

ws.on("message", (data) => {
  console.log("Received:", data.toString());
});

ws.on("error", (error) => {
  console.error("WebSocket error:", error);
});

ws.on("close", () => {
  console.log("Connection closed");
});
