# effect-typescript-debugging Reference Sector: Frontend i Svelte/SvelteKit

## Zawartość

- Frontend i Svelte/SvelteKit
- Backend, CLI i workery
- Testowanie
- Wydajność
- Integracja z bibliotekami Promise
- Integracja z bazą danych
- Antywzorce

## Frontend i Svelte/SvelteKit

- nie zastępuj TanStack Query przez Effect tylko dlatego, że oba mogą pobierać dane
- TanStack Query dobrze obsługuje cache UI, invalidację, refetch i statusy zapytań
- Effect dobrze nadaje się do typed API client, walidacji, błędów, retry, timeoutów, zależności i workflow
- w Svelte uruchamiaj Effect w event handlerach, `load`, actions, stores albo adapterach API
- nie uruchamiaj `Effect.runPromise` w reactive statement bez kontroli cancellation
- w `onMount` albo `$effect` zwróć cleanup, jeśli uruchamiasz long-running fiber, subscription, stream albo polling
- przy zmianie route, parametrów albo komponentu przerwij poprzednią operację, jeśli wynik może przyjść po czasie
- nie zapisuj całego `Exit` albo `Cause` w stanie UI, jeśli komponent potrzebuje tylko statusu i komunikatu
- mapuj błędy domenowe na komunikaty UI w osobnym mapperze
- nie pokazuj użytkownikowi `_tag` jako komunikatu błędu
- waliduj response z backendu przez Schema przed zapisaniem do store
- po logout wyczyść cache, stores i aktywne fibery/subskrypcje
- nie trzymaj danych użytkownika w globalnym module scope po stronie SSR
- w SvelteKit per-request dependencies trzymaj w `event.locals`, `load` albo layer tworzony per request
- nie korzystaj z Node-only layerów w kodzie, który trafia do bundle przeglądarkowego
- rozdziel `*.server.ts` od kodu klienta, jeśli layer używa sekretów, filesystemu, process.env albo DB

Przykład event handlera:

```ts
import { Effect } from "effect"

let saving = false
let errorMessage: string | null = null

const onSubmit = async () => {
  saving = true
  errorMessage = null

  const exit = await Effect.runPromiseExit(saveProfile(formValue))

  saving = false

  if (exit._tag === "Failure") {
    errorMessage = "Nie udało się zapisać profilu"
    return
  }

  navigateToProfile(exit.value.id)
}
```
## Backend, CLI i workery

- w aplikacji Node używaj `NodeRuntime.runMain` jako głównego wejścia procesu
- w HTTP handlerze uruchamiaj Effect na granicy handlera albo przez adapter frameworka
- nie buduj całego runtime i layerów na każdy request, jeśli zależności są aplikacyjne
- zależności per request, np. current user, request id, auth context, twórz per request
- connection pool, logger i config twórz jako zależności aplikacyjne
- transakcję DB twórz jako zależność scoped dla konkretnego flow, jeśli kilka operacji ma być atomowe
- nie trzymaj transakcji przez zewnętrzny HTTP call
- worker powinien mieć graceful shutdown, cancellation i finalizery
- job powinien mieć idempotencję, retry limit, backoff, status i logi
- scheduler powinien być kontrolowany przez `Schedule` albo mechanizm kolejki, a nie przez losowe `setInterval` bez cleanup
- proces powinien kończyć się kodem błędu, jeśli start konfiguracji albo migracji nie przeszedł poprawnie
## Testowanie

- testuj czyste funkcje bez Effect jako zwykłe unit tests
- testuj efekty przez `Effect.runPromise`, `Effect.runPromiseExit` albo test runtime
- podstawiaj zależności przez test layers albo `provideService`
- nie używaj globalnych mocków, jeśli service można wstrzyknąć przez Effect
- testuj happy path, expected errors i defects, jeśli kod je izoluje
- testuj mapowanie błędów z API/DB na błędy domenowe
- testuj dekodowanie Schema dla poprawnych i błędnych payloadów
- testuj retry przez kontrolowany efekt, który zwraca błąd określoną liczbę razy
- dla czasu używaj TestClock albo kontrolowanej warstwy czasu, zamiast realnego `sleep`
- nie rób testów czekających realnie kilka sekund na retry albo timeout
- testuj cancellation dla long-running fibers, streamów i subskrypcji
- testuj finalizery zasobów
- testuj layer composition, jeśli aplikacja ma kilka runtime profiles: Live, Test, Dev, Worker
- testy integracyjne z API powinny walidować shape danych, a nie tylko status HTTP
- nie snapshotuj pełnych `Cause`, jeśli snapshot będzie niestabilny i nieczytelny

Przykład testowego podstawienia service:

```ts
import { Effect } from "effect"
import { describe, expect, it } from "vitest"

it("loads user name", async () => {
  const program = getCurrentUserName.pipe(
    Effect.provideService(HttpClient, new HttpClient({
      getJson: () => Effect.succeed({ id: 1, name: "Alice" })
    }))
  )

  await expect(Effect.runPromise(program)).resolves.toBe("Alice")
})
```
## Wydajność

- nie zakładaj, że Effect jest problemem wydajnościowym bez profilu
- nie zakładaj, że Effect nic nie kosztuje w hot path
- używaj Effect głównie na granicach I/O, workflow, concurrency i resource management
- czyste, bardzo częste transformacje w hot path mogą pozostać zwykłymi funkcjami
- nie twórz tysięcy bardzo małych efektów w ciasnej pętli bez pomiaru
- nie używaj `Effect.gen` w mikrofragmentach, jeśli zwykły operator albo funkcja jest prostsza
- limituj concurrency dla dużych kolekcji
- unikaj `concurrency: "unbounded"` w requestach zależnych od użytkownika
- nie loguj w pętli hot path bez kontroli poziomu logowania
- nie waliduj przez Schema wielokrotnie tego samego obiektu bez powodu
- dekoduj dane na granicy systemu, a dalej przekazuj już zwalidowany typ
- nie twórz layerów w pętli albo per element kolekcji
- reuse'uj runtime i zależności aplikacyjne
- cache stosuj z limitem i pomiarem hit rate
- przy dużych danych używaj Stream zamiast ładowania wszystkiego do pamięci
- mierz latency, CPU, alokacje, bundle size i liczbę requestów przed i po zmianach
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
