# Router Reference

Use this file only after the router selects work that needs delegation or a durable handoff.

## Delegated packet

Carry a stable work-item ID; all seven `itsol-workflow-mode` fields; approved/ready/not-required artifact evidence appropriate to the mode; execution policy and `done_when`; dependency state; narrow read/write/forbidden scope; one semantic owner; selected skills; RED/GREEN or an explicit replacement check; allowed terminal statuses; and stop/escalation conditions.

Only the main agent delegates. Keep writers disjoint. A different read-only reviewer checks each implementation slice; concrete material findings return to the same writer for a bounded fix and targeted verification. A stopped child is not automatically complete.

## Handoff

Report changed and inspected files, commands and observed results, assumptions, unverified items, coverage gaps, risks, blockers, integration dependencies, and the next review target. Preserve `completed`, `partial`, `blocked`, or `failed` exactly.

For a separately authorized commit, inspect the exact diff, stage only the verified coherent slice, use Angular convention, and never imply authority to push, publish, release, or deploy.
