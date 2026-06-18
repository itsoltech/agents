# ML Training Experiments Reference Index

Use this routing index after reading `SKILL.md`. Load only the files needed for the current implementation, review, or debugging decision.

## Reference Routing

- Python environment policy, project layout, dependency boundaries, notebook rules, framework/tool selection, and algorithm starting points: read [01-python-framework-repo.md](01-python-framework-repo.md).
- Experiment hypotheses, one-change discipline, run metadata, reproducibility, practical significance, autoresearch loops, and experiment templates: read [02-experiment-design-tracking.md](02-experiment-design-tracking.md).
- Model parameters, hyperparameters, learning rate, batch size, optimizers, regularization, schedulers, precision, inference parameters, and config versioning: read [03-hyperparameters-config.md](03-hyperparameters-config.md).
- Training smoke tests, profiling, dataloaders, mixed precision, accumulation, checkpointing, early stopping, distributed training, CI, training pipelines, and promotion gates: read [04-training-performance-distributed.md](04-training-performance-distributed.md).

## Version Policy

- Existing repo: implement against pinned Python, package manager, lockfile, ML framework, CUDA/driver, model, dataset, and infrastructure versions.
- New project or upgrade: use `itsol-current-tech-context` and current official docs or package registries before recommending exact framework versions, base models, CUDA stacks, or training tools.
- Keep training, development, and serving dependencies separated when the repo supports it. Commit lockfiles and run CI in locked or frozen mode.
