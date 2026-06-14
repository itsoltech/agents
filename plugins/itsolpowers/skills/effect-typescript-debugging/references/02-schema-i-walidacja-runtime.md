# effect-typescript-debugging Reference Sector: Schema i walidacja runtime

## Zawartość

- Schema i walidacja runtime
- Services, Context i Layer
- Layer composition
- Konfiguracja i sekrety

## Schema i walidacja runtime

- używaj Schema na granicach systemu: API response, request body, query params, localStorage, message event, websocket, kolejka, plik, env
- nie używaj samego typu TypeScript jako gwarancji danych z runtime
- definiuj schema blisko kontraktu danych albo feature'a
- nie trzymaj wszystkich schematów w jednym globalnym pliku `schemas.ts`
- używaj `Schema.Struct`, `Schema.Array`, `Schema.Literal`, `Schema.Union` i transformacji zamiast ręcznego parsowania tam, gdzie schema poprawia bezpieczeństwo
- typ domenowy wyciągaj przez `Schema.Schema.Type<typeof MySchema>`
- typ zakodowany wyciągaj przez `Schema.Schema.Encoded<typeof MySchema>`, jeśli format zewnętrzny różni się od formatu domenowego
- `Schema.decodeUnknownSync` stosuj tylko dla schematów bez async transformacji i w miejscach, gdzie wyjątek jest akceptowalny
- w kodzie Effect preferuj `Schema.decodeUnknown`, bo zwraca `Effect` z typowanym `ParseError`
- mapuj `ParseError` na błąd domenowy albo infrastrukturalny na granicy warstwy
- nie przepuszczaj surowego `ParseError` do UI bez formatowania
- dla endpointów publicznych nie zdradzaj w odpowiedzi zbyt wielu szczegółów walidacji, jeśli mogłoby to pomóc w nadużyciach
- jeśli backend zwraca daty jako string, schema powinna jawnie transformować je do typu używanego w aplikacji albo zostawić jako string z jasną konwencją
- nie mieszaj wielu bibliotek walidacyjnych w jednym feature bez powodu
- jeśli projekt korzysta już z Zod/Valibot, ustal, które granice waliduje Schema, a które istniejące biblioteki

Przykład:

```ts
import { Effect, Schema } from "effect"

const Order = Schema.Struct({
  id: Schema.String,
  status: Schema.Literal("draft", "paid", "cancelled"),
  total: Schema.Number
})

export type Order = Schema.Schema.Type<typeof Order>

export const parseOrder = (input: unknown) =>
  Schema.decodeUnknown(Order)(input).pipe(
    Effect.mapError((cause) => new InvalidOrderPayload({ cause }))
  )
```
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
