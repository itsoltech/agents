# ML LLM RAG Engineering Reference Index

Use this routing index after reading `SKILL.md`. Load only the files needed for the current implementation, review, or debugging decision.

## Reference Routing

- LLM fit/anti-fit, prompt versioning, structured outputs, inference parameters, and untrusted output validation: read [01-llm-fit-prompting-output.md](01-llm-fit-prompting-output.md).
- RAG fit, ingestion, parsing, chunking, embeddings, retrieval, reranking, context trust, groundedness, citations, and retrieval evals: read [02-rag-retrieval-context.md](02-rag-retrieval-context.md).
- Fine-tuning, PEFT/LoRA, SFT, preference optimization, pretraining decisions, tokenizer/context length, quantization, and distillation: read [03-finetuning-peft-distillation.md](03-finetuning-peft-distillation.md).
- LLM evals, benchmark traps, safety guardrails, tool-calling, agent boundaries, privacy, security, and abuse tests: read [04-llm-evals-guardrails-agents.md](04-llm-evals-guardrails-agents.md).

## Version Policy

- Existing repo: implement against pinned model/provider SDKs, prompt versions, tokenizer, embeddings, vector index, reranker, schema validators, tool policies, and eval harnesses.
- New model/provider/fine-tuning decisions: use `itsol-current-tech-context` and current official docs or vendor references before recommending exact versions, model IDs, SDK APIs, or serving modes.
- Pin model revisions or deployment IDs where reproducibility matters. Do not rely on public benchmark claims without private task evals.
