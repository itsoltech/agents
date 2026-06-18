# Problem And ML Fit

## Problem Definition

Write the problem as a decision contract, not as a model request. Capture:

- user or downstream system using the result
- decision made from the result
- prediction unit, such as transaction, user, document, item, session, or text chunk
- prediction moment and data available at that moment
- target or expected result and prediction horizon
- latency, throughput, and cost limits
- false positive, false negative, and no-decision cost
- uncertainty handling, human handoff, fallback, and refusal rules
- auditability, privacy, license, and security constraints
- owner for business outcome, data, model, and operation

## ML Fit Questions

Ask before approving ML work:

- Can stable deterministic rules solve the case?
- Is there enough representative data or a realistic path to collect it?
- Is the label trustworthy and available at training time?
- Does the world change quickly enough to require retraining?
- Does the model need explainability or auditable reasons?
- Can the product tolerate probabilistic output?
- Can high-risk predictions be handed to a human?
- Are latency, inference cost, data license, and privacy acceptable?

## Prefer Rules Or Existing Systems When

- the rules are complete, stable, and testable
- errors are unacceptable and the result must be deterministic
- the sample size is small or labels are not reliable
- legal, contractual, or configuration logic defines the decision
- a simple heuristic, search, parser, or current process performs as well as ML

## Choose The Model Family Deliberately

- Classic ML fits tabular prediction, ranking, scoring, low latency, and interpretable baselines.
- Deep learning fits image, audio, text, signals, pretrained representations, or very large data.
- LLMs and generative models fit natural language, unstructured documents, RAG, extraction, or generation only when outputs can be evaluated and validated.
- Do not use LLMs for authorization, financial calculations requiring exactness, schema validation instead of parsers, deterministic transforms, or irreversible actions without a policy layer and human control.
