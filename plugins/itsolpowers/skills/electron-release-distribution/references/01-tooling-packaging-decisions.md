# Tooling And Packaging Decisions

## Version Context

- Existing app: respect pinned Electron, package manager, builder, and updater versions unless the task is to upgrade them.
- New app: use latest stable Electron and current stable tooling after verifying official docs.
- Pin Node, package manager, Electron, builder, and lockfile behavior in CI.

## Tooling Roles

- `electron-vite` is useful for separate main/preload/renderer bundling and developer workflow.
- Electron Forge is useful when the project wants an Electron-native packaging/publishing workflow with makers/publishers.
- `electron-builder` is common for installers, targets, signing, and `electron-updater` metadata.
- Use the repo's existing tool unless it clearly blocks required targets, signing, updater, or CI.

## Packaging Review

- Main, preload, and renderer must be bundled separately.
- Preload should not accidentally import DOM-only frontend packages.
- Renderer should not import Node-only packages.
- Exclude tests, fixtures, local docs, sample secrets, unused assets, public sourcemaps, and dev-only dependencies from production artifacts.
- Store production sourcemaps privately or upload them to an approved error tracker.
- Check ASAR content, installer size, duplicated dependencies, native module rebuilds, and platform-specific assets.

## Native Modules

- Rebuild native modules per platform and architecture in CI.
- Smoke-test packaged app paths; dev server paths often hide packaging bugs.
- Track ABI and Electron upgrades as release risks.
- Avoid relying on developer-machine global tools.

## Distribution Target Questions

- Which OS versions, CPU architectures, stores, and installer formats are supported?
- Does the target customer need MSI, DMG, ZIP, AppImage, deb, rpm, Snap, Flatpak, or store distribution?
- Are enterprise proxies, antivirus, limited permissions, and non-admin install paths in scope?
