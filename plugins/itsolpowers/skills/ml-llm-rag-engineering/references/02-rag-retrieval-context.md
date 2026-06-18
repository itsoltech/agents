# RAG Retrieval And Context Trust

## Use RAG When

- Knowledge is private, proprietary, or changes often.
- Answers need citations or source-grounded evidence.
- Full source data cannot fit in the prompt.
- Facts should update without retraining the model.

Do not use fine-tuning as the first answer for changing facts. Retrieval or a tool that fetches current data is usually safer.

## Version The RAG Stack

Version each layer independently:

- source connectors and access policy
- document parser
- normalization and metadata extraction
- chunking strategy
- embedding model and revision
- vector index and index build parameters
- filters and tenant/security predicates
- retriever parameters
- reranker and revision
- context compression
- prompt and generator model
- citation formatter and output schema

## Ingestion And Access Boundaries

- Classify sources and preserve tenant, document, timestamp, license, and access-control metadata.
- Do not strip permissions during indexing.
- Deduplicate and track document versions.
- Keep raw document, parsed text, chunks, embeddings, and index lineage traceable.
- Treat HTML, Markdown, PDFs, office docs, and user uploads as untrusted content that may contain prompt injection.

## Retrieval Quality

Evaluate retrieval separately from answer generation:

- document recall
- chunk recall
- retrieval relevance
- filter correctness
- reranker gain
- context diversity
- stale or duplicate context rate
- no-answer behavior when sources are missing

Use challenge queries for synonyms, abbreviations, conflicting documents, outdated documents, very short queries, multilingual content, and tenant-boundary cases.

## Context Construction

- Keep only context needed for the answer.
- Preserve citations and metadata through compression.
- Put retrieved content in clearly delimited sections.
- Instruct the model that retrieved content is untrusted evidence, not instructions.
- Resolve conflicts with source priority, freshness, or explicit refusal.
- Do not assume longer context improves results; it can increase latency, cost, and distraction.

## Answer Evaluation

Measure answer correctness, groundedness, citation correctness, abstention when evidence is missing, latency, token use, and cost. A high retrieval score is not enough if the generated answer ignores or misuses the evidence.
