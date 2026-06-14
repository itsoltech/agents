# effect-typescript-implementation Reference Sector: Schema i walidacja runtime

## Zawartość

- Schema i walidacja runtime
- Typy domenowe, Data i branded types
- Pattern matching
- Services, Context i Layer
- Layer composition

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
## Typy domenowe, Data i branded types

- używaj branded types dla ID, tenantów, emaili, kwot, walut, jednostek i typów o tym samym runtime representation
- nie przekazuj gołego `string` tam, gdzie pomylenie wartości może spowodować błąd biznesowy
- używaj `Data.TaggedClass`, `Data.TaggedError` albo `Data.struct`, gdy potrzebujesz value equality, hashing albo `_tag`
- nie używaj zwykłych obiektów bez `_tag` dla złożonych unionów domenowych
- używaj `Match` albo `$match` dla rozgałęzień, które powinny być exhaustive
- nie używaj luźnych stringów jako statusów w wielu miejscach kodu
- trzymaj statusy, role i event types jako union, literal schema albo tagged union
- nie nadużywaj klas, jeśli zwykły immutable object z tagiem jest czytelniejszy
- jeśli typ ma invariants, wymuś je konstruktorem albo schema, a nie komentarzem

Przykład:

```ts
import { Brand } from "effect"

export type OrderId = string & Brand.Brand<"OrderId">
export const OrderId = Brand.nominal<OrderId>()

const orderId = OrderId("ord_123")
```
## Pattern matching

- używaj pattern matching dla tagged unionów, statusów i błędów, które mają skończoną liczbę wariantów
- preferuj exhaustive matching tam, gdzie brak obsługi wariantu byłby błędem
- nie zamieniaj prostego `if` na `Match`, jeśli pogarsza czytelność
- nie używaj `orElse` jako stałego wyjścia z każdego matcha, jeśli powinien być exhaustive
- w warstwie HTTP mapuj błędy przez match/catch po `_tag`, a nie przez porównywanie tekstu message
- nie używaj `instanceof` dla błędów, które mogą przejść przez granicę procesu, JSON albo bundle
- `_tag` powinien być stabilny i nie powinien zależeć od tekstu komunikatu błędu
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
