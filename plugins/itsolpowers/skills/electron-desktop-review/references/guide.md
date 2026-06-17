# Electron Desktop Review Reference Index

This file routes review work to focused references. Do not load every reference unless the pull request spans the full Electron surface.

## How To Use

1. Identify changed surfaces: process boundaries, IPC/preload, storage/secrets, networking, updater/release, tests, or QA.
2. Open only the reference files that match those surfaces.
3. For version-specific behavior, detect the repo-pinned Electron/tooling first. For new projects use latest stable. For security or release-sensitive claims, verify official docs through `itsol-current-tech-context`.

## Reference Files

- `01-architecture-boundaries.md` - main, preload, renderer, utility process, multi-window, and performance boundaries.
- `02-ipc-security-contracts.md` - IPC contracts, preload API shape, sender checks, events, errors, and abuse cases.
- `03-storage-api-network.md` - local storage, secrets, API placement, offline sync, cache isolation, and logs.
- `04-update-tests-qa-release-risk.md` - auto-update, packaging review, test coverage, QA edge cases, and release blockers.
