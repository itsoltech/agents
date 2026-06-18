# Metrics Baselines Success

## Business And Model Metrics

Treat model metrics as proxies for the business decision. Define:

- primary metric used to compare model candidates
- secondary metrics that explain tradeoffs
- guardrails the model must not degrade
- segment-level reporting for protected, high-value, regional, tenant, device, or operational cohorts
- minimum practically useful improvement over baseline
- operational capacity, latency, compute, memory, cost, and review workload
- threshold selection policy and who approves it

Match metric choice to error cost. Use precision when false positives are expensive, recall when false negatives are expensive, calibration when probabilities drive downstream decisions, and ranking metrics when a fixed-capacity queue or top-K surface is the product behavior.

## Baseline First

Every project needs a baseline before complexity increases. Useful baselines include:

- current business rule or production model
- average, median, majority class, or random policy with known distribution
- last known value for forecasting
- popularity or simple collaborative signal for recommendations
- keyword/BM25 search before RAG
- TF-IDF plus logistic regression before transformers
- simple linear model, tree, or gradient boosting with conservative defaults

Do not green-light large model training when there is no stable evaluator, baseline, split strategy, or expected minimum improvement.

## Guardrails

Add guardrails for:

- p95/p99 latency and timeout behavior
- daily or per-request inference cost
- memory, throughput, queue length, and batch limits
- false positive/false negative rates in critical segments
- calibration drift and confidence reporting
- fallback rate, human review load, and refusal rate
- privacy, safety, policy, and license constraints

## Acceptance Criteria

A planning artifact is ready when it states the baseline, primary metric, guardrails, segment reporting, test set discipline, rollout gate, rollback condition, and what result would make the ML approach not worth continuing.
