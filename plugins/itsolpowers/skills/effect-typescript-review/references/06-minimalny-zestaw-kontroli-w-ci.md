# effect-typescript-review Reference Sector: Minimalny zestaw kontroli w CI

## Zawartość

- Minimalny zestaw kontroli w CI
- Checklist skrócony do code review

## Minimalny zestaw kontroli w CI

Podstawowy zestaw:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Dla projektów Svelte/SvelteKit:

```bash
pnpm check
pnpm test:unit
pnpm test:e2e
pnpm build
```

Dla projektów Node z Effect:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
node dist/main.js --help
```

Dodatkowe kontrole:

```bash
pnpm audit
pnpm depcheck
pnpm knip
```

Zasady CI:

- typecheck musi przechodzić bez `any` dodanego w celu ukrycia błędu
- testy powinny obejmować mapowanie błędów Effect
- testy powinny obejmować dekodowanie Schema dla danych z zewnątrz
- build powinien sprawdzać, czy do frontendu nie trafiły backend-only importy
- lint powinien blokować nieobsłużone Promise na granicach z `runPromise`
- jeśli używasz generated clients albo schemas, CI powinno sprawdzać aktualność wygenerowanych plików
## Checklist skrócony do code review

### Model Effect

- czy funkcje efektowe zwracają `Effect`, a nie mieszankę `Promise` i `Effect`?
- czy `Effect` jest uruchamiany dopiero na granicy systemu?
- czy typ `Effect<A, E, R>` pokazuje prawdziwe błędy i zależności?
- czy czyste funkcje zostały czystymi funkcjami?
- czy nie ma `runPromise` w domenie albo service layer?

### Błędy

- czy expected errors są typowane?
- czy błędy mają `_tag`?
- czy nie ma stringów jako błędów w większym API?
- czy `tryPromise` ma własny `catch`?
- czy fallback nie ukrywa realnego problemu?
- czy błędy są mapowane na granicach warstw?
- czy defects nie są traktowane jak normalne błędy domenowe?

### API i dane zewnętrzne

- czy `fetch` sprawdza `response.ok` albo `response.status`?
- czy response jest walidowany przez Schema?
- czy network error, HTTP error i decode error są rozdzielone?
- czy requesty mają timeout?
- czy retry ma limit i dotyczy tylko błędów przejściowych?
- czy operacje mutujące są idempotentne przy retry?

### Services i layers

- czy zależności są przez service/layer, a nie globalne singletony?
- czy live layer nie przecieka do domeny?
- czy test layer jest łatwy do podstawienia?
- czy zasobowe zależności używają `Layer.scoped`?
- czy dependency graph jest składany w jednym kontrolowanym miejscu?
- czy service nie jest tworzony dla każdej małej funkcji?

### Concurrency i lifecycle

- czy concurrency jest limitowane?
- czy nie ma `unbounded` na danych od użytkownika?
- czy każdy fiber ma właściciela?
- czy long-running fiber obsługuje interruption?
- czy queue ma limit albo świadomą strategię utraty danych?
- czy stream/subscription/websocket ma cleanup?

### Resource management

- czy każdy acquire ma release?
- czy finalizery działają przy failure i interruption?
- czy scope zasobu pasuje do lifecycle aplikacji, requestu albo komponentu?
- czy transakcje i locki nie żyją zbyt długo?
- czy zasoby aplikacyjne są zamykane przy shutdown?

### Security

- czy sekrety nie trafiają do logów?
- czy dane wrażliwe są redacted?
- czy frontend nie importuje backend-only configu?
- czy dane wejściowe są walidowane?
- czy błędy pokazywane użytkownikowi są bezpieczne?
- czy autoryzacja nie zależy od ukrycia przycisku w UI?

### Observability

- czy logi mają request/job/tenant context?
- czy błędy są logowane raz na granicy operacji?
- czy spans obejmują operacje warte diagnozy?
- czy metryki obejmują latency, retry, timeouty i błędy?
- czy log level jest sterowany konfiguracją?

### Testy

- czy testy podstawiają services przez Layer albo `provideService`?
- czy testy nie używają realnego sleep dla timeoutów/retry?
- czy sprawdzono happy path i expected errors?
- czy sprawdzono błędne payloady Schema?
- czy sprawdzono cleanup zasobów?
- czy testy nie zależą od globalnego stanu?
