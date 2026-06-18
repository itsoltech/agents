# Data Product Contracts

## Data Layers

Use explicit layers and immutable inputs:

- `raw`: unmodified source data
- `validated`: schema and quality checked data
- `curated`: cleaned and normalized data
- `features`: feature tables, tokenized shards, or model-ready records
- `splits`: train/validation/test manifests
- `artifacts`: models, checkpoints, tokenizers, indexes, and derived assets
- `reports`: datasheets, profiles, quality metrics, and evaluation summaries

Transformations should be idempotent. Every output should point to input versions, code version, schema version, row counts, checksums, and time range. Do not overwrite datasets in place.

## Datasheet

For each dataset record:

- purpose, origin, owner, collection process, license, legal basis, and permitted use
- time range, population, inclusion and exclusion criteria
- target definition and label source
- schema, types, units, nullability, timezones, and category meanings
- known missingness, bias, sampling limits, and segment coverage
- transformations, filters, deduplication, and enrichment
- split method, test set policy, retention, update process, and rollback path

## Data Contract

A data contract should include field names, types, ranges, units, allowed categories, time semantics, uniqueness, keys, nullability, missingness tolerance, freshness SLA, and backward-compatibility rules.

Do not rely on a pipeline merely being able to parse a changed file. Schema, semantics, freshness, and quality are part of the model contract.

## Validation Gates

Automate checks for schema, record count, duplicates, missing values, out-of-range values, new or disappearing categories, target distribution, feature distribution, future timestamps, event ordering, relationship integrity, source contribution, volume shifts, and PII in forbidden fields.

Critical validation failures should stop the pipeline rather than train or evaluate on damaged data.
