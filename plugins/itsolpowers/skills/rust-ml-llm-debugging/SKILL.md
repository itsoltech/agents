---
name: rust-ml-llm-debugging
description: "Debug Rust ML/LLM providers, tools, RAG, Candle, GPU, latency, and evals."
---

# Rust ML LLM Debugging

Debug ML/LLM behavior by separating provider, prompt, tool, retrieval, model runtime, validation, budget, observability, and deployment layers.

## Process

1. State expected behavior, actual behavior, impact, and the smallest reproducible symptom.
2. Gather evidence from code, logs, traces, metrics, generated output, database plans, config, or failing tests before proposing a fix.
3. Isolate the boundary that fails and compare it with a known working path.
4. Implement one root-cause fix with focused verification or a regression test where feasible.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

## Focused References

- [Shared Rig providers, models, and agents](../_shared/references/rust-ml-llm/rig-providers-models-agents.md) - wspólne fakty; rozpocznij od lokalnego [debugging wrapper](./references/01-overview.md)
- [Shared Candle runtime and tensors](../_shared/references/rust-ml-llm/candle-runtime-tensors.md) - wspólne fakty; w debugowaniu izoluj device, dtype, tokenizację, artefakt i inferencję
- [Shared ML/LLM function API](../_shared/references/rust-ml-llm/function-api.md) - wspólne fakty; w debugowaniu rozdziel kontrakt, provider, safety, retrieval i output
- [04-candle-trening-inference-service-i-joby.md](./references/04-candle-trening-inference-service-i-joby.md) - Candle: trening, inference service i joby; Integracja z frontendem; Observability, koszty i audyt; Testy i ewaluacje
- [05-edge-case-y.md](./references/05-edge-case-y.md) - Edge case'y; Minimalny zestaw CI
