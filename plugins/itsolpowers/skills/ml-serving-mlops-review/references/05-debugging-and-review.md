# Debugging And Review

## Edge Cases

For each input field ask:

- missing, zero, negative, max, out-of-range, `NaN`, `Inf`, new category, empty text, huge text, unexpected language, future timestamp, duplicate event, and out-of-order event

For production ask:

- model fails to load after restart
- output schema changes
- traffic grows sharply
- users send worst-case long inputs
- labels stop arriving
- fallback is unavailable
- two versions return scores on different scales

## Debugging Symptoms

Loss does not decrease:

- verify target correctness, input-target alignment, train mode, gradients, optimizer parameters, learning rate, masking, dtype, loss scaling, and one-batch overfit

Validation is much worse than train:

- check overfitting, leakage in train, preprocessing differences, split shift, duplicates, capacity, regularization, and augmentation mismatch

Offline result is good but production is poor:

- check train-serving skew, point-in-time leakage, population shift, stale features, threshold mismatch, delayed labels, feedback loops, schema mismatch, wrong model version routing, tokenizer drift, and preprocessing drift

NaN or Inf:

- log the first failing step, inspect inputs, loss components, gradient norm, learning rate, clipping, mixed precision, loss scaling, and FP32 baseline

OOM:

- reduce batch or sequence length, use gradient accumulation, mixed precision, activation checkpointing, release tensor references, avoid storing full outputs, inspect leaks, and use sharding only after simpler causes are ruled out

Slow training or inference:

- profile dataloaders, CPU-GPU transfer, batch size, `.item()` or per-step logging synchronization, dtype, dynamic shapes, checkpoint/eval frequency, distributed communication, remote small files, model load time, queueing, and batch behavior

## Testing Surface

Review whether tests cover:

- preprocessing, tokenization/truncation, feature calculations, loss, metrics, masking, padding, postprocessing, thresholding, schema output, serialization, and deserialization
- data schema, ranges, nulls, duplicates, referential integrity, split leakage, target distribution, temporal correctness, point-in-time joins, and forbidden columns
- output shape/dtype, finite outputs, invariance or monotonic constraints when required, small perturbation stability, golden-set regression, export equivalence, and one-batch overfit
- smoke training, resume from checkpoint, deterministic debug run, OOM handling, interrupted artifact upload, missing data, corrupted shard, worker failure, and distributed job completion
- inference cold start, warmup, max batch, empty batch, malformed input, unknown category, `NaN`, `Inf`, long input, timeout, cancellation, concurrency, model unavailable, fallback, and rolling deployment with two versions
- LLM malformed JSON, extra fields, missing fields, invalid tool call, missing tool, prompt injection, retrieval injection, refusal errors, hallucinated sources, source conflicts, long context, unexpected language, repeated output, partial stream, connection interruption, and retry idempotency
- performance throughput versus batch, latency percentiles, memory versus input length, concurrency limit, saturation point, queue behavior, model load time, token throughput, cost, quantization impact, and dynamic batching impact

The ML Test Score idea can be adapted as an internal release gate across data, model, pipeline, serving, monitoring, and readiness.

## Review Checklist

Production:

- model is in a registry and has a model card
- input/output contract is versioned
- train-serving parity has a test
- readiness waits for loading and warmup
- timeouts, concurrency, queue limits, and autoscaling are configured
- fallback is defined, tested, observable, and included in metrics
- rollout is shadow, canary, A/B, champion/challenger, or otherwise controlled
- rollback is fast and rehearsed
- infrastructure, data, prediction, quality, and cost monitoring are active
- retraining creates a candidate and does not auto-promote to champion

Security:

- dataset and model access is controlled
- PII is minimized
- models and dependencies are pinned
- checksums and licenses are verified
- untrusted executable artifacts are not loaded without review
- prompt injection, tool authorization, output validation, secrets handling, cost limits, and resource exhaustion are tested where relevant

## Large ML PR Split

For large ML reviews, focused subagents are mandatory before the final verdict. Split review work by independent risk surfaces:

- data/evaluation: datasets, labels, splits, leakage, metrics, calibration, error analysis, eval datasets
- training/experiments: framework pins, configs, tracking, reproducibility, checkpoints, performance, distributed behavior
- LLM/RAG: prompting, retrieval, context trust, structured output, guardrails, tool calls, LLM evals
- serving/MLOps: contracts, validation, parity, rollout, monitoring, registry, model cards, CI/CD, retraining, rollback
- security/privacy: data handling, supply chain, model attacks, LLM/agent security, fairness, risk management
- QA/release: release gates, smoke tests, performance tests, incident plans, dashboards, and rollback evidence
- Rust ML/LLM: use existing Rust ML/LLM skills first when Rig, Candle, providers, Rust agents, or Rust serving runtime code is the main surface
