# Serving Contracts And Parity

## Serving Modes

Choose the mode from product constraints, not implementation convenience:

- **Batch inference:** daily or hourly scoring, large throughput, table scoring, embedding generation, and no strict latency target.
- **Online inference:** request-response decisions, real-time personalization, or decisions that depend on current state. Requires timeouts, autoscaling, fallback, concurrency limits, and tail-latency control.
- **Streaming inference:** near-real-time events or continuous signals. Requires event time, watermarks, deduplication, idempotency, and out-of-order handling.
- **Edge or embedded inference:** local decisions, offline use, privacy, or low-latency device paths. Requires versioned artifacts, hardware constraints, update strategy, and observability for field failures.
- **Model server or managed provider:** useful for shared serving features, GPU scheduling, batching, or provider-managed scale. Review provider limits, cold starts, data retention, auth, observability, and rollback.

## Model Contract

A production model contract should specify:

- model name, version, owner, risk level, and registry location
- input schema, required fields, units, feature order, dtype, shape, and allowed ranges
- preprocessing version, tokenizer, chat template, normalizers, encoders, category maps, and feature manifest
- output schema, scores, labels, confidence, units, threshold policy, calibration notes, and abstention behavior
- error codes, timeout, max batch, idempotency key, and retry policy
- artifact format, checksum, source, revision, license, runtime, and hardware assumptions

Do not pass anonymous float arrays across team boundaries without a schema, feature manifest, and parity tests.

## Validation

Validate at the serving boundary before calling the model:

- reject malformed input, unknown enum values, incompatible shapes, unsupported dtypes, invalid ranges, bad timestamps, invalid language/region, and excessive text length
- explicitly handle empty batches, missing optional fields, unknown categories, `NaN`, `Inf`, timeout, cancellation, duplicate events, and model-unavailable paths
- validate model output before using it in SQL, shell, HTML, API calls, tool calls, or business decisions
- record enough structured metadata to debug decisions without logging secrets, unnecessary PII, or full prompts by default

## Train-Serving Parity

Parity is a release gate:

- preprocessing should be shared or generated from one versioned contract
- feature transformations, tokenizers, chat templates, normalizers, encoders, and category maps are model artifacts, not informal code comments
- point-in-time joins must be reproducible for training examples and online serving
- the same golden examples should run through the training pipeline and serving path with expected outputs
- exported model behavior must match pre-export behavior within a documented tolerance
- threshold and calibration policy must be versioned with the model

## Batching And Scaling

Batching increases throughput but can increase latency:

- set max batch size and max wait time
- separate long and short requests if head-of-line blocking appears
- for LLM serving, measure prefill and decode separately
- monitor requests/sec, tokens/sec, time-to-first-token, inter-token latency, queue depth, GPU/VRAM, model load time, restart count, and cost/request
- scale from queue depth, token throughput, concurrency, or saturation signals, not CPU alone
- warm the model before readiness and avoid routing traffic before artifacts are loaded
- plan for rolling deployments where two model versions may need memory at once

## Fallback

Fallback options include previous model version, simpler model, external provider, cached result, business rule, abstention, or human review.

Fallback must be tested and observable. Silent fallback can hide outages, change product behavior, and corrupt quality metrics.

## Model Formats

Treat model artifacts as supply-chain inputs:

- prefer safe tensor formats for tensor weights when available
- use interoperable formats when portability matters, and quantized formats only with measured quality and latency impact
- attach checksum, source, revision, license, manifest, runtime, and expected signature
- treat pickle, custom operators, and remote executable model code as untrusted code execution unless explicitly reviewed and isolated
