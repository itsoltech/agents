# Hyperparameters And Config

## Parameters Versus Hyperparameters

Model parameters are learned from data: coefficients, tree splits/leaves, neural weights, and embeddings. Hyperparameters are chosen by humans or tuning systems: learning rate, batch size, epochs/steps, optimizer, weight decay, dropout, tree depth, number of trees, context length, augmentations, and sampling settings.

Parameter count affects memory, training cost, and inference cost. It does not prove model quality.

## Config Policy

- Keep all train/eval/inference entrypoints config-driven.
- Version config with code, data, model, prompt, and evaluator.
- Store defaults intentionally and make overrides visible in run metadata.
- Avoid hidden global state and notebook-only parameters.
- Log the resolved config, not just a partial user-supplied config.
- When changing several hyperparameters together, name the combined hypothesis and run ablations later.

## Learning Rate

Learning rate often dominates neural training behavior.

- Too high can cause instability, oscillation, or NaN.
- Too low can waste compute or converge to a weak solution.
- Tune it with batch size, optimizer, schedule, and precision.
- Log the actual learning rate per step, not only the initial value.
- Recheck learning rate after changing global batch size.

## Batch Size

Larger batches can improve accelerator utilization, consume more memory, reduce update count for a fixed dataset budget, and change generalization.

```text
effective_batch = batch_per_device * gradient_accumulation * world_size
```

Gradient accumulation is not always identical to one large batch because of normalization, dropout, clipping, accumulation order, and scheduler timing.

## Epochs, Steps, And Budgets

- Compare experiments at the same data, step, token, time, or cost budget.
- For streaming data, count examples or tokens rather than epochs.
- Save the best checkpoint by validation metric, not only the last checkpoint.
- Use early stopping only on validation data.

## Optimizer And Regularization

- SGD with momentum is a useful baseline for some vision models.
- Adam/AdamW are common for transformers and many neural networks.
- Weight decay in AdamW is not equivalent to naive L2 in every optimizer.
- Log optimizer parameters such as betas, eps, momentum, and decay.
- Do not change optimizer and learning rate together without a written hypothesis.
- Monitor train and validation metrics separately when using weight decay, dropout, early stopping, augmentation, label smoothing, depth limits, leaf limits, or subsampling.

## Schedulers, Warmup, And Clipping

- Count scheduler progress by actual optimizer steps.
- Restore scheduler state on resume.
- Use warmup to stabilize large models or batches when justified.
- Use gradient clipping for exploding gradients, but do not let it hide bad learning rate, bad data, or architecture issues.
- Log gradient norm before clipping.

## Precision And Dtype

- Use FP32 as a correctness and debugging reference.
- FP16 can reduce memory but may need loss scaling.
- BF16 is often more stable on supported hardware.
- FP8 and lower formats require compatible hardware and careful validation.
- Monitor overflow, underflow, NaN, scaler skips, and metric drift against the FP32 baseline.

## LLM Inference Parameters

Version inference parameters with model, prompt, tools, and eval:

- temperature
- top_p and top_k
- max_new_tokens
- stop sequences
- repetition or frequency penalties
- beam width

Treat these as behavior-changing configuration, not presentation settings.
