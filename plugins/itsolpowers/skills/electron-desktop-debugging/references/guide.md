# Electron Desktop Debugging Guide

Use this routing index after reading `SKILL.md`. Load only the files needed for the failure mode.

## Reference Routing

- Repro setup, evidence matrix, dev-vs-packaged isolation, and first triage questions: read [01-evidence-and-triage.md](01-evidence-and-triage.md).
- Main/preload/renderer boundary bugs, IPC validation failures, event leaks, and session/window problems: read [02-process-ipc-window-debugging.md](02-process-ipc-window-debugging.md).
- Packaged-only bugs, ASAR/native-module/preload-path issues, code signing, notarization, and auto-update symptoms: read [03-packaged-and-update-debugging.md](03-packaged-and-update-debugging.md).
- Logs, crash reports, net logs, diagnostic bundles, redaction, and support evidence: read [04-logs-crashes-diagnostics.md](04-logs-crashes-diagnostics.md).
- Slow startup, high CPU, memory leaks, blocked main process, GPU/rendering issues, and large IPC payloads: read [05-performance-memory-debugging.md](05-performance-memory-debugging.md).

## Version Policy

- Existing repo: debug against pinned `electron`, builder, Forge, updater, frontend framework, and test runner versions.
- New or upgrade-sensitive advice: use latest stable only after checking official docs through `itsol-current-tech-context`.
- Symptoms tied to Electron defaults, security warnings, packaging, auto-update, or test automation require current official docs before recommending version-specific fixes.
