# Architecture Boundaries

## Review Targets

- `main` owns lifecycle, windows, menus, tray, OS APIs, file dialogs, permissions, storage requiring Node.js, updater, logging, and crash reporting.
- `preload` exposes a small typed API through `contextBridge`; it is not a business-logic layer.
- `renderer` behaves like a web app: UI, view state, forms, query cache, and no direct Node.js or Electron access.
- `shared` contains contracts, schemas, DTOs, and error codes without importing Electron or UI framework code.
- `utilityProcess`, workers, sidecars, or native modules handle CPU-heavy, crash-prone, or isolated work.

## Findings To Look For

- Renderer imports `electron`, `fs`, `path`, `child_process`, native modules, or secret-bearing clients.
- Main process imports UI components, holds form state, blocks startup, or does heavy CPU work synchronously.
- Preload exposes generic `send`, `invoke`, `on`, `ipcRenderer`, filesystem access, process globals, or broad service objects.
- One window is assumed even though settings, preview, logs, auth, update, or external-content windows exist.
- Trusted UI and untrusted remote content share the same session, preload, or permissions.

## Multi-Window Questions

- Does every window have a type, ID, permission set, preload API, and session decision?
- Are IPC events routed to the intended window only?
- Are listeners cleaned up when a window closes?
- Does logout close, reset, or revoke secondary windows?
- Does update/restart block new windows safely?

## Performance Questions

- Does startup import only what is required before first window?
- Are main/preload/renderer bundled separately?
- Are large lists virtualized and heavy renderer routes lazy-loaded?
- Are large IPC payloads streamed, chunked, batched, or moved through files/MessagePorts?
- Are hidden windows retained only when they are product-required?
