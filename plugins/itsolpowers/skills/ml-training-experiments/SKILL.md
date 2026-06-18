---
name: ml-training-experiments
description: "ML training/experiments: Python repo structure, frameworks, tracking, configs, checkpoints, performance, distributed training."
---

# ML Training Experiments

Run ML experiments as reproducible engineering work: scoped hypotheses, pinned code/data/config, tracked results, resumable training, and clear promotion decisions.

## Process

1. Inspect repo-pinned Python version, package manager, lockfile, CUDA/driver notes, framework versions, configs, CI, experiment tracking, dataset/versioning, and hardware assumptions before choosing commands or tools.
2. For new-project or version-sensitive framework choices, use `itsol-current-tech-context`; avoid hardcoding fast-moving package versions in plans or skill output.
3. Read [references/guide.md](references/guide.md), then load only the focused reference files needed for the training or experiment decision.
4. Start with a baseline and one written hypothesis. Keep one primary metric, explicit guardrails, fixed data/split/evaluator/budget, and a keep/discard/inconclusive/crash decision for every run.
5. Keep training code in importable modules with explicit configs. Notebooks may explore and report, but must not be the only implementation.
6. Record run metadata: code commit, dirty state, lockfile/container digest, dataset and split version, config, seed policy, hardware, metrics, resources, cost, artifacts, and decision rationale.
7. Before scaling training, prove the loop at small scale: forward/backward pass, overfit one batch, overfit a small subset, smoke eval, profiler, and cost estimate.
8. Treat checkpoints as resumable training state, not only model weights. Test resume and retention before long runs.
9. Add focused verification: lint/format/typecheck, unit/data-contract tests, smoke train, smoke inference, small golden eval, checkpoint resume, export compatibility, and dependency/security checks where applicable.

## Coordination

Use with `ml-data-evaluation` for datasets, splits, leakage, metrics, and error analysis; `ml-serving-mlops-review` for model promotion, registry, serving contracts, monitoring, and rollout; `itsol-current-tech-context` for current framework/package decisions; `security-*` skills when datasets, models, notebooks, tracking servers, or artifacts contain sensitive data. For Rust/Rig/Candle training or runtime code, route first to the existing `rust-ml-llm-*` skills and use this skill only for cross-cutting experiment discipline.
