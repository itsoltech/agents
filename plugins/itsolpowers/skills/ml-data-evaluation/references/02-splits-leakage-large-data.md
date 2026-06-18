# Splits Leakage Large Data

## Split Strategy

Choose the split by how production will use the model:

- random split only for approximately IID records without time, group, or duplicate relationships
- stratified split for imbalanced classification, while still checking group leakage
- group split by user, customer, device, patient, document, source, or other entity that must not cross train/test
- time split for temporal prediction, with train in the past, validation later, test in the newest closed period, and preprocessing limited to information available at prediction time
- geographic or tenant split when generalization to new locations or tenants matters
- cross-validation for small datasets, with group/time/nested variants when tuning and quality estimation must be separated

Report cross-validation as a distribution, not only an average.

## Test Set Discipline

The test set is frozen. Do not use it for feature selection, threshold tuning, model choice, repeated experiment feedback, or manual repair based on model errors. Store the test manifest hash. For frequent experiments, maintain a hidden holdout or refresh the test set through an explicit procedure.

## Leakage Checks

Ask for every feature: could this exact value be known at the production prediction moment?

Common leakage sources:

- normalization, feature selection, or imputation fit before splitting
- target encoding without out-of-fold calculation
- fields created after the target event
- future data in forecasting
- duplicates or near-duplicates across train and test
- same user, document, source, or entity in multiple splits
- manual test set changes from model feedback
- synthetic data generated from test examples
- benchmark contamination in LLMs
- retrieval index containing answer keys or eval examples
- full-range aggregates instead of point-in-time joins

## Large Data Processing

Prefer columnar formats such as Parquet for analytics and tabular training. Use Arrow-compatible interchange where practical. JSONL is useful for raw documents but is usually less efficient for analytics. Avoid one huge CSV as the long-term dataset format.

Partition by fields used for filtering, such as date, tenant, or region. Avoid very high-cardinality partition directories and excessive small files. Store file manifests and statistics.

Use pushdown and lazy execution: filter at source, select only needed columns, aggregate before moving data, inspect query plans, and avoid materializing every intermediate step.

For streaming or incremental datasets, record shard order, resume position, watermark, late-arriving data policy, transform version, and backfill rules. Validation/test data should remain stable and reproducible.

Sampling must preserve important segment distributions. Store sampling weights for class imbalance. Do not evaluate on oversampled validation or test sets.
