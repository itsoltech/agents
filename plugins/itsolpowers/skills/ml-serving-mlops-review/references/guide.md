# ML Serving MLOps Review Reference Index

Use this index to choose focused guidance. Do not load every reference unless the task spans the full production ML surface.

## How To Use

1. Identify changed surfaces: serving contract, train-serving parity, rollout, monitoring, retraining, lineage, registry, model card, CI/CD, security/privacy, fairness, debugging, or review.
2. Open only the reference files that match those surfaces.
3. For repo work, detect pinned runtimes, model formats, providers, framework versions, deployment platforms, and registry tooling before judging implementation choices. Use `itsol-current-tech-context` when current official docs are needed.

## Reference Files

- `01-serving-contracts-parity.md` - serving modes, contracts, validation, train-serving parity, batching, scaling, fallback, and model formats.
- `02-deployment-monitoring-retraining.md` - shadow, canary, A/B, champion/challenger, rollback, monitoring, drift, and retraining.
- `03-lineage-model-cards-ci.md` - lineage, registry records, model cards, CI/CD jobs, training pipeline gates, and promotion checks.
- `04-security-privacy-fairness.md` - data privacy, supply chain, model attacks, LLM/agent security, risk management, and segment fairness.
- `05-debugging-and-review.md` - debugging symptoms, edge cases, ML testing, ML Test Score readiness, and large ML PR review split.
