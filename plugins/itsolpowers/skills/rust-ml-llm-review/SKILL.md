---
name: rust-ml-llm-review
description: "Rust ML/LLM review: Rig, Candle, agents, RAG, embeddings, streaming, evals, security."
---

# Rust ML LLM Review

Review LLM systems for layer boundaries, prompt/tool safety, provider abstraction, RAG trust, output validation, resource budgets, observability, evals, and deployment constraints.

## Process

1. Inspect the diff and surrounding code before applying checklist items.
2. Check correctness, boundaries, security, data flow, observability, tests, and deployment impact for the changed behavior.
3. Report concrete findings first, ordered by severity, with file references and affected behavior.
4. Call out missing tests or residual risk only when it is tied to the reviewed change.

## Large PR Subagent Review

For broad or materially risky pull requests, recommend focused additional review only when independent expertise is likely to improve the verdict. Judge this from concrete risk, novelty, blast radius, reversibility, and context size—not file count or category matching alone. Small and conventional changes should remain one pragmatic pass.

When additional reviewers add value, split only by independent material surfaces. Each returns concrete evidence-based findings; the main agent removes duplicates and false positives and owns the proportional final verdict.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Założenia architektoniczne; Decyzja: Rig, Candle czy oba; Warstwy systemu
- [Shared model configuration](../_shared/references/rust-ml-llm/model-configuration.md) - wspólne fakty; oceń diff według review flow
- [Shared Rig providers, models, and agents](../_shared/references/rust-ml-llm/rig-providers-models-agents.md) - wspólne fakty; użyj ich jako review rubryku orkiestracji
- [Shared Candle runtime and tensors](../_shared/references/rust-ml-llm/candle-runtime-tensors.md) - wspólne fakty; użyj ich jako review rubryku runtime
- [Shared ML/LLM function API](../_shared/references/rust-ml-llm/function-api.md) - wspólne fakty; użyj ich jako review rubryku API, safety i RAG
- [Shared Candle training, inference, and jobs](../_shared/references/rust-ml-llm/candle-training-inference-jobs.md) - wspólne fakty; użyj ich jako review rubryku usług, testów i deploymentu
- [07-edge-case-y.md](./references/07-edge-case-y.md) - Edge case'y; Checklist do code review; Minimalny zestaw CI; Przykładowe reguły merge requestu
