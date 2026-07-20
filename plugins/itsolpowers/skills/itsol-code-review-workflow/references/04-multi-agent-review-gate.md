## Polityka nadrzędna

Poniższe zasady obowiązują, gdy review zostało wymagane lub wybrane i agent zdecydował, że niezależni specjaliści istotnie zwiększą wiarygodność werdyktu. Przy `trigger=adaptive` agent może pominąć formalne review albo wybrać inline. `profile=off`, `trigger=manual` bez jawnego żądania i `delegation=never` wyłączają automatyczny gate sub-agentów. `strict` lub `delegation=always` pozostają twardymi wymaganiami.

## Proporcjonalna mapa review
Każdy wymagany lub jawnie zlecony code review zaczyna się od krótkiej mapy obszarów istotnych dla zmienionego zachowania. Nie rozszerzaj mapy na nietknięte sektory:

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

Sprawdź wszystkie materialne obszary dotknięte zmianą, ale nie traktuj kompletności checklisty jako celu samego w sobie.

## Gate na sub-agentów

Przy `delegation=always` sub-agenci są obowiązkowi. Przy `delegation=risk-based` oraz profilu `balanced` to agent wybiera ich tylko wtedy, gdy konkretne ryzyko, nowość, blast radius albo rozmiar kontekstu uzasadnia koszt. Sam rozmiar lub dopasowanie nazwy pliku nie wystarcza. Specjalistów warto rozważyć, gdy PR:

- dotyka więcej niż jednej powierzchni systemu, np. UI + API, API + database, app + infra, generated client + backend;
- zawiera zmiany security, auth/session, authz/tenant, sekrety, dane osobowe, uploady, integracje zewnętrzne albo supply chain;
- zawiera migracje danych, schematy, kontrakty API, generated clients, rollback/cutover albo elementy rewrite/migration;
- zależy od zachowania frameworka, SDK, runtime, biblioteki, paczki, generatora, API zewnętrznego albo narzędzia, którego aktualna dokumentacja może zmienić ocenę review;
- zmienia deployment, runtime, kontenery, Nomad, proxy, TLS, observability, backup, capacity albo production readiness;
- jest zbyt duży, aby jeden agent mógł wiarygodnie przeanalizować wszystkie obszary w jednym kontekście;
- ma wiele typów plików, wiele modułów, dużą liczbę linii zmian albo łączy kod ręczny z wygenerowanym.

Przy profilu `balanced` inline review jest dopuszczalne zawsze, gdy jeden agent może wiarygodnie objąć materialne ryzyka; podaj krótki powód wyboru. Profil `strict` może wymusić niezależne pokrycie dla ryzykownego diffu. Przy `delegation=never` polityka zawsze pozwala na review inline.

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

Jeśli kilka materialnych ryzyk faktycznie wymaga niezależnej wiedzy, użyj wąskich sub-agentów. Nie uruchamiaj agentów dla każdego wykrytego sektora automatycznie.

## Kontrakt pracy sub-agenta review

Każdy sub-agent review powinien dostać:

- zakres: obszar systemu, ryzyko, pliki lub moduły do sprawdzenia;
- kontekst: opis PR, acceptance criteria, istotne decyzje techniczne i test evidence;
- aktualny kontekst technologii, jeśli finding zależy od frameworka, SDK, runtime, paczki, generatora albo API;
- oczekiwany rezultat: jeden skonsolidowany zestaw findings według severity, file references, sprawdzona walidacja, materialne braki testów, założenia i ryzyka resztkowe;
- ograniczenie: finding blokujący wymaga konkretnego wpływu i wiarygodnej ścieżki awarii; nie komentować stylu, opcjonalnych refaktorów, spekulacyjnych edge case'ów ani problemów legacy poza zmianą; nie duplikować findings spoza zakresu i nie modyfikować kodu.

Główny agent po powrocie sub-agentów:

- scala wyniki, deduplikuje i porządkuje je według severity;
- podnosi severity, gdy kilka obszarów wskazuje ten sam problem z różnych stron;
- nie ukrywa braków pokrycia ani nie udaje, że wykonano multi-agent review, jeśli sub-agenci nie byli dostępni;
- przygotowuje finalny werdykt i listę blokujących zmian przed merge.
