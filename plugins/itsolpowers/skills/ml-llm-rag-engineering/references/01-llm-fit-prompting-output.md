# LLM Fit, Prompting, And Output Validation

## Use An LLM When

- The task needs natural-language reasoning, generation, summarization, extraction, or work over unstructured documents.
- Output may be nondeterministic but can be validated.
- Cost and latency of the external or local model are acceptable.
- A simpler parser, rules engine, search system, or classical classifier is not enough.
- The team has an eval dataset and a way to measure response quality.

## Do Not Use An LLM For

- Authorization or access control.
- Financial or safety-critical calculations that require exact deterministic math.
- Schema validation when a normal parser can do it.
- Deterministic transformations that can be expressed as code.
- Unbounded tool execution without a policy layer.
- Irreversible decisions without validation and human or policy control.

## Prompt Versioning

Every production prompt should have:

- name and version
- owner
- model/provider policy
- input schema
- output schema
- inference parameters
- eval dataset
- changelog

Version prompt, model, schema, tools, and evals together. A prompt change without eval evidence is a behavior change without a test.

## Prompting Practices

- State task, constraints, allowed sources, output format, and refusal behavior explicitly.
- Prefer examples that represent real edge cases, not only happy paths.
- Keep system/developer instructions separate from user and retrieved content.
- Do not place secrets, tenant data, or privileged policy details in context unless the model needs them and access is authorized.
- Treat prompt text as guidance, not a security boundary.

## Structured Outputs

Structured output is useful for extraction, workflow handoff, and tool arguments, but it is not trusted data.

Validate:

- JSON syntax or protocol framing
- required and additional fields
- scalar types and enum values
- length, ranges, currency, units, and identifiers
- cross-field constraints
- references to entities the user can access
- escaping before SQL, shell, HTML, Markdown, logs, or API calls
- idempotency keys for write actions and retries

Reject or repair explicitly; do not silently coerce dangerous values.

## Inference Parameters

Version temperature, top_p, top_k, max_new_tokens, stop sequences, penalties, beam width, response schema, and tool-calling mode. These settings affect correctness, cost, latency, and reproducibility.
