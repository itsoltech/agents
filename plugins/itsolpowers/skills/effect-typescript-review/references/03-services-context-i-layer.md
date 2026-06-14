# effect-typescript-review Reference Sector: Services, Context i Layer

## Zawartość

- Services, Context i Layer
- Layer composition
- Konfiguracja i sekrety
- Resource management i Scope
- Retry, timeouty i Schedule

## Services, Context i Layer

- używaj services do zależności, które mają implementację zależną od środowiska albo wymagają mockowania
- przykłady services: HTTP client, logger, clock, random, config, database, repository, queue, auth provider, feature flags
- nie twórz service dla każdej czystej funkcji
- service powinien opisywać kontrakt, a nie konkretną implementację
- metody service powinny zwracać `Effect`, jeśli wykonują I/O, korzystają z czasu, zależności albo mogą zwrócić typowany błąd
- używaj `Effect.Service` w kodzie aplikacyjnym, jeśli istnieje sensowna domyślna implementacja runtime
- używaj `Context.Tag` w bibliotekach, dynamicznych zależnościach albo tam, gdzie nie chcesz wymuszać domyślnej implementacji
- nie przeciekaj zależności implementacji do interfejsu service
- jeśli `Database` potrzebuje `Config` i `Logger`, to zależność powinna być w `Layer`, a nie w publicznym typie metody `query`
- warstwa Live nie powinna być importowana przez kod domenowy
- warstwa Test powinna być łatwa do podstawienia bez globalnych mocków
- nie buduj layerów w środku każdej funkcji biznesowej
- składaj layery przy starcie aplikacji, testu, requestu albo joba
- unikaj globalnego singletona ukrytego poza Effect Context
- jeśli service zarządza zasobem, użyj `scoped` albo `Layer.scoped`
- jeśli service nie ma zasobów, `sync` albo `succeed` jest prostsze
- nie używaj `provideService` w wielu losowych miejscach, jeśli zależność powinna być częścią runtime

Przykład service:

```ts
import { Data, Effect } from "effect"

class HttpError extends Data.TaggedError("HttpError")<{
  readonly status: number
}>() {}

export class HttpClient extends Effect.Service<HttpClient>()("HttpClient", {
  effect: Effect.succeed({
    getJson: (url: string): Effect.Effect<unknown, HttpError> =>
      Effect.gen(function* () {
        const response = yield* Effect.tryPromise({
          try: (signal) => fetch(url, { signal }),
          catch: () => new HttpError({ status: 0 })
        })

        if (!response.ok) {
          return yield* Effect.fail(new HttpError({ status: response.status }))
        }

        return yield* Effect.tryPromise({
          try: () => response.json() as Promise<unknown>,
          catch: () => new HttpError({ status: 0 })
        })
      })
  })
}) {}
```

Użycie:

```ts
import { Effect } from "effect"

const program = Effect.gen(function* () {
  const http = yield* HttpClient
  return yield* http.getJson("/api/me")
})
```
## Layer composition

- traktuj `Layer` jako konstruktor zależności
- składaj dependency graph jawnie
- nie twórz zależności przez importowanie gotowych instancji z modułów
- zależności współdzielone przez aplikację buduj raz na starcie runtime
- zależności per request twórz w scope requestu
- zależności per test twórz w setup testu
- nie mieszaj `Layer.succeed`, `Layer.effect`, `Layer.scoped` bez zrozumienia lifecycle
- `Layer.succeed` stosuj dla gotowej wartości
- `Layer.effect` stosuj dla zależności budowanej efektowo bez finalizera
- `Layer.scoped` stosuj dla zależności wymagającej zwolnienia
- przy kompozycji layerów unikaj cykli zależności
- jeśli layer ma złożoną konfigurację, wydziel factory z czytelnym typem wejścia
- nie twórz live layera zależnego od testowych mocków
- nie twórz test layera importującego live zależności z bazy, HTTP albo filesystemu bez powodu

Przykład wariantów:

```ts
import { Effect, Layer } from "effect"

export const AppLive = Layer.mergeAll(
  ConfigService.Default,
  LoggerService.Default,
  HttpClient.Default
)

export const AppTest = Layer.mergeAll(
  ConfigService.Default,
  Layer.succeed(HttpClient, new HttpClient({
    getJson: () => Effect.succeed({ id: 1, name: "Test" })
  }))
)
```
## Konfiguracja i sekrety

- konfigurację czytaj przez dedykowany moduł albo service
- waliduj konfigurację przy starcie aplikacji
- nie czytaj `process.env` w losowych miejscach kodu domenowego
- nie trzymaj sekretów w kodzie frontendowym
- nie wysyłaj sekretów do bundle przeglądarkowego
- używaj `Redacted` dla wartości, które nie powinny trafić do logów albo message błędu
- nie wyciągaj wartości z `Redacted` bezpośrednio przed logowaniem
- nie loguj pełnych connection stringów, tokenów, API keys, cookies, session IDs ani nagłówków `Authorization`
- konfigurację środowiskową trzymaj w typowanym service
- dla wartości z jednostkami używaj `Duration` albo nazw pól zawierających jednostkę, np. `requestTimeoutMs`
- nie używaj fallbacków konfiguracji w produkcji, jeśli brak wartości powinien zatrzymać start aplikacji
- konfiguracja klienta frontendowego powinna zawierać tylko wartości publiczne

Przykład:

```ts
import { Redacted } from "effect"

export type ApiConfig = {
  readonly baseUrl: string
  readonly apiKey: Redacted.Redacted<string>
}
```
## Resource management i Scope

- każdy zasób z acquire powinien mieć release
- zasoby to między innymi connection pool, file handle, lock, temporary directory, subscription, timer, stream, websocket, worker
- dla prostego cleanup używaj `Effect.ensuring`, `Effect.onExit` albo `Effect.onError`
- dla zasobów z lifecycle używaj `Effect.acquireRelease`, `Effect.scoped` i `Scope`
- dla zależności zasobowych używaj `Layer.scoped`
- nie otwieraj zasobu w `Effect.sync` bez finalizera
- nie zostawiaj subskrypcji, timerów i websocketów bez cleanup
- nie trzymaj transakcji, locka albo pliku dłużej niż potrzeba
- zasób per request powinien być zamknięty po request
- zasób aplikacyjny powinien być zamknięty przy shutdown
- finalizer nie powinien zależeć od zwykłego happy path
- finalizer powinien być odporny na częściowo zainicjalizowany stan
- przy wielu finalizerach opisz oczekiwaną kolejność zamykania, jeśli ma znaczenie

Przykład:

```ts
import { Effect } from "effect"

const withLock = <A, E, R>(program: Effect.Effect<A, E, R>) =>
  Effect.acquireUseRelease(
    acquireLock,
    () => program,
    (lock) => releaseLock(lock)
  )
```
## Retry, timeouty i Schedule

- każdy request do zewnętrznego systemu powinien mieć timeout albo deadline
- retry powinien mieć limit
- retry powinien mieć backoff albo spacing, jeśli dotyczy zewnętrznego systemu
- nie retryuj walidacji, 400, 401, 403, błędów domenowych i błędów trwałych
- retryuj tylko błędy przejściowe: timeout, 429, 503, chwilowy network error
- dla 429 respektuj `Retry-After`, jeśli API go zwraca
- dla operacji mutujących stosuj idempotency key albo inny mechanizm deduplikacji
- nie łącz dużej liczby retry z nieograniczoną współbieżnością
- loguj ostatni błąd i liczbę prób na granicy operacji
- nie implementuj retry ręcznie przez rekurencję i `setTimeout`, jeśli wystarczy `Effect.retry` + `Schedule`
- dla polling używaj `Schedule`, ale zapewnij shutdown/cancellation
- timeout błędu mapuj na typ rozpoznawalny przez wyższą warstwę
- rozdziel timeout całego flow od timeoutu pojedynczej próby, jeśli ma to znaczenie

Przykład:

```ts
import { Effect, Schedule } from "effect"

const retryPolicy = Schedule.exponential("100 millis").pipe(
  Schedule.intersect(Schedule.recurs(3))
)

const program = callExternalApi.pipe(
  Effect.timeout("5 seconds"),
  Effect.retry(retryPolicy)
)
```
