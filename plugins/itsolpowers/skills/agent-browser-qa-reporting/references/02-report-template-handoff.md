# Report Template And Handoff

## QA Report Template

```markdown
# QA report - [feature/flow]

## Summary

- Verdict: pass / pass with risks / fail / blocked
- Tested scope:
- Environment:
- Deployment/build:
- Roles:
- Browser/device/viewport coverage:
- Key risks:

## Coverage

| Area | Status | Evidence | Notes |
| --- | --- | --- | --- |
| [flow/viewport/role/API/regression area] | covered/partial/blocked/untested/not-applicable | [artifact] | [short note] |

## Findings by severity

### S1

- [finding title] - [type] - [priority] - [confidence] - [evidence]

### S2

- [finding title] - [type] - [priority] - [confidence] - [evidence]

### S3

- [finding title] - [type] - [priority] - [confidence] - [evidence]

### S4 / observations

- [finding title] - [type] - [priority] - [confidence] - [evidence]

## Blocked or untested areas

- [area]: [reason], [impact], [needed unblocker]

## Evidence index

- [artifact path]: [what it proves], [redaction status], [limitations]

## Release / QA verdict

- Decision:
- Blocking issues:
- Non-blocking risks:
- Recommended regression checks:
- Next owner:
```

## Finding Template

```markdown
## [Severity] [Title]

- Type:
- Priority:
- Confidence:
- Environment:
- Role / data state:
- Steps:
  1. [step]
  2. [step]
- Expected:
- Actual:
- Evidence:
- Scope / impact:
- Suspected owner:
- Repro confidence:
- Suggested next verification:
```

## Verdict Language

- `pass`: tested scope meets acceptance criteria and no blocking findings remain
- `pass with risks`: no release blocker found, but gaps or non-blocking findings need explicit acceptance
- `fail`: blocking or high-impact finding prevents QA acceptance or release
- `blocked`: the session could not validate meaningful scope because of environment, data, access, or tooling

Tie verdicts to covered scope. Do not imply untested areas passed.

## QA Handoff Rules

- Give QA/testers exact scope, environment, roles, data setup, evidence, known gaps, and recommended regression checks.
- Link or list artifacts by safe path or sanitized reference. Do not paste raw sensitive payloads.
- Remove or redact secrets, PII, tokens, cookies, auth state, authorization headers, session identifiers, sensitive tenant data, and private business content.
- Mark any artifact that could not be safely shared and provide a sanitized summary instead.
- State whether destructive actions were performed and whether cleanup is required.
- Include blocked areas with the owner or unblocker needed.

## Evidence Quality

Good evidence is tied to a specific run, role, viewport, deployment, and action. Prefer evidence that shows both the user-visible behavior and the correlated diagnostics when the diagnostics matter.

Avoid:

- orphan screenshots without steps or environment
- console/network dumps without user-visible correlation
- conclusions based only on automation errors
- mixed artifacts from different deployments without noting the mismatch
