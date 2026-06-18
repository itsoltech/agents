# LLM Evals, Guardrails, And Agents

## Eval Layers

Combine scorers:

- deterministic: exact match, schema validation, regex, unit tests, executable checks
- semantic: embedding similarity or task-specific judge model
- retrieval: document recall, chunk relevance, groundedness, citation correctness
- LLM judge: rubric-based natural-language scoring
- human review: calibrated sample review
- operational: latency, tokens, cost, retries, tool calls
- safety: prompt injection, PII exposure, prohibited actions, unsafe tool use

Prefer code-based scorers when correctness can be checked programmatically. Version and calibrate LLM judges against human review; treat them as models that can drift or be biased.

## Benchmark Traps

- Prompt format can change scores.
- Response parsers can inflate or deflate results.
- Public benchmarks may be in pretraining data.
- Repeated tuning overfits the benchmark.
- Sampling needs multiple trials for stable estimates.
- One benchmark does not describe app behavior.
- LLM judges may prefer style, length, or model family.

Use public benchmarks only as supporting evidence. Private domain evals, golden sets, challenge sets, safety cases, and operational metrics decide product readiness.

## Guardrails

Guardrails should be layered:

- input validation and classification
- retrieval/source filters
- prompt/tool policy
- output schema validation
- authorization in code, not in prompt
- cost, step, and retry limits
- human approval or policy checks for destructive actions
- audit logs without leaking secrets or sensitive personal data
- safe fallback and refusal behavior

Guardrails do not replace evals. Test bypasses and failure modes.

## Tool Calling And Agents

- Keep tool permissions minimal.
- Separate read tools and write tools.
- Validate tool arguments before execution.
- Re-check authorization at the tool boundary.
- Require confirmation or policy approval for destructive or irreversible actions.
- Limit steps, recursion, parallel calls, and spend.
- Make writes idempotent when retries are possible.
- Sandbox generated code before execution.
- Log tool calls with request IDs and redacted inputs.

Agent behavior must be constrained by code and policy. Prompt instructions are not access control.

## Security And Privacy

- Classify data and minimize PII.
- Encrypt sensitive data in transit and at rest.
- Restrict access to datasets, prompts, traces, tracking servers, model artifacts, and eval results.
- Pin model revisions and verify licenses and checksums.
- Prefer safe model artifact formats where possible.
- Treat pickle, custom ops, and remote model code execution as untrusted code.
- Keep tenant data separated through retrieval, tool calls, logs, and caches.
- Filter logs and traces for secrets and PII.
- Validate and escape LLM output before SQL, shell, HTML, Markdown, or API use.

## Test Cases

Cover malformed JSON, extra fields, missing required fields, wrong tool argument types, nonexistent tools, prompt injection in input, prompt injection in RAG documents, false refusals, hallucinated sources, missing sources, conflicting sources, very long context, unexpected language, repetition, partial streams, interrupted connections, duplicate retries, and resource-exhaustion attempts.
