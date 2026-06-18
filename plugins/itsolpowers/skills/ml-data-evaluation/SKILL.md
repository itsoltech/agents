---
name: ml-data-evaluation
description: "ML data and evaluation: data contracts, validation, splits, leakage, metrics, calibration, error analysis, evals."
---

# ML Data Evaluation

Design and review ML datasets, data contracts, split strategy, metrics, eval datasets, and error analysis as first-class engineering artifacts.

## Process

1. Treat data as a product: identify owner, source, license, privacy constraints, schema, freshness, lineage, update cadence, retention, and permitted uses.
2. Create or review a datasheet, data contract, validation checks, immutable raw layer, manifests, checksums, and versioned transformation outputs.
3. Choose splits that match production use. Freeze the test set and do not use it for feature selection, threshold tuning, model selection, or repeated experiment feedback.
4. Check leakage before trusting any metric: point-in-time availability, duplicate and near-duplicate records, group/time contamination, target encoding, preprocessing order, synthetic data, and benchmark contamination.
5. Select metrics by task and business cost. Report segment results, calibration, confidence or variance, challenge set behavior, and operational cost.
6. For LLM and generative systems, separate retrieval, generation, deterministic scorers, human review, LLM judge calibration, safety tests, and private domain evals.
7. Read [references/guide.md](references/guide.md), then load only the focused reference files needed for the data or evaluation question.
8. Add data/eval testing evidence before recommending model or deployment decisions.

## Coordination

Use with `ml-ai-project-planning` when the business decision, baseline, or project card is still unclear. Use with `ml-training-experiments` for experiment tracking and training reproducibility. Use with `ml-llm-rag-engineering` for RAG, LLM judges, generated-output validation, and agent evals. Use `ml-serving-mlops-review` when production monitoring, retraining, rollback, or model cards are in scope.
