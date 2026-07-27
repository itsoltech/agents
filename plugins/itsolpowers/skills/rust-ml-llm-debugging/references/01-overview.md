# rust-ml-llm-debugging Reference Sector: Rig provider debugging

Use the [canonical Rig provider, model, and agent facts](../../_shared/references/rust-ml-llm/rig-providers-models-agents.md) after identifying the failing boundary.

## Debugging wrapper

1. Capture the provider configuration, logical model role, request shape, public response, latency, rate-limit headers, and retry behavior.
2. Separate provider transport failures from prompt, tool, structured-output, retrieval, and orchestration failures.
3. Compare the smallest failing call with a known working provider or model path without logging secrets or sensitive prompt data.
4. Fix the isolated boundary and verify it with a focused regression case plus the relevant provider limit and fallback behavior.
