Here’s a comprehensive prompt you can give to an agentic LLM in your code editor to help you build a robust debugging tool for web-based “mini apps” running inside Farcaster clients. This prompt synthesizes all the key ideas, requirements, and technical details from our conversation:

## Prompt for Agentic LLM: Build a Debugging Tool for Farcaster Mini Apps

**Context:**  
I’m building an open-source web library to help developers create “mini apps”—augmented web apps that run inside Farcaster clients (similar to Twitter or Bluesky). These mini apps open in a web view within a mobile app. Developers find them difficult to debug because they must be remotely hosted, there’s no access to browser devtools, and they can’t see console logs or network requests.

**Objective:**  
Help me design and implement a robust debugging tool that makes development and debugging of these mini apps much easier.

### Key Requirements

- **Capture and Forward Debug Data:**  
  The tool should capture console logs, network requests (including errors, headers, bodies, status codes), and other useful debug signals from the web app running in the web view, then forward this data to a desktop app or server for real-time inspection.

- **Desktop Debugger:**  
  The desktop app should display the captured data in a developer-friendly UI, supporting filtering, searching, and exporting logs.

- **Architecture Inspiration:**  
  - React DevTools: Uses a bridge (e.g., WebSocket) between the app and the devtools UI.
  - Flipper: Desktop app with a plugin system, bi-directional communication, and real-time inspection of logs, network, and app state.

- **Extensibility:**  
  The system should be designed to allow future plugins or modules (e.g., for inspecting state, performance, or custom events).

### Technical Details and Implementation Ideas

#### 1. **Network Request Capturing**
- Wrap the global `fetch` method to log all request and response data, including:
  - URL, method, headers, body (for both request and response)
  - Status code, status text
  - Error details for failed requests
- Example implementation:
  ```javascript
  const originalFetch = window.fetch;
  window.fetch = new Proxy(originalFetch, {
    apply: async (target, thisArg, args) => {
      const [input, init] = args;
      const requestInfo = {
        url: typeof input === 'string' ? input : input.url,
        method: (init && init.method) || (input && input.method) || 'GET',
        headers: (init && init.headers) || (input && input.headers) || {},
        body: (init && init.body) || undefined,
        timestamp: Date.now(),
      };
      try {
        const response = await Reflect.apply(target, thisArg, args);
        const clonedResponse = response.clone();
        const responseHeaders = {};
        clonedResponse.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        let responseBody;
        try { responseBody = await clonedResponse.text(); }
        catch (e) { responseBody = '[unreadable]'; }
        const logEntry = {
          request: requestInfo,
          response: {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            body: responseBody,
          },
          success: response.ok,
        };
        // Send logEntry to desktop app/server
        return response;
      } catch (error) {
        const errorEntry = {
          request: requestInfo,
          error: error.message,
          success: false,
        };
        // Send errorEntry to desktop app/server
        throw error;
      }
    },
  });
  ```

#### 2. **Console Log Capturing**
- Override `console.log`, `console.error`, `console.warn`, etc., to capture and forward log messages, including timestamps and log levels.

#### 3. **Error and Exception Tracking**
- Capture uncaught errors and promise rejections using:
  ```javascript
  window.onerror = function (message, source, lineno, colno, error) { /* ... */ }
  window.onunhandledrejection = function (event) { /* ... */ }
  ```

#### 4. **Failed Resource Loads**
- Listen for resource load errors (images, scripts, stylesheets) using a global error event listener in capture mode:
  ```javascript
  window.addEventListener("error", function(event) {
    if (event.target instanceof HTMLImageElement ||
        event.target instanceof HTMLScriptElement ||
        event.target instanceof HTMLLinkElement) {
      const resourceInfo = {
        tag: event.target.tagName,
        src: event.target.src || event.target.href,
        outerHTML: event.target.outerHTML,
        time: Date.now()
      };
      // Send resourceInfo to desktop app/server
    }
  }, true);
  ```

#### 5. **Additional Useful Signals**
- Performance metrics (Core Web Vitals, resource load times)
- User interaction events (clicks, form submissions)
- Application state snapshots (Redux store, React component tree)
- Custom event logs (developer-defined)
- Profiling data (CPU, memory, JS heap)
- Environment/context info (user agent, app version)
- Navigation/routing events

#### 6. **Communication Architecture**
- Use a WebSocket connection (or HTTP relay) from the mini app to the desktop debugger (or cloud server).
- The desktop app should be able to receive real-time updates and optionally send commands (e.g., reload, toggle debug features) back to the mini app.
- Allow configuration of the debugging endpoint via query param or environment variable.

#### 7. **UI/Visualization**
- Use or adapt open-source UIs like `network-viewer` (for HAR file/network log display).
- Provide filtering, search, and export features for logs and network data.
- Design the desktop app as a plugin host for future extensibility.

**Please:**
- Propose a modular architecture for the client (mini app), server (if needed), and desktop app.
- Suggest best practices for secure communication and developer ergonomics.
- Generate code snippets and scaffolding for the most critical parts (fetch/network capture, error handling, WebSocket bridge).
- Recommend open-source libraries or components that could accelerate development (for both data capture and UI).
- Highlight any pitfalls or edge cases to watch for in web view environments.

**Goal:**  
Enable mini app developers to easily debug their apps running in Farcaster clients, with real-time insight into logs, network activity, errors, and more—without needing access to browser devtools.
