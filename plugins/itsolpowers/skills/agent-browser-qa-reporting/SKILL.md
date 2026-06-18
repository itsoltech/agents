---
name: agent-browser-qa-reporting
description: "Agent-browser QA reporting: coverage matrices, finding taxonomy, severity, evidence-based handoffs, release verdicts, and regression follow-up after browser dogfood or pre-QA validation."
---

# Agent Browser QA Reporting

Use this skill to turn `agent-browser` dogfood, pre-QA validation, focused reproduction, or fix-verification output into a clear QA report and tester handoff.

## Process

1. Confirm the reporting contract: tested scope, target environment, deployment/build, browser or device set, roles, acceptance criteria, artifacts, and who will consume the report.
2. Before any command-sensitive `agent-browser` work, check the installed command surface first:
   - `agent-browser --version`
   - `agent-browser --help`
3. If the installed CLI version supports versioned or local guidance such as `agent-browser skills get core` or `agent-browser skills get dogfood`, load it and treat it as the source of truth for exact commands, flags, artifact paths, and behavior. Older versions may not provide those commands.
4. Treat static CLI examples as patterns only.
5. Build the coverage matrix before writing conclusions. Mark each area as covered, partially covered, blocked, untested, or not applicable, and state why.
6. Normalize findings with type, severity, priority, confidence, reproducibility, evidence, and next verification. Do not file a product bug from tooling failure alone.
7. Redact secrets, PII, tokens, cookies, auth state, authorization headers, tenant-sensitive data, and sensitive payloads before sharing the report or evidence.
8. Separate facts from hypotheses. Keep suspected owners and root-cause notes provisional unless implementation evidence confirms them.
9. Read [references/guide.md](references/guide.md), then load only the focused reference files needed for the report or follow-up.

## Output Standard

Every QA report should include:

- summary and release or QA verdict
- coverage matrix and untested or blocked areas
- findings grouped by severity, with evidence references
- environment and deployment metadata
- evidence index with redaction status
- regression follow-up or retest scope when fixes are involved

Every actionable finding should include title, environment, steps, expected result, actual result, evidence, scope or impact, suspected owner, repro confidence, and suggested next verification.

## Coordination

Use with `agent-browser-dogfood-workflow` when the session still needs exploration or coverage expansion. Use with `agent-browser-diagnostics-evidence` when findings need stronger console, network, screenshot, video, HAR, trace, profiler, or Web Vitals evidence. Use with QA, security, accessibility, performance, or framework-specific skills when the report identifies deeper specialist risks.
