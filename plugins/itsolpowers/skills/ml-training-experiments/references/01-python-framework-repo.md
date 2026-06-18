# Python, Frameworks, And Repo Shape

## Python Project Rules

- Use `pyproject.toml`, a pinned Python version, committed lockfile, and locked/frozen CI installs.
- Do not install packages manually into a shared environment.
- Record CUDA, driver, system library, and hardware details for training runs.
- Separate training, development, and serving dependencies when possible.
- Use repo-standard linting, formatting, type checking, and tests. Prefer Ruff, Pyright or mypy, and pytest when starting a Python ML project.
- Keep training implementation in importable modules. Notebooks should call package code, not hide production logic, config, secrets, or large outputs.
- Use explicit YAML/TOML/dataclass/Pydantic-style configs instead of global variables or notebook cells.
- Never store secrets or tokens in notebooks, run metadata, prompts, traces, or artifacts.

## Repository Layout

Prefer a structure with clear boundaries:

```text
configs/
src/<project>/
  data/
  features/
  models/
  training/
  evaluation/
  inference/
  monitoring/
notebooks/
tests/
evals/
pipelines/
reports/
model_cards/
dataset_cards/
```

Rules:

- Evaluators are separate from model code.
- Feature logic has tests.
- Entrypoints require explicit config.
- Local experiments and CI use the same training code.
- Large datasets and model artifacts stay out of Git; commit manifests, cards, and lineage metadata instead.

## Framework Selection

Choose the smallest toolset that covers the problem.

- NumPy/SciPy: numeric work, arrays, statistics, linear algebra, algorithm prototypes.
- pandas: exploration and small/medium DataFrame workflows; do not force large data into memory.
- Polars/DuckDB/Arrow: local ETL, Parquet, lazy execution, SQL, larger-than-memory or object-storage analysis where suitable.
- Spark: distributed ETL, joins, aggregations, and data lake work when a cluster is actually needed.
- scikit-learn: tabular baselines, preprocessing pipelines, cross-validation, calibration, clustering, and feature selection.
- XGBoost/LightGBM/CatBoost: strong tabular, ranking, and nonlinear interaction models; do not jump to neural nets without evidence.
- PyTorch: deep learning, custom training loops, fine-tuning, research, distributed training.
- JAX: functional autodiff/JIT/vectorization/sharding work where the team understands the model.
- TensorFlow/Keras: existing TensorFlow ecosystems, Keras rapid experiments, TFLite or TensorFlow Serving requirements.
- Hugging Face ecosystem: transformers, datasets, tokenizers, accelerate, PEFT, and evaluation workflows; inspect defaults before using high-level trainers.
- MLflow or equivalent: run tracking, metrics, parameters, artifacts, lineage, and registry beyond local PoC.
- DVC or data catalog/object-store versioning: large data/model versioning tied to code.
- Optuna or equivalent: hyperparameter search and pruning when manual search is no longer enough.
- Ray: distributed search/training/batch inference when a simpler scheduler is insufficient.
- ONNX: cross-runtime export; always compare source and target outputs on a regression set.

## Algorithm Starting Points

- Regression: mean/median baseline, linear/Ridge/Lasso/Elastic Net, gradient boosted trees.
- Classification: majority baseline, logistic regression, boosted trees, random forest, linear SVM for sparse high-dimensional data.
- Text classification: TF-IDF plus a linear model before transformers.
- Ranking: business score baseline, learning-to-rank, retrieval plus reranking, two-tower retrieval for many candidates.
- Clustering: validate clusters with domain review; do not treat silhouette score as business truth.
- Forecasting: last value, seasonal naive, moving average, ETS/ARIMA, tree model with lag features; use rolling or expanding backtests.
- Recommendations: popularity, segment popularity, recent items, item similarity, collaborative filtering, matrix factorization, retrieval and ranking; track coverage, diversity, freshness, cold start, and feedback loops.
- Computer vision: start with simple/pretrained approaches; test camera, light, compression, blur, crop, rotation, and device variation.
