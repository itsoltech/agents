---
name: ml-serving-mlops-review
description: "ML serving/MLOps review: model contracts, parity, rollout, monitoring, lineage, CI, security, debugging."
---

# ML Serving MLOps Review

Use this skill for production ML serving, MLOps, deployment review, monitoring, retraining, model cards, release gates, and ML debugging triage.

## Process

1. Identify the serving mode: batch, online, streaming, edge, embedded library, managed provider, or model server.
2. Inspect model contracts, input/output validation, feature manifests, preprocessing versions, artifact formats, fallback behavior, and train-serving parity tests.
3. Read [references/guide.md](references/guide.md), then load only the reference files matching the task surface.
4. For real project work, detect repo-pinned model/runtime/framework versions first. Use `itsol-current-tech-context` for current official docs before judging fast-moving model-serving APIs, registries, providers, or security defaults.
5. If Rust/Rig/Candle/provider runtime code is the primary surface, route first to `rust-ml-llm-architecture`, `rust-ml-llm-debugging`, or `rust-ml-llm-review`; use this skill for cross-cutting serving, MLOps, rollout, monitoring, and review concerns.
6. For large, multi-surface, production-impacting, security/privacy-sensitive, or release-sensitive ML PR reviews, use focused subagents before the final verdict. Split review by risk area: data/evaluation, training/experiments, LLM/RAG, serving/MLOps, security/privacy, QA/release, and `rust-ml-llm-review` when Rust/Rig/Candle code is primary.
7. Lead review output with concrete findings, severity, affected behavior, missing verification, rollback risk, and file references.

## Evidence

Prefer model contracts, schema tests, parity tests, registry records, model cards, CI logs, training run metadata, deployment manifests, monitoring dashboards, incident logs, eval reports, and release approvals over assumptions.
