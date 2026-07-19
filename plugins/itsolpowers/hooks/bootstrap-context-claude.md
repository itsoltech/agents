## Claude Code harness adapter

- Use Claude Code's native Agent/Task delegation surface for ITSOL subagents; do not call Pi `itsol_*` tools.
- Persist Initiative Delivery state in `.itsol/initiatives/<id>/`; use native Agent/Task workstreams phase by phase and update canonical traceability after validated results.
- For automatic Initiative Roadmap, Business, Technical, or Technical Fix Plan review, launch the bundled `itsol-self-review` agent in a fresh read-only context, pass the plan-review contract and bounded scope, wait for its verdict, resolve material findings, and rerun before user handoff.
- Under `itsol-workflow-mode`, Claude plan review is pre-authorized by a planned workflow within execution ceilings; it does not require a separate execution-mode or reviewer-authorization question.
