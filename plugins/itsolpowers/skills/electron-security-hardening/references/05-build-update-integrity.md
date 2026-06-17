# Build, Fuses, And Update Integrity

## Fuses And Runtime Surface

- Disable `ELECTRON_RUN_AS_NODE` unless explicitly needed.
- Disable debug and inspect behavior in production when supported by the pinned Electron/tooling.
- Enable ASAR integrity where supported.
- Configure fuses in the build pipeline, before signing/notarization where platform flow requires it.
- Smoke-test the fused app on every release platform.

## ASAR And Source Exposure

- Treat ASAR as packaging, not secrecy.
- Do not put secrets in main, preload, renderer, config files, or bundled assets.
- Keep production sourcemaps private or upload them only to an approved error-tracking service.
- Exclude tests, fixtures, dev configs, and internal docs from production artifacts.

## Signing And Notarization

- Sign production builds for Windows and macOS.
- Notarize macOS builds and use hardened runtime when required by the chosen flow.
- Keep certificates and credentials in CI secrets, not in repo.
- Restrict signing jobs to release branches/tags.
- Use separate app identity, bundle ID, and update channel for internal/test builds.

## Update Integrity

- Use the selected updater's signature and metadata verification path; do not hand-roll executable download and launch.
- Publish update metadata atomically with artifacts.
- Serve updates over HTTPS.
- Reject user-controlled update URLs.
- Test interrupted downloads, missing artifacts, old versions, cert rollover, no admin permissions, antivirus interference, and channel switching.

## Release Gates

- Validate package contents, fuses, signatures, notarization, checksums, update metadata, artifact channel, and install/launch smoke tests before publishing stable.
