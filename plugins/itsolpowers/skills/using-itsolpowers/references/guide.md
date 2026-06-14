# ITSOL Powers Routing Reference

Ten plik jest wewnętrzną referencją routera. Nie zawiera checklist domenowych; pełna wiedza znajduje się w referencjach konkretnych skillów.

## Tryb Pracy

- Wymagania, story, refinement albo gotowość zadania: użyj `itsol-task-intake`, potem `itsol-requirements-review`.
- Feature albo behavior change: użyj `itsol-task-intake`, potem `itsol-functional-planning`; dopiero po zatwierdzonym Business Planie, zatwierdzonym Technical Planie i wyborze subagenci/inline użyj `itsol-subagent-workflow` albo `itsol-feature-implementation` z `itsol-tdd-workflow`.
- Endpoint, UI flow, integracja albo logika produktowa: traktuj jako zadanie funkcjonalne i przejdź przez `itsol-functional-planning`.
- Bug, regresja albo failing test: użyj `itsol-bug-debugging` i `itsol-tdd-workflow`, potem najwęższy skill debuggingowy, np. `svelte-debugging`, `postgres-operations-debugging`, `dotnet-web-api-debugging`.
- Refactor kodu produkcyjnego: użyj `itsol-tdd-workflow` przed zmianą, żeby zabezpieczyć zachowanie testem.
- Plan techniczny, tech notes, spike, rollout albo rollback: użyj `itsol-technical-planning` oraz domenowych skillów dla dotkniętych obszarów.
- Review PR: użyj `itsol-code-review-workflow`, skilla review dla dotkniętej technologii i dołóż `security-*` albo `infra-*`, jeśli zmiana dotyka trust boundary lub deploymentu.
- Handoff do QA albo release readiness: użyj `itsol-self-review`, potem `itsol-qa-handoff` i tylko tych domenowych skillów, które odpowiadają faktycznie zmienionym powierzchniom.

## Routing Sub-agentów

- Po zatwierdzeniu Business Planu i Technical Planu zapytaj użytkownika, czy wykonać pracę subagent-driven czy inline. Nie rozpoczynaj implementacji przed odpowiedzią.
- Jeśli użytkownik wybierze subagent-driven, załaduj `itsol-subagent-workflow`: podziel plan na taski, ustal limit równoległości, uruchamiaj implementację i osobny review subagent dla każdego zakończonego taska, powtarzaj pętlę fix-review do wyczyszczenia uwag, a zaakceptowane taski commituj w Angular commit convention, jeśli repo policy na to pozwala.
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
