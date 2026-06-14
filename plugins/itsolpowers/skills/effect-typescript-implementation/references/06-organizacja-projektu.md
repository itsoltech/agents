# effect-typescript-implementation Reference Sector: Organizacja projektu

## Zawartość

- Organizacja projektu
- Czytelność i styl
- Integracja z bibliotekami Promise
- Integracja z bazą danych
- Antywzorce
- Minimalny zestaw kontroli w CI

## Organizacja projektu

Preferuj podział po funkcjonalnościach i granicach odpowiedzialności. Nie twórz jednego folderu `effect/` na cały projekt, jeśli przez to każdy feature importuje wszystko.

Przykład:

```txt
src/
  app/
    config/
      ConfigService.ts
    layers/
      AppLive.ts
      AppTest.ts
    runtime/
      main.ts
  shared/
    effect/
      errors.ts
      apiClient.ts
      schema.ts
    security/
      redacted.ts
  features/
    orders/
      model/
        Order.ts
        OrderErrors.ts
        OrderSchema.ts
      api/
        OrdersClient.ts
      services/
        OrdersRepository.ts
        OrdersService.ts
      program/
        submitOrder.ts
      tests/
        submitOrder.test.ts
```

Zasady:

- kod domenowy trzymaj blisko feature'a
- błędy feature'a trzymaj blisko logiki feature'a
- schema response/request trzymaj blisko API clienta albo modelu
- live implementacje zależności trzymaj w `layers`, `infra` albo `adapters`
- test implementations trzymaj przy testach albo w `testing`
- nie importuj warstwy live z domeny
- nie importuj UI z warstwy Effect
- nie importuj backend-only zależności do kodu frontendowego
- plik z programem biznesowym powinien głównie składać efekty, nie definiować wszystkie adaptery
- unikaj plików `utils.ts` z losowymi helperami Effect
- jeśli helper jest wspólny, jego nazwa powinna mówić, jaki problem rozwiązuje
## Czytelność i styl

- nazwy efektów powinny opisywać operację, np. `loadUser`, `submitOrder`, `decodeInvoice`, `withTransaction`
- nie nazywaj wszystkiego `program`, poza lokalnymi przykładami albo entrypointem
- nie używaj skrótów typu `eff`, `fx`, `svc`, jeśli projekt nie ma takiej konwencji
- nie twórz efektów o bardzo szerokim typie błędu, jeśli funkcja ma mały zakres odpowiedzialności
- nie ukrywaj zależności w closure, jeśli powinna być service
- nie ukrywaj requestu HTTP za nazwą funkcji wyglądającą jak czysty getter
- komentarze powinny opisywać powód decyzji, a nie przepisywać operator Effect
- jeśli pipeline wymaga komentarza przy każdym kroku, rozważ `Effect.gen` albo rozbicie funkcji
- jeśli `Effect.gen` ma ponad 80-100 linii, sprawdź, czy nie miesza kilku przypadków użycia
- jeśli typ błędu ma bardzo dużo wariantów, sprawdź, czy warstwa nie robi zbyt wiele
- nie pisz generycznych helperów Effect przed wystąpieniem realnej duplikacji
- unikaj operatorów punktowo-funkcyjnych dla osób spoza zespołu, jeśli prostszy kod jest wystarczający
## Integracja z bibliotekami Promise

- owijaj Promise API przez `Effect.tryPromise` albo `Effect.promise`
- jeśli biblioteka wspiera cancellation przez `AbortSignal`, przekazuj signal
- jeśli biblioteka używa własnego cancel token, zmapuj interruption Effect na cancel token przez `Effect.async` albo scoped resource
- nie mieszaj `.then/.catch` z `Effect` w środku domeny
- nie konwertuj `Effect` do Promise i z powrotem bez powodu
- na granicy z biblioteką UI dopuszczalne jest `runPromise`
- na granicy z biblioteką backendową dopuszczalne jest adapterowanie handlera Promise do Effect albo odwrotnie
- jeśli biblioteka rzuca wyjątki synchroniczne mimo że zwraca Promise, sprawdź, czy wrapper je łapie
- jeśli Promise może wisieć bez końca, dodaj timeout
## Integracja z bazą danych

- repository może być service zwracającym `Effect`
- błędy bazy mapuj na błędy infrastrukturalne albo domenowe
- nie przepuszczaj surowych błędów drivera DB do UI/API
- pool DB powinien być zależnością aplikacyjną w Layer
- transakcja DB powinna mieć scope i finalizer
- nie trzymaj transakcji przez zewnętrzny request HTTP
- constraints z bazy mapuj na konkretne błędy, np. duplicate, foreign key, not found
- unikaj N+1 queries przez batching albo jedno zapytanie
- dodawaj timeouty na query albo na flow biznesowy
- nie retryuj konfliktów transakcji bez limitu
- nie retryuj operacji, które mogą podwójnie wykonać efekt uboczny
## Antywzorce

- `Effect.runPromise` w środku funkcji domenowej
- `Effect.runFork` bez `join`, `interrupt`, scope albo supervisora
- `Effect.tryPromise(() => alreadyStartedPromise)`
- `Effect.promise` dla Promise, który może rejectować
- błędy jako stringi w publicznym API modułu
- jeden `UnknownError` dla wszystkich przypadków
- `catchAll(() => Effect.succeed(defaultValue))` bez uzasadnienia biznesowego
- `concurrency: "unbounded"` na danych od użytkownika
- live layer importowany przez kod domenowy
- service dla każdej małej funkcji
- `process.env` czytany w wielu plikach
- sekrety w bundle frontendowym
- `console.log` rozsiane po efektach produkcyjnych
- `Schema.decodeUnknownSync` w async flow, gdzie błąd powinien być w kanale Effect
- globalny mutable state poza `Ref`, service albo kontrolowanym modulem
- cache bez limitu
- retry bez limitu
- timeout bez mapowania błędu
- stream bez cleanup
- websocket/subscription bez finalizera
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
