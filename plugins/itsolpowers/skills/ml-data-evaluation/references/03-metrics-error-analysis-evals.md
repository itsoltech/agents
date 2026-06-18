# Metrics Error Analysis Evals

## Task Metrics

Classification:

- accuracy only when class balance and error cost are similar
- precision when false positives are expensive
- recall when false negatives are expensive
- F1 as a compromise, not a business cost model
- ROC-AUC for ranking across thresholds, with caution under heavy imbalance
- PR-AUC for rare positives
- log loss, Brier score, and calibration curves for probabilities
- confusion matrix and metrics per segment

Regression: report MAE, RMSE, R2 only with business-unit errors, residual distributions, and segment slices. Use quantile or pinball loss when intervals or asymmetric costs matter.

Ranking, retrieval, and recommendation: report Recall@K, Precision@K, MRR, NDCG@K, hit rate, coverage, latency, and reranking cost.

Forecasting: report error per horizon, rolling backtest results, interval coverage, and the exact definition of percentage metrics.

## Calibration

Good ranking does not guarantee useful probabilities. Check reliability curves, Brier score, calibration per segment, and calibration under drift. Thresholds belong on validation data and should reflect error cost and operational capacity.

## LLM And Generative Evals

Build eval datasets with multiple scorer types:

- deterministic: exact match, schema validation, regex, unit test, execution result
- semantic: embedding similarity or task-specific model
- retrieval: relevance, document recall, citation correctness
- LLM judge: versioned rubric and prompt, calibrated against human review
- human review: sampled, rubric-based, and tracked
- operational: latency, tokens, cost, tool calls, retries
- safety: prompt injection, PII, prohibited actions, and policy violations

Evaluate retrieval separately from generation in RAG. Public benchmarks are not enough; keep private domain evals and challenge sets.

## Error Analysis

After important experiments, categorize errors and estimate each category's frequency and cost:

- wrong label
- missing input data
- unknown category
- out-of-training-scope case
- preprocessing bug
- segment-specific failure
- threshold too low or high
- insufficient model capacity
- overfitting
- missing retrieval source
- generated output format violation
- tool failure
- evaluator mistake

Do not fix one example unless it represents a repeated pattern.

## Data And Eval Testing

Test data schema, ranges, nulls, duplicates, relationship integrity, split leakage, target distribution, temporal correctness, point-in-time joins, and forbidden columns.

Test metrics, thresholding, calibration code, challenge sets, scorer determinism, LLM judge versioning, malformed generated outputs, prompt injection in inputs and retrieved documents, hallucinated citations, missing citations, conflict between sources, partial streams, and retry duplication.
