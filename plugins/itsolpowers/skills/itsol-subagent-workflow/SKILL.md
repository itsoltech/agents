---
name: itsol-subagent-workflow
description: "Subagent execution: task split, concurrency, review loops, commits, validation."
---

# ITSOL Subagent Workflow

Use this skill after a Business Plan and Technical Plan are approved by the user after presentation and the user chooses subagent-driven execution.

## Process

1. Verify both plan files have `**Status:** Approved` and approval was not inferred from "direct user request", the original task request, `continue`, silence, or a generic main-agent statement.
2. Split the approved Technical Plan into small, independent implementation tasks with clear file or module ownership.
3. Establish the maximum number of implementation tasks that may run concurrently before starting delegation.
4. Assign each task to the narrowest suitable subagent and give it scope, constraints, expected output, verification, and owned files.
5. When an implementation subagent finishes, start a separate review subagent for that task's changed area.
6. Repeat implementation and review until every actionable review finding is resolved or explicitly deferred by the user.
7. After a task slice is implemented, reviewed, and verified, commit only that slice using Angular commit convention.
8. Run final validation for the whole change, compare the result against the approved plans, inspect the diff, and summarize work for the user.

Read [references/guide.md](references/guide.md) before delegating work. If the work is not approved for subagent-driven execution, use the normal inline workflow instead.
