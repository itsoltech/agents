## Codex harness adapter

- Use Codex's native subagent capability for ITSOL delegation; do not call Pi `itsol_*` tools and do not use an ITSOL skill name as `agent_type`.
- Persist Initiative Delivery state in `.itsol/initiatives/<id>/`; use native subagent workstreams phase by phase and update canonical traceability after validated results.
- For Initiative Roadmap review, fork read-only panel contexts for requirements, technical architecture, QA, self-review, plus security/data when relevant. For Business, Technical, or Technical Fix Plans use fresh `itsol-self-review`. Resolve every material finding and rerun before handoff.
- For Initiative QA, build application-aware packets and use native subagents plus the appropriate browser, CLI, API, desktop/mobile, data, or infrastructure capability. Persist fingerprint-bound verdicts; failures return through fix/replan and applicable reviews before fresh QA.
- Under `itsol-workflow-mode`, Codex plan review is pre-authorized by a planned workflow within execution ceilings; it does not require a separate execution-mode or reviewer-authorization question.
