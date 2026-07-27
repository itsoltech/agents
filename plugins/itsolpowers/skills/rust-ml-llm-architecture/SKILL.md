---
name: rust-ml-llm-architecture
description: "Design Rust ML/LLM systems with Rig, Candle, agents, RAG, embeddings, and evals."
---

# Rust ML LLM Architecture

Separate orchestration, ML runtime, data, API, evals, and deployment concerns; treat model output and retrieved documents as untrusted inputs.

## Process

1. Identify access patterns, trust boundaries, runtime constraints, ownership, and operational requirements before choosing structure.
2. Prefer the simplest design that satisfies current requirements and leaves clear extension points for known near-term changes.
3. Make data flow, failure handling, observability, and rollout constraints explicit.
4. Translate the design into concrete implementation and review checks before coding.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Cel dokumentu; Założenia architektoniczne; Decyzja: Rig, Candle czy oba
- [Shared model configuration](../_shared/references/rust-ml-llm/model-configuration.md) - wspólne fakty dla decyzji architektonicznych
- [Shared Rig providers, models, and agents](../_shared/references/rust-ml-llm/rig-providers-models-agents.md) - wspólne fakty dla projektowania orkiestracji
- [Shared Candle runtime and tensors](../_shared/references/rust-ml-llm/candle-runtime-tensors.md) - wspólne fakty dla projektowania runtime
- [Shared ML/LLM function API](../_shared/references/rust-ml-llm/function-api.md) - wspólne fakty dla API, bezpieczeństwa i RAG
- [Shared Candle training, inference, and jobs](../_shared/references/rust-ml-llm/candle-training-inference-jobs.md) - wspólne fakty dla usług, integracji, observability, testów i deploymentu
- [07-edge-case-y.md](./references/07-edge-case-y.md) - Edge case'y
