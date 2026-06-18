# Experiment Design And Tracking

## Hypothesis First

Every experiment starts with a sentence like:

```text
Change X should improve metric Y in segment Z because A.
We accept cost B and reject the experiment if guardrail C regresses.
```

Weak experiment descriptions are "try a bigger model", "change several parameters", or "see if it improves". If several elements must change together, name them as one architectural variant and run ablations after a win.

## Comparison Discipline

Keep these fixed when comparing runs:

- dataset version, split manifest, evaluator version, preprocessing, and batch evaluation path
- compute budget: steps, tokens, time, or cost
- hardware/software when measuring performance
- seed policy, primary metric, and guardrails chosen before the run

Do not combine data fixes, model changes, and evaluator changes in one run unless the package is the explicit variant under test.

## Run Metadata

Record for each run:

- run ID, owner, hypothesis, code commit, and dirty repo state
- lockfile/container digest, dataset version, and split manifest
- model/training/prompt config, seed policy, hardware, driver, accelerator, and framework versions
- train/validation/test/per-segment metrics, learning curves, and error categories
- examples, tokens, optimizer steps, resources, runtime, cost, checkpoints, artifacts, logs, failure mode, and decision

Use MLflow, Weights & Biases, or an equivalent tracking system once the work leaves local PoC.

## Reproducibility

- Seed Python, NumPy, framework RNGs, and data samplers.
- Save RNG state in checkpoints when resume matters.
- Do not promise bit-identical results across different GPUs, drivers, platforms, or library versions.
- Compare multiple seeds when variance is close to expected improvement.
- Report mean, spread, and range, not only the best number.
- Repeat a winning experiment from scratch in a clean environment before promotion.

## Practical Significance

Do not promote a run just because the metric moved in the right direction. Check whether the improvement:

- exceeds seed/fold variance
- appears in important segments and maps to business value or reduced operational cost
- does not come from one strange fold
- preserves calibration, latency, memory, and maintainability

## Autoresearch Guardrails

Autonomous experiment loops need a narrow sandbox:

- immutable data prep, evaluator, hidden holdout, and test cases
- small editable surface such as model, train script, and experiment config
- fixed wall-clock, GPU, VRAM, RAM, storage, and cost limits
- one primary metric plus hard guardrails
- commit before run, record diff, keep/discard/crash, and reset losing variants
- no arbitrary dependency installs or production secrets
- container isolation and full stdout/stderr/exit/resource logs
- checksum-protected evaluator and restricted hidden holdout access
- deduplicated hypotheses, complexity limits, and human review before merge

Autoresearch optimizes iteration speed, not production safety. Reproduce the best result cleanly and run the normal eval, security, and performance gates before adoption.

## Experiment Template

```markdown
# Experiment ID
## Hypothesis
Change X should improve Y because Z.
## Constants
- dataset version, split manifest, evaluator version, compute budget, hardware:
## Change
- code/config, expected effect, possible side effects:
## Result
- primary metric, guardrails, runtime, peak memory, cost, seed results:
## Error Analysis
- largest categories, regressed segments:
## Decision
- keep/discard/inconclusive/crash, rationale, next experiment:
```
