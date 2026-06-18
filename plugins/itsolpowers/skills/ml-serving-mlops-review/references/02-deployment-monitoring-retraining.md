# Deployment Monitoring And Retraining

## Rollout Patterns

Use controlled rollout for behavior-changing models:

- **Shadow deployment:** send a copy of production traffic to the candidate without affecting decisions. Compare outputs, latency, errors, resource usage, score distributions, and disagreement cases.
- **Canary:** start with a small traffic share, define automatic stop conditions, compare the same user and data segments, avoid ramping during incidents or drift, and keep rollback fast.
- **A/B test:** use when measuring user or business impact. Require stable randomization, contamination controls, primary metric, guardrails, minimum sample size, duration, and checks for novelty or seasonality.
- **Champion/challenger:** keep one production champion, compare challengers offline or in shadow, promote only after gates and approvals, and retain the previous champion as rollback.

Rollback should include traffic routing, model registry alias, feature/preprocessing compatibility, cache behavior, and any downstream schema expectations.

## Production Monitoring

Cover four layers.

Infrastructure:

- request rate, error rate, timeout rate, p50/p95/p99 latency
- queue depth, concurrency, batch size, CPU/GPU/RAM/VRAM, GPU utilization
- model load time, restart/OOM count, tokens/sec, and cost/request

Data:

- schema violations, missing rate, unknown category rate, duplicate rate
- feature distributions, freshness, input length, language/region/tenant mix, and out-of-range rate

Predictions:

- score distribution, positive rate, confidence, abstention rate, top classes, prediction drift, and disagreement with the previous model

Quality:

- join predictions to delayed outcomes
- compute metrics per model version and segment
- track label delay and incomplete labels
- avoid comparing an incomplete period with a complete one

## Drift

Name the type of drift before reacting:

- data drift: input distribution changed
- prediction drift: model output distribution changed
- concept drift: input-target relationship changed
- label drift: target distribution changed
- operational drift: the product or usage pattern changed

Drift does not automatically mean quality degraded. Alerts should trigger analysis, not uncontrolled retraining.

## Retraining

Retraining triggers can be manual analysis, schedule, enough new labels, confirmed quality degradation, product change, data source change, or external model upgrade.

Every retrained model is a candidate, not automatically the new champion. Require fresh lineage, evals, security checks, model card updates, promotion approval, rollout plan, rollback target, and monitoring expectations.

## Release Readiness

Before release, confirm:

- model is registered with owner, version, artifact, checksums, runtime, input/output signature, dataset version, metrics, risk level, license, approval, and rollback target
- readiness waits for model load and warmup
- timeout, queue, concurrency, autoscaling, and cost limits are configured
- fallback is explicit and tested
- dashboards and alerts cover infrastructure, data, predictions, quality, and cost
- incident response covers rollback, provider outage, artifact fetch failure, label pipeline failure, and bad model output
