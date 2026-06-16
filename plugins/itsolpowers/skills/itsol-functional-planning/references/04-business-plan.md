# Business Plan

## Business Plan

The Business Plan must be understandable without reading code and complete enough for stakeholders, QA, and implementation agents to understand what must change. Use this structure:

```markdown
# <Feature or Change> Business Plan

**Status:** Draft
**Created:** YYYY-MM-DD
**Related request:** <short summary or ticket link>
**Technical Plan:** <path when available>

## Goal
<One paragraph describing the user-visible outcome and why it matters.>

## Current Behavior
<What happens now, including pain points or missing capability.>

## Desired Behavior
<What should happen after the change from the user's point of view.>

## Users And Roles
<Affected users, roles, permissions, tenant boundaries, data ownership, and actor-specific behavior.>

## Scope
### In Scope
- <Concrete behavior included>

### Out Of Scope
- <Explicit exclusions>

## Business Rules
- <Rule, condition, edge case, negative path, or policy>

## Acceptance Criteria
- [ ] <Observable criterion QA and the user can verify>

## UX, Copy, And API Behavior
<Visible UI/API behavior, messages, empty states, errors, notifications, or response semantics.>

## Data And Audit Expectations
<What data is read, written, retained, exposed, audited, or migrated.>

## QA Scenarios
- <Manual or automated scenario, including negative and permission cases>

## Risks
- <Business, operational, user, legal, data, migration, rollout, or compatibility risk>

## Assumptions
- <Assumption that must be true for this plan>

## Open Questions
- <Question or "None">
```

After Plan Self-Review and Rubber Duck Plan Review pass, present the plan path and summary, then end with an explicit approval request:

`Business Plan saved to <path>. Approve this file before I prepare the Technical Plan.`
