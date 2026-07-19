## Codex harness adapter

- Use Codex's native subagent capability for ITSOL delegation; do not call Pi `itsol_*` tools and do not use an ITSOL skill name as `agent_type`.
- For automatic Business, Technical, or Technical Fix Plan review, fork a fresh read-only review context, instruct it to load and follow `itsol-self-review`, pass the plan-review contract and bounded scope, wait for its verdict, resolve material findings, and rerun before user handoff.
- Under `itsol-workflow-mode`, Codex plan review is pre-authorized by a planned workflow within execution ceilings; it does not require a separate execution-mode or reviewer-authorization question.
