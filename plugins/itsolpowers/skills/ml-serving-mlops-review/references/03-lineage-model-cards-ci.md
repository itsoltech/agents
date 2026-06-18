# Lineage Model Cards And CI

## Lineage

Every production model should trace:

```text
model version
  -> training run
      -> code commit
      -> environment or container digest
      -> dataset versions
      -> split manifest
      -> config
      -> metrics and reports
      -> approvals
```

This lineage must be discoverable from the registry, release record, or model card. A filename is not a registry.

## Registry Record

The registry should store:

- model name, version, stage or alias, and owner
- artifact URI, checksums, framework/runtime, hardware assumptions, and input/output signature
- dataset version, split manifest, config, metrics, reports, and approval
- license, risk level, deployment history, rollback target, and monitoring owner

Use aliases such as candidate, challenger, champion, or rollback target when they match the release process.

## Model Card

Keep model cards close to release artifacts. Include:

- model name, version, owner, artifact checksum, base model or revision
- supported and unsupported use cases, users, decision owner, and cost-of-error context
- training data, dataset versions, time range, preprocessing, known gaps, and allowed input scope
- global metrics, segment metrics, challenge/safety results, latency, cost, and hardware
- known failure modes, fairness notes, privacy notes, security notes, and operational limitations
- input/output contract, threshold policy, fallback, monitoring, retraining trigger, rollback version, and contact

Model cards are release evidence, not marketing copy. They should make limitations and unsafe uses visible.

## CI For ML

Pull request checks should include:

- lint, format, type checks, unit tests, and dependency/security scan
- data contract tests on a representative sample
- smoke training, smoke inference, export compatibility, and small golden-set regression eval
- schema, serialization/deserialization, finite outputs, malformed input, timeout, cancellation, fallback, and concurrency tests for serving changes

Scheduled checks can include:

- full eval, larger data validation, drift report, compatibility matrix, dependency freshness, distributed smoke test, cost benchmark, and performance benchmark

Training pipeline gates should record:

- immutable image, pinned dependencies, input dataset version, run ID, config, resource limits, checkpointing, artifact upload, failure notification, and lineage registration

## Promotion Gate

Do not promote a model if any of these are missing:

- model card
- dataset version and split manifest
- reproducible run
- golden, challenge, and safety evals
- latency and memory test
- input/output contract
- owner, alerting, rollback target, and deployment plan
- privacy/security review when sensitive data, external models, generated output, agents, or high-impact decisions are involved

## Upgrades

For library, runtime, provider, or base-model upgrades:

- isolate the upgrade in its own change when possible
- review migration notes, serialization compatibility, tokenizer/chat-template changes, determinism, seed behavior, export compatibility, latency, memory, output drift, and license changes
- run training smoke tests, important evals, serving compatibility tests, and rollout through shadow or canary
- do not upgrade framework, CUDA/runtime, and model at the same time without an isolation plan
