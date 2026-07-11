---
name: react-nextjs-debugging
description: "React 19 and Next.js debugging: hydration, Server/Client Components, App Router, cache, TanStack Query, auth, API, env, bundle, performance, tests."
---

# React Next.js Debugging

For bugfix authorization and plan prerequisites, defer to `itsol-workflow-mode`; retain evidence, root-cause analysis, TDD/replacement verification, and final review in every mode.

Debug React 19 and Next.js issues by isolating whether the failure belongs to server render, client render, hydration, App Router, API, cache, auth, CSS, bundle, runtime config, or deployment mode.

## Process

1. State expected behavior, actual behavior, impact, affected route/component, environment, and smallest reproducible symptom.
2. Gather evidence from browser console, terminal logs, Network tab, request ids, telemetry, tests, build output, generated API output, config, and package versions before proposing a fix.
3. Use `itsol-current-tech-context` when symptoms depend on React, Next.js, TanStack Query, Hey API, browser APIs, or package versions.
4. Read [references/guide.md](references/guide.md), then isolate one failing boundary and compare with a known working path.
5. Write or update a regression test when repo policy supports it; otherwise document replacement verification.
6. Use `itsol-bug-debugging`; in `governed`, require an approved Technical Fix Plan before implementation, while autonomous/direct prerequisites come from `itsol-workflow-mode`.

## Coordination

Use with `react-nextjs-app-router-rendering`, `react-nextjs-api-cache-forms`, `react-nextjs-quality-security`, `security-frontend-browser-review`, `ui-frontend-testing-qa`, and `itsol-tdd-workflow`.
