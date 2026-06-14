# itsol-code-review-workflow Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `project-delivery-requirements-review-qa-best-practices.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Pull request workflow, reviewer priorities, comment severity, stopping review for technical discussion, and development-to-review handoff.

## Przeniesione sekcje

- Implementacja z perspektywy developera
- Code review
- Handoffy między rolami
- Checklist dla reviewera

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Obowiązkowa mapa review

Każdy code review zaczyna się od mapy obszarów, nawet jeśli finalnie jest mały:

- zakres biznesowy, acceptance criteria i zgodność PR z opisem;
- poprawność działania i regresje;
- aktualny kontekst technologii: wersje frameworków, SDK, runtime, paczek, generated clients, API i dokumentacja właściwa dla wersji z repo;
- UI/UX: design system, komponenty, stany, formularze, responsywność, accessibility, motion, performance, testy UI i QA;
- security, trust boundary, auth, authz, tenancy, dane wrażliwe, uploady, integracje i sekrety;
- dane, migracje, schematy, zapytania, spójność i kompatybilność;
- infrastruktura, deployment, routing, TLS, runtime, observability, backup, capacity i rollback;
- frontend, backend, generated clients, API contracts i integracje między warstwami;
- testy, TDD RED/GREEN evidence, edge cases, performance i release/QA readiness;
- maintainability, czytelność, architektura i dług techniczny.

Nie wolno zakończyć review po sprawdzeniu tylko jednego sektora, jeśli PR dotyka więcej niż jednego obszaru.

## Gate na sub-agentów

Sub-agenci są obowiązkowi, gdy PR jest duży, wieloobszarowy albo ryzykowny. Dotyczy to w szczególności PR, który:

- dotyka więcej niż jednej powierzchni systemu, np. UI + API, API + database, app + infra, generated client + backend;
- zawiera zmiany security, auth/session, authz/tenant, sekrety, dane osobowe, uploady, integracje zewnętrzne albo supply chain;
- zawiera migracje danych, schematy, kontrakty API, generated clients, rollback/cutover albo elementy rewrite/migration;
- zależy od zachowania frameworka, SDK, runtime, biblioteki, paczki, generatora, API zewnętrznego albo narzędzia, którego aktualna dokumentacja może zmienić ocenę review;
- zmienia deployment, runtime, kontenery, Nomad, proxy, TLS, observability, backup, capacity albo production readiness;
- jest zbyt duży, aby jeden agent mógł wiarygodnie przeanalizować wszystkie obszary w jednym kontekście;
- ma wiele typów plików, wiele modułów, dużą liczbę linii zmian albo łączy kod ręczny z wygenerowanym.

Inline-only review jest dopuszczalny wyłącznie dla małego, jednoobszarowego diffu. W takim przypadku reviewer musi jawnie napisać, dlaczego sub-agenci nie byli potrzebni oraz które obszary z mapy review sprawdził.

## Dobór sub-agentów

Dobieraj sub-agentów pragmatycznie według zmienionego kodu i ryzyka:

- workflow, zakres, acceptance criteria, severity i finalny werdykt: `itsol-code-review-workflow`;
- aktualna dokumentacja, wersje repo, latest stable i ryzyka kompatybilności: `itsol-current-tech-context`;
- UI/UX frontend: `ui-code-review` oraz wąskie `ui-*` dla dotkniętych obszarów;
- security: najwęższy `security-*`, np. auth/session, authz/tenant, API/input, frontend/browser, files/integrations, secrets/config, supply chain;
- infrastruktura: najwęższy `infra-*`, np. deployment design, container runtime, Nomad, routing/proxy/TLS, edge protection, observability, backup/DR, capacity, production readiness;
- frontend Svelte/SvelteKit: `svelte-review`;
- server state/cache/SSR prefetch w Svelte: `tanstack-query-svelte-review`;
- OpenAPI, generated clients i drift kontraktów: `hey-api-openapi-review`;
- ASP.NET Core API: `dotnet-web-api-review`;
- Effect TypeScript: `effect-typescript-review`;
- Rust: `rust-review`, a dla Rig/Candle/RAG/local inference `rust-ml-llm-review`;
- PostgreSQL: `postgres-review`;
- MongoDB: `mongodb-review`;
- rewrite, modernizacja, strangler, branch-by-abstraction, parallel run albo cutover: `application-technology-migration`;
- QA/release readiness: `itsol-qa-handoff` oraz skille produkcyjnej gotowości, jeśli zmiana idzie na produkcję.

Jeśli PR dotyka kilku powyższych obszarów, uruchom osobnych sub-agentów dla niezależnych ryzyk. Nie wysyłaj jednego ogólnego sub-agenta do sprawdzenia całego dużego PR.

## Kontrakt pracy sub-agenta review

Każdy sub-agent review powinien dostać:

- zakres: obszar systemu, ryzyko, pliki lub moduły do sprawdzenia;
- kontekst: opis PR, acceptance criteria, istotne decyzje techniczne i test evidence;
- aktualny kontekst technologii, jeśli finding zależy od frameworka, SDK, runtime, paczki, generatora albo API;
- oczekiwany rezultat: findings według severity, file references, sprawdzona walidacja, brakujące testy, założenia i ryzyka resztkowe;
- ograniczenie: nie komentować stylu bez wpływu na ryzyko, nie duplikować findings spoza zakresu, nie modyfikować kodu.

Główny agent po powrocie sub-agentów:

- scala wyniki, deduplikuje i porządkuje je według severity;
- podnosi severity, gdy kilka obszarów wskazuje ten sam problem z różnych stron;
- nie ukrywa braków pokrycia ani nie udaje, że wykonano multi-agent review, jeśli sub-agenci nie byli dostępni;
- przygotowuje finalny werdykt i listę blokujących zmian przed merge.

## Pliki referencyjne

- `01-overview.md` (120 linii) - Overview; Implementacja z perspektywy developera
- `02-code-review.md` (146 linii) - Code review
- `03-handoffy-miedzy-rolami.md` (67 linii) - Handoffy między rolami; Checklist dla reviewera
