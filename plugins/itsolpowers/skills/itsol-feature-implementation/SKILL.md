---
name: itsol-feature-implementation
description: "Implement authorized ITSOL features or refactors with TDD, verification, and review."
---
# ITSOL Feature Implementation

Validate authorization through `itsol-workflow-mode` before production changes and preserve all seven state fields.

## Authorization

- `governed`: require the specific Business and Technical Plans to be genuinely user-approved with `artifact_state: approved`; a `Draft` is not authorized.
- `autonomous-planned`: require reviewed plans with `artifact_state: ready-for-execution`; never reinterpret them as user-approved. A `Draft` is not authorized.
- `direct`: require `artifact_state: not-required`; do not require plan files, plan paths, approvals, Decision Gates, or execution-mode approval.

Reject incomplete, inconsistent, or restriction-conflicting state. Then apply `.itsol.md`, inspect existing patterns, identify permissions/data/contracts/cache/events/jobs/deployment impact, load `itsol-tdd-workflow`, produce RED or a documented replacement check, implement the smallest GREEN change, refactor only while green, verify, and finish with `itsol-self-review`. Use `itsol-subagent-workflow` when the validated `execution_mode` requires it.

## Execution Policy

After resolving `itsol-workflow-mode`, load `itsol-execution-policy`, resolve the complete sibling execution state and observable `done_when`, and preserve both contracts through plans, task context, compaction, delegation, continuation, review, and handoff. Resource policy never changes workflow authority. Do not set `maxTurns`; do not accept agent termination or a `completed` label without validating evidence.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Zasada ogólna; Wspólny proces dla każdego zadania; Etap 4 - plan implementacji
- [02-praca-nad-nowa-funkcjonalnoscia.md](./references/02-praca-nad-nowa-funkcjonalnoscia.md) - Praca nad nową funkcjonalnością
- [03-pytania-do-gumowej-kaczki-przy-nowej-funkcjonalnosci.md](./references/03-pytania-do-gumowej-kaczki-przy-nowej-funkcjonalnosci.md) - Pytania do gumowej kaczki przy nowej funkcjonalności; Antywzorce przy nowych funkcjonalnościach; Checklista dla nowej funkcjonalności
- [04-proces-myslowy-przyklad-nowej-funkcjonalnosci.md](./references/04-proces-myslowy-przyklad-nowej-funkcjonalnosci.md) - Proces myślowy - przykład nowej funkcjonalności; Edge case'y, które deweloper powinien sam wymyślać
- [05-nawyki-dobrego-dewelopera.md](./references/05-nawyki-dobrego-dewelopera.md) - Nawyki dobrego dewelopera; Definicja gotowości zadania do implementacji; Definicja ukończenia zadania przez dewelopera
