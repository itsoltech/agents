# Usage Priority And Updates

Workflow defaults and restrictions use the canonical `itsol-workflow-mode` precedence. A task-level choice overrides only a repository default; root/project `allowed_modes` and all matching path/operation restrictions are cumulative intersections and cannot be overridden by task preference.

`.itsol.md` is a committed repository policy file for agents and humans. It captures stable operational facts about how to work safely in this repo.

## When To Read

Read root `.itsol.md` before:

- task intake or routing
- writing Business, Technical, or Technical Fix Plans
- deciding whether TDD is possible
- adding tests or test frameworks
- choosing verification commands
- running subagent-driven implementation
- code review, QA handoff, release, or incident work

If the file does not exist, continue with normal discovery. Do not create it unless the user asks, an approved plan includes it, or you discover a stable repo-level fact that should be proposed for team memory.

## Priority

Use this order when instructions conflict:

1. Platform safety and authority
2. Root plus most-specific project allowed-mode policy and matching restrictions
3. Explicit current-task mode choice
4. Matched repository default mode
5. Governed fallback and other ITSOL defaults
6. General model knowledge

If a conflict affects scope, tests, deployment, data, security, or delivery risk, stop and ask.

## Good Update Candidates

Propose `.itsol.md` updates for stable facts:

- no working automated test harness
- project-specific test commands
- test commands that are known to be flaky or obsolete
- generated-code commands and files that must not be edited manually
- deployment or migration order
- required env vars, local services, or seed data for verification
- manual QA smoke paths for legacy projects
- monorepo package ownership and command boundaries

Avoid adding:

- temporary findings from one task
- personal notes
- secrets
- ticket-specific TODOs
- speculative assumptions
