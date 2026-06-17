# Architecture And Processes

## Process Ownership

- Renderer owns UI, interaction, route/view state, frontend validation, query cache, and framework components.
- Preload owns the narrow bridge exposed with `contextBridge`. It should not contain business logic.
- Main owns app lifecycle, windows, menus, tray, updater, permissions, storage requiring Node.js, safe OS/file access, and IPC handlers.
- Utility process, worker threads, or sidecars own CPU-heavy, crash-prone, or isolated work.
- Shared owns contracts, schemas, error codes, DTOs, and types that do not import Electron or UI frameworks.

## Project Shape

Small/MVP:

```txt
src/
  main/
  preload/
  renderer/
  shared/
```

Medium app:

```txt
src/
  main/{app,windows,ipc,services,storage,updater,security}/
  preload/
  renderer/{app,features,shared,routes}/
  shared/{contracts,schemas,errors}/
```

Large app:

```txt
apps/desktop/
packages/{contracts,domain,api-client,ui,storage,electron-ipc,telemetry,test-utils}/
```

Use the larger shape only when there are real drivers: multiple windows, offline sync, local database, several integrations, strict import boundaries, or multiple teams.

## Implementation Rules

- Bundle `main`, `preload`, and `renderer` separately.
- Keep `strict: true` TypeScript for new work and do not hide cross-process data with `any`.
- Prevent renderer imports from `electron`, `fs`, `path`, `child_process`, or Node-only modules.
- Prevent main imports from renderer UI components.
- Keep domain packages free of Electron imports.
- Treat multi-window as a first-class scenario when adding shared state, events, logout, updates, or permissions.
- Move heavy imports, parsing, compression, analysis, and long CPU tasks out of main process.

## State Ownership

- UI state: renderer.
- Server state: renderer query cache or chosen API cache.
- Desktop state: main.
- Persistent local state: main or controlled renderer storage with versioning.
- Secret state: main plus OS-backed storage.
- Cross-window state: main coordinator or explicit storage/event model.

Do not duplicate the same state across main and renderer without a synchronization protocol.
