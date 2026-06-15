# ITSOL Powers Routing Reference

Ten plik jest wewnętrzną referencją routera. Nie zawiera checklist domenowych; pełna wiedza znajduje się w referencjach konkretnych skillów.

## Tryb Pracy

- Wymagania, story, refinement albo gotowość zadania: użyj `itsol-task-intake`, potem `itsol-requirements-review`.
- Tworzenie, inicjalizacja, odczyt lub aktualizacja repo policy, monorepo map, TDD support, verification commands albo stable workflow notes w `.itsol.md`: użyj `itsol-repo-memory` przed planowaniem, implementacją, review albo QA. W monorepo dobierz najbliższą sekcję `Project: <path>` dla dotykanych plików.
- Aktualność technologii, dokumentacji, wersji frameworków, SDK, runtime, paczek, generated clients, API zewnętrznych albo start nowego projektu: użyj `itsol-current-tech-context`. W istniejącym repo najpierw wykryj lokalnie przypięte wersje, a dopiero potem sprawdzaj aktualną dokumentację. W nowym projekcie wybieraj latest stable, chyba że user jawnie przypiął wersje albo wymaga LTS/kompatybilności.
- Rewrite aplikacji, migracja technologii, modernizacja, Strangler Fig, Branch by Abstraction, parallel run, cutover danych, kontrakty kompatybilności albo decommissioning legacy: użyj `application-technology-migration`, a dopiero dla zatwierdzonych slice'ów dobierz `itsol-functional-planning`, `itsol-tdd-workflow`, review/security/infra/database i skille technologiczne.
- UI/UX, nowy widok, komponent, design system, responsive, accessibility, Tailwind, performance frontendu, testy UI albo QA frontendu: użyj `ui-ux-workflow`, a potem dobierz najwęższe skille UI dla dotkniętego obszaru.
- Feature albo behavior change: użyj `itsol-task-intake`, potem `itsol-functional-planning`; dopiero po zapisaniu i zatwierdzeniu plików Business Planu oraz Technical Planu i wyborze subagenci/inline użyj `itsol-subagent-workflow` albo `itsol-feature-implementation` z `itsol-tdd-workflow`.
- Endpoint, UI flow, integracja albo logika produktowa: traktuj jako zadanie funkcjonalne i przejdź przez `itsol-functional-planning`.
- Bug, regresja albo failing test: użyj `itsol-bug-debugging`, zbierz dowody i zapisz Technical Fix Plan; dopiero po akceptacji użytkownika użyj `itsol-tdd-workflow` i najwęższego skilla debuggingowego, np. `svelte-debugging`, `postgres-operations-debugging`, `dotnet-web-api-debugging`.
- Refactor kodu produkcyjnego: użyj `itsol-tdd-workflow` przed zmianą, żeby zabezpieczyć zachowanie testem. Jeśli `.itsol.md` mówi, że TDD dla dotkniętego projektu jest `limited` albo `not-supported`, nie scaffoldź nowego test frameworka; zapisz wyjątek TDD i wykonaj replacement verification.
- Plan techniczny, tech notes, spike, rollout albo rollback: użyj `itsol-technical-planning`, `itsol-current-tech-context` oraz domenowych skillów dla dotkniętych obszarów.
- Review PR: użyj `itsol-code-review-workflow`, zbuduj mapę obszarów review i dobierz skille review dla dotkniętych technologii. Jeśli finding albo ocena zależy od frameworka, SDK, runtime, paczki, generatora lub API, użyj `itsol-current-tech-context`. Jeśli PR dotyka UI/UX, użyj `ui-code-review` oraz właściwych skilli UI. Dla dużego, wieloobszarowego albo ryzykownego PR użyj osobnych sub-agentów według obszarów, np. current tech context, UI/UX, security, infra, frontend, backend, database, generated clients/API contracts, migration/rewrite, QA/release, performance i test strategy. Inline-only review dopuszczaj tylko dla małego jednoobszarowego diffu i jawnie uzasadnij, dlaczego sub-agenci nie byli potrzebni.
- Handoff do QA albo release readiness: użyj `itsol-self-review`, potem `itsol-qa-handoff` i tylko tych domenowych skillów, które odpowiadają faktycznie zmienionym powierzchniom.

## Routing Sub-agentów

- Po zatwierdzeniu plików Business Planu i Technical Planu zapytaj użytkownika, czy wykonać pracę subagent-driven czy inline. Nie rozpoczynaj implementacji przed odpowiedzią.
- Jeśli użytkownik wybierze subagent-driven, załaduj `itsol-subagent-workflow`: podziel plan na taski, ustal limit równoległości, uruchamiaj implementację i osobny review subagent dla każdego zakończonego taska, powtarzaj pętlę fix-review do wyczyszczenia uwag, a zaakceptowane taski commituj w Angular commit convention, jeśli repo policy na to pozwala.
- Użyj sub-agentów, gdy zadanie ma niezależne powierzchnie pracy: UI/API/database/infra, osobne hipotezy debuggingowe, równoległe ścieżki review, security plus implementacja albo zbieranie dowodów z kilku miejsc.
- W Codex nie używaj nazw skilli ITSOL jako `agent_type`. Role Codexa to platformowe typy typu `default`, `explorer`, `worker`. Jeżeli forkujesz kontekst rozmowy dla subagenta, nie ustawiaj jednocześnie jawnego `agent_type`; przekaż skill ITSOL w treści zadania albo structured skill item. Jeżeli potrzebujesz roli `explorer` albo `worker`, nie używaj forked context i przekaż minimalny kontekst ręcznie.
- Tylko główny agent orkiestruje sub-agentów. Delegowany sub-agent nie może uruchamiać kolejnego sub-agenta, odpalać `codex exec`, `claude` ani innych agentowych CLI. Jeśli zakres jest za szeroki, ma zwrócić proponowany podział pracy do głównego agenta.
- Przy code review każdy PR wymaga mapy obszarów review. Duży, wieloobszarowy, security/data/infra-sensitive, migration-related albo generated-contract-related PR musi być sprawdzony przez sub-agentów w niezależnych obszarach. Nie wykonuj inline-only review jednego sektora, jeśli diff dotyka wielu obszarów.
- Przy planowaniu i review zależnym od wersji technologii uruchom osobny sub-agent `itsolpowers:itsol-current-tech-context`, jeśli narzędzia na to pozwalają. Ma zwrócić wykryte wersje, źródła dokumentacji, politykę wersji i ryzyka kompatybilności.
- Przy dużym review UI/UX rozdziel sub-agentów według obszarów: design system, architektura komponentów, stany/formularze/listy, responsywność, Tailwind/tokeny, accessibility/motion, performance/stability, testy/QA i security frontend.
- Każdy sub-agent powinien dostać wąski zakres, właścicielstwo plików lub obszaru systemu, ograniczenia i oczekiwany rezultat.
- Główny agent nie deleguje bieżącego blokera ani decyzji integracyjnych. Odpowiada za scalenie wyników, spójność zmian, brak konfliktów edycyjnych i końcową weryfikację.
- Przy edycji kodu rozdziel zapis na rozłączne pliki lub moduły. Jeśli to niemożliwe, sub-agenci powinni tylko analizować i raportować.

## Commity

- Wszystkie commity dla pracy ITSOL twórz w Angular commit convention, np. `feat(scope): ...`, `fix(scope): ...`, `test(scope): ...`, `refactor(scope): ...`, `docs(scope): ...`.
- Commit powinien obejmować jeden spójny, zweryfikowany zakres pracy.
- Nie stage'uj zmian użytkownika ani plików spoza aktualnego zakresu. Jeśli nie da się bezpiecznie oddzielić zmian, zatrzymaj się i zapytaj użytkownika.

## Powierzchnie Ryzyka

- UI, browser, forms, accessibility: `svelte-*`.
- Creating, initializing, reading, or updating repo policy, monorepo project map, TDD support, verification commands and stable agent notes: `itsol-repo-memory`.
- Current official documentation, SDK/runtime/package versions, latest stable defaults, and repo pins: `itsol-current-tech-context`.
- UI/UX workflow, design system, components, states/forms, responsive, Tailwind, accessibility, performance, tests and UI review: `ui-*`.
- Server state, cache, invalidation, SSR prefetch: `tanstack-query-svelte-*`.
- Generated OpenAPI clients and contract drift: `hey-api-openapi-*`.
- ASP.NET Core APIs: `dotnet-web-api-*`.
- Effect TypeScript runtime, layers, errors, concurrency: `effect-typescript-*`.
- Rust application code: `rust-*`.
- Application rewrite and technology migration: `application-technology-migration`.
- Rust LLM, Rig, Candle, RAG, model runtime: `rust-ml-llm-*`.
- PostgreSQL schema, queries, PgBouncer, HA, operations: `postgres-*`.
- MongoDB data modeling, indexes, replica/sharding, operations: `mongodb-*`.
- App security: use the narrowest `security-*` skill.
- Infrastructure: use the narrowest `infra-*` skill.

## Selection Rule

Load the process skill first, then load only the smallest domain skill set that can prove the answer. Prefer two focused skills over one broad mental checklist.
