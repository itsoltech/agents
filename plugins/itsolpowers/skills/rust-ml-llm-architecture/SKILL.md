---
name: rust-ml-llm-architecture
description: "Rust ML/LLM architecture: Rig, Candle, agents, RAG, embeddings, inference, evals."
---

# Rust ML LLM Architecture

Separate orchestration, ML runtime, data, API, evals, and deployment concerns; treat model output and retrieved documents as untrusted inputs.

## Process

1. Identify access patterns, trust boundaries, runtime constraints, ownership, and operational requirements before choosing structure.
2. Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files, then read only relevant sector files.
3. Prefer the simplest design that satisfies current requirements and leaves clear extension points for known near-term changes.
4. Make data flow, failure handling, observability, and rollout constraints explicit.
5. Translate the design into concrete implementation and review checks before coding.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.
