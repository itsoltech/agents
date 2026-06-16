# New Projects And Sources

## New Project Defaults

When there is no existing repo constraint and the user did not pin versions:

- use latest stable packages, SDKs, runtimes, generators, and framework versions;
- choose package managers and tooling intentionally, not from memory;
- prefer stable releases over prerelease, nightly, beta, RC, or canary;
- record major versions and assumptions in the technical plan;
- prefer actively supported LTS versions when longevity matters more than newest features.

Language defaults:

- Rust: latest stable Rust and newest stable edition supported by the toolchain.
- .NET: latest stable SDK; choose LTS when production support window is a requirement.
- Node/Bun/npm: latest stable packages compatible with the chosen runtime and package manager.

## Source Selection

Use primary sources first:

- official framework/language/runtime documentation;
- official release notes and migration guides;
- package registries such as npm, NuGet, crates.io, Docker Hub, or official container registries;
- vendor docs for infrastructure and cloud tooling;
- GitHub releases only when the project treats GitHub as the release channel.

Avoid basing decisions on blog posts, old tutorials, generated snippets, or model memory when official docs or registries are available.

When internet access is unavailable, state that limitation and proceed from local manifests plus known constraints. Do not claim that a version is latest unless verified.
