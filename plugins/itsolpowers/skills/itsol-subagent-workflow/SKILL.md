---
name: itsol-subagent-workflow
description: "Subagent execution: task split, concurrency, review loops, commits, validation."
---

# ITSOL Subagent Workflow

Use this skill after a Business Plan and Technical Plan are approved by the user after presentation and the user chooses subagent-driven execution.

This skill is the canonical source for the ITSOL subagent task graph, task packet, statuses, write ownership, stop conditions, response contract, review loop, commit discipline, validation, and main-agent responsibilities.

## Process

1. Verify both plan files have `**Status:** Approved` and approval was not inferred from "direct user request", the original task request, `continue`, silence, or a generic main-agent statement.
2. Split the approved Technical Plan into a dependency-aware task graph with small, independent tasks and explicit ownership.
3. Establish the maximum number of implementation tasks that may run concurrently before starting delegation.
4. Assign each task with a structured task packet: goal, source of truth, read/write scope, forbidden scope, required skills, verification, response contract, budget, and stop conditions.
5. Enforce one writer for every file or shared contract at a time; serialize or convert work to read-only analysis when ownership is unclear.
6. When an implementation subagent finishes, validate its response contract and start a separate review subagent for that task's changed area.
7. Repeat implementation and review until every actionable review finding is resolved, explicitly deferred by the user, or recorded as a follow-up with risk.
8. After a task slice is implemented, reviewed, and verified, commit only that slice using Angular commit convention when committing is approved and allowed.
9. Run final validation for the whole change, compare the result against the approved plans, inspect the diff, resolve semantic conflicts, and summarize work for the user.

Codex guard: do not combine forked context with an explicit subagent role. If you need a forked Codex subagent, omit `agent_type` and name the ITSOL skill in the prompt or skill item. If you need `explorer` or `worker`, omit forked context and provide the minimal context manually.

Delegation depth guard: only the main agent starts subagents. A delegated subagent must not spawn another subagent, invoke `codex exec`, invoke `claude`, or use another agent CLI. If more delegation is needed, it returns a recommended split to the main agent.

Read [references/guide.md](references/guide.md) before delegating work. If the work is not approved for subagent-driven execution, use the normal inline workflow instead.
