---
name: agent-browser-dogfood-workflow
description: "Agent-browser dogfood workflow: session charter, black-box loops, frontend flows, responsive, accessibility, cache, and live events."
---

# Agent Browser Dogfood Workflow

Use this skill to run or plan frontend dogfood with `agent-browser` before QA handoff, after bug fixes, for preview deployments, or when collecting evidence for UI findings.

## Process

1. Confirm the session contract: target URL, environment, scope, acceptance criteria, user role, allowed destructive operations, test data, setup and cleanup, deployment identifier, feature flags, and time limit.
2. Before actual `agent-browser` command work, check the installed tool version and available command surface:
   ```bash
   agent-browser --version
   agent-browser --help
   ```
3. If the installed CLI supports versioned local guidance such as `agent-browser skills get core` or `agent-browser skills get dogfood`, load it and prefer that output when syntax differs. Older versions may not provide those commands; in that case use `--help` and the official documentation for the installed version.
4. Treat static command snippets in this skill as patterns, not permanent CLI truth.
5. Create a short test charter and isolated artifact directory before interacting with the app.
6. Run the black-box loop first: observe, state expectation, act like a user, wait for a condition, verify UI behavior, inspect diagnostics when relevant, record coverage, refresh snapshot after state changes.
7. Use diagnostics only after black-box evidence exists. Do not read source code to justify user-visible behavior during the black-box phase.
8. Stop full dogfood if smoke test fails. Record blocker evidence and the untested scope instead of continuing through invalid results.
9. Read [references/guide.md](references/guide.md), then load only the focused reference files needed for the session.
10. End with a compact handoff: findings with evidence, coverage, blocked areas, unexpected console/network errors, artifact paths, limitations, and recommended regression tests.

## Coordination

Use with UI, accessibility, security, or framework-specific review skills when the dogfood session uncovers implementation risks. Do not use `agent-browser` dogfood as the only quality layer for repeated critical paths; convert stable high-risk findings into deterministic regression tests.
