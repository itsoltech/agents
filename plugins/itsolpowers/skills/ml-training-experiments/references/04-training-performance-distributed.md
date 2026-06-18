# Training Performance, Checkpoints, And Distributed Runs

## Start Small

Before a full run:

- run a forward pass and backward pass
- overfit one batch and a small subset
- verify loss decreases and baseline validation runs
- run a short profiler and estimate full cost

If the model cannot overfit one batch, do not start a large training job.

## Profile The Whole Pipeline

Measure data read, preprocessing, host-to-device transfer, forward pass, backward pass, optimizer step, synchronization, checkpointing, evaluation, and logging. GPU utilization alone is not enough; track examples or tokens per second and waiting time for data.

## Data Loading

- Benchmark `num_workers` or equivalent worker settings.
- Check pinned memory for CUDA transfers where relevant.
- Consider persistent workers.
- Avoid heavy Python logic per sample.
- Batch deterministic preprocessing and cache expensive transforms.
- Shard data for parallel reads and avoid contention on one file.
- Compare local NVMe, network storage, and object storage when IO is suspicious.

## Mixed Precision And Memory

- Prefer the repo-supported precision path and validate against FP32.
- Keep critical reductions or sensitive operations in FP32 when needed.
- Log scaler skips, NaN, overflow, and underflow.
- Use gradient accumulation when the desired effective batch does not fit in memory.
- Ensure loss scaling, scheduler timing, clipping, and distributed synchronization happen at the correct accumulation boundary.
- Use activation checkpointing when activation memory blocks training and extra compute is acceptable.

## Compilation, Fused Kernels, And Batching

- Confirm correctness in eager or baseline mode before adding compilation.
- Measure compile time separately from runtime.
- Cache compilation where the stack supports it.
- Limit dynamic shapes if they block optimization.
- Add fused optimizers, attention, or kernels only after benchmark evidence.
- Group similar sequence lengths, use dynamic padding, and only use sequence packing when masks and document boundaries are correct.

## Checkpoints

Training checkpoints should contain:

- model, optimizer, scheduler, scaler, and RNG states
- step, epoch, examples, token counts, and data sampler position
- resolved config, dataset version, and metrics

Write checkpoints atomically, use temporary files and checksums, enforce retention, and test resume. Model weights alone are not enough for reliable resume.

## Early Stopping And Pruning

- Monitor validation metrics.
- Set minimum improvement and patience.
- Do not stop on one noisy measurement.
- Let pruned searches reject weak trials early, but give the final winner the full budget.

## Distributed Training

Do not start with distributed training. First build a correct, profiled single-device baseline.

- Data parallelism fits when the model fits on one device and throughput is the bottleneck.
- Sharded approaches such as FSDP or ZeRO fit when parameters, gradients, or optimizer state do not fit on one device.
- Tensor parallelism fits large layers that need fast interconnects.
- Pipeline parallelism adds bubbles, microbatching, balancing, and harder checkpoints.
- Expert parallelism needs routing, load balancing, and all-to-all communication checks.

Distributed rules:

- Make global batch and learning rate explicit.
- Give each worker a unique shard and change sampler seed between epochs.
- Reduce and log metrics correctly.
- Use one coordinated checkpoint writer or a documented sharded format.
- Detect worker failure and avoid publishing partial artifacts.
- Monitor collective operations, network, storage bottlenecks, image consistency, and clock sync.
- Test resume after node failure.

## CI And Training Pipelines

Pull requests should run lint/format, typecheck, unit tests, data contract tests on a sample, smoke train, smoke inference, export compatibility, a small golden eval, and dependency/security checks.

Scheduled jobs can run full evals, larger data validation, drift reports, distributed smoke tests, model compatibility matrices, dependency freshness, and cost/performance benchmarks.

Training pipelines should use immutable images, pinned dependencies, input dataset versions, run IDs, resource limits, checkpointing, artifact upload, failure notification, and lineage registration.

Do not promote a model without a model card, dataset version, reproducible run, golden/challenge/safety pass, latency and memory test, rollback target, owner, alerts, and input/output contract compatibility.
