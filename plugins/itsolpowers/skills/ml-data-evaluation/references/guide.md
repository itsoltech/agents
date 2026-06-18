# ML Data Evaluation Reference Index

Use this routing index after reading `SKILL.md`. Load only the files needed for the dataset, split, metric, or evaluation decision.

## Reference Routing

- Data as product, dataset layers, datasheets, ownership, data contracts, validation, lineage, manifests, and quality gates: read [01-data-product-contracts.md](01-data-product-contracts.md).
- Split strategy, test set discipline, leakage checks, large data formats, partitioning, lazy execution, streaming, incremental processing, and sampling: read [02-splits-leakage-large-data.md](02-splits-leakage-large-data.md).
- Task metrics, calibration, LLM/generative eval datasets, benchmark pitfalls, error analysis, and data/eval testing: read [03-metrics-error-analysis-evals.md](03-metrics-error-analysis-evals.md).

## Version Policy

- Existing repo: inspect pinned data frameworks, storage formats, validation libraries, orchestration, evaluation harnesses, lockfiles, and CI before recommending commands or APIs.
- New project or version-sensitive choice: use `itsol-current-tech-context` to verify current official guidance before naming package versions or provider-specific APIs.
- Keep evaluation conclusions tied to the observed data, manifest, split, config, and metric implementation version.
