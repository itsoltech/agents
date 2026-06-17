# Performance And Memory Debugging

## Startup And Responsiveness

Measure before changing architecture:

- app startup time
- time to first window and `ready-to-show`
- main process CPU during startup
- renderer long tasks
- preload execution time
- bundle size and heavy imports
- synchronous `require` and filesystem work

Common fixes:

- bundle main/preload
- lazy-load renderer routes and heavy modules
- move CPU-heavy work to utility process, worker thread, sidecar, or native module
- defer noncritical OS integrations until after first window
- avoid creating hidden windows that are not needed

## Main Process Blocking

Signals:

- window creation delayed
- tray/menu/global shortcuts lag
- IPC requests time out
- update or storage operations freeze the app

Check synchronous filesystem calls, large JSON parsing, compression, database migrations, cryptography, image/video processing, and unbounded loops.

## Renderer Performance

Check:

- framework profiler and Chromium Performance panel
- long lists without virtualization
- large rerenders from global state
- heavy IPC/event streams causing setState loops
- layout thrash and expensive animations
- GPU acceleration or driver problems
- high-DPI/multi-monitor behavior

## Memory Leaks

Inspect:

- retained BrowserWindow references
- IPC listeners not removed on unmount/window close
- timers, intervals, observers, and subscriptions
- query caches retained across logout/tenant switch
- hidden windows kept alive unnecessarily
- large payloads copied through IPC
- native module or utility process lifetime

Use heap snapshots for renderer leaks and process memory telemetry for main/utility/native leaks. Verify fixes by repeating the workflow enough times to observe stable memory.
