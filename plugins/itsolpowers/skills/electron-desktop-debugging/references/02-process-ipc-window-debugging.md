# Process, IPC, And Window Debugging

## Main Process

Use main-process debugging for lifecycle, windows, menus, tray, global shortcuts, updater, storage, OS integrations, permissions, and IPC handlers. Renderer DevTools do not debug main process code.

Check:

- app startup logs include version, platform, architecture, channel, commit, and paths
- `ready`, `activate`, `window-all-closed`, single-instance lock, and deep-link events
- BrowserWindow creation options and preload path
- long synchronous work blocking startup or window events
- cleanup of listeners and references on window close

## Preload

Check:

- preload file exists in dev and packaged paths
- `contextIsolation` is enabled and the bridge is exposed through `contextBridge`
- bridge method names match renderer usage
- raw `ipcRenderer` is not exposed
- listener APIs return cleanup functions
- preload imports do not depend on DOM-only or dev-only modules

Symptoms:

- `window.desktop` undefined: preload path, bundling, context isolation, or script error.
- bridge method missing: type drift, preload not rebuilt, wrong window, or stale renderer bundle.
- listener fires multiple times: missing cleanup on remount or window lifecycle.

## IPC

Check:

- channel spelling and ownership
- request schema vs actual payload
- sender window authorization
- timeout/cancellation behavior
- response schema and safe error mapping
- logs include channel and duration without sensitive payloads

Common failures:

- renderer sends arbitrary path or URL and main rejects it
- handler trusts `event.sender` without mapping it to an authorized BrowserWindow
- event is broadcast to all windows instead of target window/user/project
- logout leaves old listeners active
- large payloads freeze UI or main process

## Windows And Sessions

Check:

- `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, `webSecurity: true`
- production DevTools and remote debugging flags
- navigation blockers and external URL allowlist
- permission request/check handlers
- session partition and cookie/cache separation
- CSP warnings in renderer console
- custom protocol registration before `app.ready`

If a bug appears only after login/logout or tenant switch, inspect cache, cookies, query cache, storage, secrets, and IPC subscriptions together.
