---
name: ml-llm-rag-engineering
description: "LLM/RAG engineering: prompting, structured output, retrieval, fine-tuning, evals, guardrails, tool-calling safety."
---

# ML LLM RAG Engineering

Build LLM and RAG systems around explicit trust boundaries: prompts, retrieved context, generated outputs, tool calls, and model artifacts are untrusted until validated.

## Process

1. Decide whether an LLM is fit for the task. Prefer rules, parsers, search, or classical classifiers when deterministic, cheaper, auditable code solves the problem.
2. Inspect pinned providers/models, tokenizer, prompt versions, retrieval stack, vector index, eval datasets, schema validators, tool permissions, latency/cost budgets, and privacy constraints before changing behavior.
3. For current provider, SDK, model, tokenizer, embedding, reranker, vector database, or fine-tuning choices, use `itsol-current-tech-context`; avoid static version claims.
4. Read [references/guide.md](references/guide.md), then load only the focused reference files needed for prompting, RAG, fine-tuning, evals, guardrails, or agents.
5. Version prompts, schemas, retrieval config, model IDs/revisions, inference parameters, tool policies, and evals together.
6. Validate all generated output before use. Structured output still needs schema validation, bounds checks, escaping, authorization, and idempotency where applicable.
7. Treat retrieved documents as untrusted input. Separate retrieval relevance from answer correctness, groundedness, and citation correctness.
8. Add focused verification: malformed outputs, prompt injection in user input and retrieved documents, missing/false citations, tool-call argument validation, long context, retries, partial streams, cost limits, safety cases, and private domain evals.

## Coordination

Use with `ml-data-evaluation` for eval datasets, labels, leakage, metrics, and error analysis; `ml-training-experiments` for fine-tuning runs and training mechanics; `ml-serving-mlops-review` for serving contracts, monitoring, rollback, lineage, and production review; focused `security-*` skills for prompt injection, tenant boundaries, sensitive data, tool authorization, and output handling. For Rust/Rig/Candle/provider/runtime code, route first to the existing `rust-ml-llm-*` skills and use this skill for cross-cutting LLM/RAG design and evaluation.
