---
name: agent-browser-diagnostics-evidence
description: "Agent-browser diagnostics and evidence: console, network, HAR, trace, profiler, vitals, screenshots, videos, redaction."
---

# Agent Browser Diagnostics Evidence

Use this skill when an `agent-browser` task needs console, JavaScript error, network, HAR, trace, profiler, Web Vitals, screenshot, video, or artifact evidence for frontend dogfood, reproduction, or QA handoff.

## Process

1. Before command-sensitive work, check the local tool contract:
   - `agent-browser --version`
   - `agent-browser --help`
2. If the installed CLI supports versioned local guidance such as `agent-browser skills get core` or `agent-browser skills get dogfood`, load it and prefer that output when syntax differs. Older versions may not provide those commands.
3. Treat static command snippets as patterns, not permanent CLI truth.
4. Define the focused repro before collecting heavy artifacts: URL, role, viewport, data state, expected result, action, and suspected failure.
5. Clear old console/error/network context when supported, run the scenario, then correlate user-visible behavior with console entries and request timing.
6. Use HAR, trace, profiler, and vitals only around focused reproductions or measured performance questions. Do not make broad recordings by default.
7. Redact secrets, PII, tokens, cookies, auth state, authorization headers, business data, and sensitive URLs before sharing or committing artifacts.
8. Separate facts from hypotheses. Report observed UI behavior, exact timing, artifact paths, environment, and confidence before explaining likely causes.
9. Read [references/guide.md](references/guide.md), then load only the focused reference files needed for the evidence task.

## Evidence Standard

Every confirmed finding should connect:

- expected result and actual result
- reproduction steps and artifact names
- console/page errors relevant to the action
- network request status, timing, correlation ID, or retry behavior when relevant
- screenshot or video evidence that matches the written steps
- redaction status and any artifact limitations

Do not classify tooling failures, stale element references, blocked waits, missing test data, or environment outages as product defects unless the app behavior is independently reproduced.

## Coordination

Use with `agent-browser-interaction-debugging` when stale references, waits, modals, tabs, frames, loading, or flaky interactions may explain the symptom. Use with `agent-browser-qa-reporting` when turning evidence into findings or a QA handoff. Use with `agent-browser-security-production-safety` for production sessions, auth state, cookies, tenant data, destructive actions, or sensitive artifact handling.
