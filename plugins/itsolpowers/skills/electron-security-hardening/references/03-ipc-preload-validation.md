# IPC, Preload, And Validation Hardening

## Preload Rules

- Use `contextBridge.exposeInMainWorld`.
- Expose named domain methods, not raw transport.
- Never expose `ipcRenderer`, `send`, `invoke`, `on`, `event`, Node globals, or broad service objects.
- Return cleanup functions for listeners.
- Limit event subscriptions to named event families.
- Keep business authorization and filesystem decisions out of preload.

## IPC Handler Rules

- Validate request payloads in main with a schema parser.
- Validate or type critical responses.
- Check sender window, sender frame, origin, current auth state, tenant/project context, and feature permission.
- Deny calls from wrong window type, destroyed windows, external-content windows, logged-out state, or stale tenant/project.
- Map errors to safe codes and messages.
- Add timeouts or cancellation for long-running operations.
- Log channel name, duration, and failure code without sensitive payloads.

## Abusable Patterns

- `ipcMain.handle(channelFromRenderer, ...)`
- `ipcMain.handle('fs:read', path => readFile(path))`
- `ipcMain.handle('http:request', (_, url, options) => request(url, options))`
- `window.api.invoke(channel, payload)`
- Event broadcast to all windows without authorization filtering.

## Streams And Large Data

- Do not send large files through `invoke`.
- Use MessagePort, streams, chunking, or temporary files with scoped permissions.
- Include backpressure, cancellation, progress, and cleanup on errors.

## Negative Tests

- malformed payload
- valid payload from wrong window
- call after logout
- call after tenant/project switch
- duplicate request and cancellation
- event listener cleanup after window close
- oversized payload or high-frequency event burst
