---
name: infra-routing-proxy-tls
description: "Routing/proxy/TLS: certs, headers, redirects, CORS, ingress, service discovery."
---

# Infra Routing Proxy TLS

Review public exposure, TLS termination, routing ownership, proxy headers, long connections, DNS/CDN, and load balancing behavior.

## Process

1. Map the request path or operational path end to end.
2. Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files, then read only relevant sector files.
3. Check rollout, rollback, observability, security, secrets, resource limits, and failure behavior.
4. For review, report concrete production risks first, then maintainability issues.
5. For debugging, collect evidence from config, allocation/container state, logs, metrics, and recent changes before proposing fixes.

## Evidence

Prefer job specs, Dockerfiles, proxy config, deployment manifests, logs, metrics, health checks, and runbook steps over assumptions.

