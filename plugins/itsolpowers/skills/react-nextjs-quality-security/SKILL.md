---
name: react-nextjs-quality-security
description: "React 19 and Next.js quality/security: CSP, auth, permissions, env, runtime config, accessibility, performance, bundle, tests, CI, QA, production readiness."
---

# React Next.js Quality Security

Assess or implement React 19 and Next.js quality, security, performance, accessibility, tests, CI, runtime config, and production-readiness concerns.

## Process

1. Inspect changed routes/components, security boundaries, auth/session model, env strategy, dependencies, tests, CI, and deployment target.
2. Use `itsol-current-tech-context` for version-sensitive Next.js, React Compiler, Tailwind, testing, security header, or package behavior.
3. Read [references/guide.md](references/guide.md) before changing or reviewing security, performance, testing, or release behavior.
4. Treat frontend code as public and all browser/API/form/storage/query-param data as untrusted.
5. Verify server-side authorization, CSP/header strategy, safe env separation, cache cleanup, UI states, keyboard behavior, bundle impact, and production build behavior where relevant.
6. For large PRs, split review with `security-frontend-browser-review`, `ui-code-review`, `ui-performance-stability`, and `ui-frontend-testing-qa` subagents.

## Coordination

Use with `react-nextjs-review`, `react-nextjs-debugging`, `ui-code-review`, `security-frontend-browser-review`, `security-auth-session-review`, `security-authz-tenant-review`, `security-supply-chain-review`, and `infra-production-readiness-review`.
