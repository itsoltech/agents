---
name: itsol-bug-debugging
description: Use when diagnosing or fixing an ITSOL bug, regression, failing test, incorrect calculation, broken API behavior, stale UI state, bad data, deployment issue, or production symptom before proposing a fix.
---

# ITSOL Bug Debugging

Do not guess fixes. Reproduce or gather evidence, isolate the failing layer, then patch the root cause.

## Process

1. State expected behavior, actual behavior, and impact.
2. Reproduce locally or collect logs, traces, data samples, failing tests, or deployment evidence.
3. Locate the boundary: UI, API, domain logic, database, cache, queue, integration, infrastructure, or configuration.
4. Compare with a working path or similar code.
5. Add a regression test or minimal diagnostic before changing production code where feasible.
6. Implement one root-cause fix and verify related paths.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files. Then read only the sector files relevant to the current situation.

