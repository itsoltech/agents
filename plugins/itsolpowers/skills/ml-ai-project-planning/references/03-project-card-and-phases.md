# Project Card And Phases

## Project Phases

Plan the work in phases:

1. define problem and business success
2. audit data availability, quality, ownership, license, and privacy
3. build business and technical baselines
4. prepare splits, evaluator, and challenge sets
5. run model experiments
6. validate results and analyze errors
7. build a reproducible training pipeline
8. define inference contract and fallback
9. run preproduction tests
10. ship by shadow, canary, A/B, or limited rollout
11. monitor quality, data, cost, latency, and failures
12. retrain, rollback, or retire the model

Do not move to large training before baseline and evaluator stability. Do not deploy without regression detection and rollback.

## Project Card Fields

Use this structure for plans:

```markdown
# Project Name

## Problem
- decision:
- user:
- prediction moment:
- target:
- prediction unit:

## Value
- current process:
- current error cost:
- expected improvement:

## Data
- sources:
- owner:
- time range:
- label availability:
- PII/license:

## Evaluation
- baseline:
- primary metric:
- secondary metrics:
- guardrails:
- split strategy:
- challenge sets:

## Operations
- batch/online/streaming:
- latency:
- throughput:
- cost:
- fallback:
- retraining:

## Risks
- data leakage:
- bias:
- security:
- drift:
- external dependencies:
```

## Minimum Team Standard

Any ML project beyond proof of concept should have a lockfile, versioned dataset or data manifest, baseline, frozen split, experiment tracking, automated data tests, golden or challenge set, notebook-free training pipeline, artifact registry or equivalent, model card, inference contract, monitoring for latency/errors/data/quality, rollback procedure, and named data/model owners.
