# ITSOL Powers Routing Reference

Ten plik jest wewnętrzną referencją routera. Nie zawiera checklist domenowych; pełna wiedza znajduje się w referencjach konkretnych skillów.

## Tryb Pracy

- Wymagania, story, refinement albo gotowość zadania: użyj `itsol-task-intake`, potem `itsol-requirements-review`.
- Feature albo behavior change: użyj `itsol-task-intake`, potem `itsol-feature-implementation`, a następnie skill domenowy dla dotkniętego stacku.
- Bug, regresja albo failing test: użyj `itsol-bug-debugging`, potem najwęższy skill debuggingowy, np. `svelte-debugging`, `postgres-operations-debugging`, `dotnet-web-api-debugging`.
- Plan techniczny, tech notes, spike, rollout albo rollback: użyj `itsol-technical-planning` oraz domenowych skillów dla dotkniętych obszarów.
- Review PR: użyj `itsol-code-review-workflow`, skilla review dla dotkniętej technologii i dołóż `security-*` albo `infra-*`, jeśli zmiana dotyka trust boundary lub deploymentu.
- Handoff do QA albo release readiness: użyj `itsol-self-review`, potem `itsol-qa-handoff` i tylko tych domenowych skillów, które odpowiadają faktycznie zmienionym powierzchniom.

## Routing Sub-agentów

- Użyj sub-agentów, gdy zadanie ma niezależne powierzchnie pracy: UI/API/database/infra, osobne hipotezy debuggingowe, równoległe ścieżki review, security plus implementacja albo zbieranie dowodów z kilku miejsc.
- Każdy sub-agent powinien dostać wąski zakres, właścicielstwo plików lub obszaru systemu, ograniczenia i oczekiwany rezultat.
- Główny agent nie deleguje bieżącego blokera ani decyzji integracyjnych. Odpowiada za scalenie wyników, spójność zmian, brak konfliktów edycyjnych i końcową weryfikację.
- Przy edycji kodu rozdziel zapis na rozłączne pliki lub moduły. Jeśli to niemożliwe, sub-agenci powinni tylko analizować i raportować.

## Powierzchnie Ryzyka

- UI, browser, forms, accessibility: `svelte-*`.
- Server state, cache, invalidation, SSR prefetch: `tanstack-query-svelte-*`.
- Generated OpenAPI clients and contract drift: `hey-api-openapi-*`.
- ASP.NET Core APIs: `dotnet-web-api-*`.
- Effect TypeScript runtime, layers, errors, concurrency: `effect-typescript-*`.
- Rust application code: `rust-*`.
- Rust LLM, Rig, Candle, RAG, model runtime: `rust-ml-llm-*`.
- PostgreSQL schema, queries, PgBouncer, HA, operations: `postgres-*`.
- MongoDB data modeling, indexes, replica/sharding, operations: `mongodb-*`.
- App security: use the narrowest `security-*` skill.
- Infrastructure: use the narrowest `infra-*` skill.

## Selection Rule

Load the process skill first, then load only the smallest domain skill set that can prove the answer. Prefer two focused skills over one broad mental checklist.
