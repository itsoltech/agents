# Security Privacy And Fairness

## Data Privacy

Treat datasets, prompts, retrieved documents, model outputs, model artifacts, eval traces, and tracking servers as sensitive unless proven otherwise:

- classify data and minimize PII
- pseudonymize identifiers where possible
- encrypt data at rest and in transit
- restrict access to datasets, artifacts, registries, tracking servers, and admin functions
- log administrative access
- define retention and deletion procedures
- avoid uncontrolled production-data copies on laptops
- separate tenants and customers
- treat synthetic data as potentially revealing source information

## Supply Chain

Review the model supply chain like executable code:

- pin dependencies and model revisions
- scan images and packages
- keep an SBOM or equivalent dependency inventory
- fetch models from trusted sources
- verify checksums
- check data and model licenses
- prefer non-executable weight formats where available
- treat pickle, custom ops, and remote model code as foreign code execution

## Model Attacks

Consider these risk classes:

- data poisoning, backdoors, adversarial examples, evasion, and training-data contamination
- model extraction, membership inference, model inversion, and sensitive-data memorization
- prompt injection, insecure output handling, unsafe tool calls, and retrieval poisoning
- denial of wallet, denial of compute, unbounded context growth, and expensive retries

Mitigations should be proportional to risk: source controls, evals, validation, sandboxing, rate limits, budget limits, monitoring, approval flows, and incident procedures.

## LLM And Agent Security

For LLM and agent systems:

- prompts are not security boundaries
- authorization belongs in tool/server code
- each tool needs minimum permissions
- separate read tools and write tools
- destructive actions require confirmation or policy checks
- validate tool-call arguments and model output
- limit steps, tokens, concurrency, and spend
- treat retrieved documents as untrusted input
- do not execute generated code without a sandbox
- keep secrets out of context unless strictly needed
- filter logs and traces for PII and secrets
- validate and escape model output before passing it to SQL, shell, HTML, APIs, or business workflows

## Risk Management

For higher-risk systems, require explicit governance:

- owners, policies, approvals, and accountability
- context, users, stakeholders, and possible harms
- measurable tests, evals, thresholds, and monitoring
- mitigations, response playbooks, and residual-risk acceptance

## Fairness And Segments

Do not rely only on a global metric:

- identify groups where errors have different cost
- check representation and label quality per segment
- report false positives, false negatives, calibration, abstention, and latency per important segment
- document tradeoffs between fairness metrics
- avoid proxy sensitive attributes without analysis
- removing one sensitive feature is insufficient if other features reconstruct it
- provide appeal, human review, or escalation paths for decisions that materially affect people

Fairness review requires data and outcome analysis, not a single metric after training.
