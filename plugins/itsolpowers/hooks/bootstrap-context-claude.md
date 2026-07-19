## Claude Code harness adapter

- Use Claude Code's native Agent/Task delegation surface for ITSOL subagents; do not call Pi `itsol_*` tools.
- Persist Initiative Delivery state in `.itsol/initiatives/<id>/`; use native Agent/Task workstreams phase by phase and update canonical traceability after validated results.
- For Initiative Roadmap review, launch a read-only panel using `itsol-requirements-review`, `itsol-technical-planning`, `itsol-qa-handoff`, `itsol-self-review`, plus security/data specialists when relevant. For Business, Technical, or Technical Fix Plans use fresh `itsol-self-review`. Resolve every material finding and rerun before handoff.
- For Initiative QA, build application-aware packets and use native Agent/Task plus the appropriate browser, CLI, API, desktop/mobile, data, or infrastructure capability. Persist fingerprint-bound verdicts; failures return through fix/replan and applicable reviews before fresh QA.
- Under `itsol-workflow-mode`, Claude plan review is pre-authorized by a planned workflow within execution ceilings; it does not require a separate execution-mode or reviewer-authorization question.
