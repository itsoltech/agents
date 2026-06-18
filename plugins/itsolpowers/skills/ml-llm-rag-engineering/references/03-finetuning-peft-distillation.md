# Fine-Tuning, PEFT, And Distillation

## Fine-Tuning Fit

Use fine-tuning when:

- The task needs stable behavior, format, style, or repeated transformation.
- The training data represents the production task well.
- Prompting is too expensive, too long, or too unstable.
- A smaller tuned model can replace a larger model at acceptable quality.

Do not use fine-tuning as the first tool for frequently changing facts. Use retrieval or tools for fresh knowledge.

## PEFT And LoRA

Parameter-efficient methods train small adapter weights instead of the full model. Record and evaluate:

- base model revision
- target modules
- rank
- alpha
- dropout
- merge or unmerge behavior
- adapter compatibility with quantization
- base model eval versus adapter eval
- artifact size and serving path

## Supervised Fine-Tuning

SFT data should have:

- consistent chat template
- explicit roles
- correct loss masking
- deduplication
- length control
- response-quality validation
- eval set separated from data authors and generation process

Bad SFT data teaches bad behavior faster than prompt fixes can hide it.

## Preference Optimization

Preference optimization needs reliable preference data and a strong eval baseline. Watch for annotator bias, style preference over factuality, reward hacking, loss of base capabilities, and unclear causal links between preference score and product quality.

Build good SFT and task evals first. Preference optimization does not repair weak base data.

## Pretraining

Full pretraining is justified only when data, compute, licensing, privacy, tokenizer ownership, corpus operations, distributed training, and eval capability are all realistic. Start with a small model and scaling study. Do not scale a pipeline that cannot resume and evaluate correctly.

## Tokenizer And Context

- Version tokenizer with the model.
- Treat tokenizer changes as compatibility-breaking for embedding matrices.
- Check domain language, numbers, code, identifiers, special characters, and chat templates.
- Count prompt cost by target-model tokens, not characters.
- Larger context increases KV cache memory and prefill latency and does not guarantee better use of information.
- Improve retrieval, chunking, and context compression before increasing context length.

## Quantization

Quantization requires task-specific validation:

- quality on private evals
- memory, throughput, latency, and startup
- prompt length and batch-size behavior
- hardware support
- conversion manifest
- fallback to original model

Lower bit width does not always mean faster serving on the target hardware.

## Distillation

Use distillation when a strong teacher is too costly for production and a smaller model can learn the behavior. Teacher-generated data must be filtered, versioned, licensed, and evaluated for inherited errors.
