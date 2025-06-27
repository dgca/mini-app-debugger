# Mini App Debugger SDK

A TypeScript SDK for debugging mini apps running in Farcaster clients. This library captures console logs, network requests, and errors, forwarding them to a debug server for real-time inspection.

## Installation

```bash
npm install @mini-app-debugger/sdk
# or
pnpm add @mini-app-debugger/sdk
```

## Usage

### Basic Setup

```typescript
import { initMiniAppDebuggerSDK } from '@mini-app-debugger/sdk'

// Initialize only in development
if (process.env.NODE_ENV !== "production") {
  initMiniAppDebuggerSDK({
    debugServer: "http://localhost:3001"
  });
}
```

### Configuration Options

```typescript
interface DebuggerSDKConfig {
  debugServer: string      // Debug server URL (required)
  sessionId?: string      // Custom session ID (optional, auto-generated if not provided)
  appName?: string        // App name for identification (optional)
  enabled?: boolean       // Whether to enable debugging (optional, defaults to true)
}
```

### Advanced Usage

```typescript
import { initMiniAppDebuggerSDK, destroyMiniAppDebuggerSDK, getSDKInfo } from '@mini-app-debugger/sdk'

// Initialize with custom config
initMiniAppDebuggerSDK({
  debugServer: "ws://localhost:3001",
  appName: "My Mini App",
  sessionId: "custom-session-id"
})

// Check SDK status
const info = getSDKInfo()
console.log('SDK initialized:', info.isInitialized)
console.log('Connected to server:', info.connected)

// Clean up when done (optional)
destroyMiniAppDebuggerSDK()
```

## What Gets Captured

- **Console Logs**: All `console.log`, `console.info`, `console.warn`, `console.error`, and `console.debug` calls
- **Network Requests**: All `fetch` requests and responses (including headers, body, and timing)
- **Errors**: Uncaught errors and unhandled promise rejections
- **Stack Traces**: Source file, line, and column information when available

## How It Works

1. The SDK proxies browser APIs (`console.*`, `fetch`, error handlers)
2. Captured data is sent to the debug server via WebSocket
3. The debug server forwards data to connected debugger clients
4. Developers can view real-time logs and network activity in the debugger UI

## Browser Compatibility

- Modern browsers with WebSocket support
- ES2020+ environments
- TypeScript 4.0+

## Development

```bash
# Build the library
pnpm build

# Watch for changes during development
pnpm dev

# Clean build artifacts
pnpm clean
```
