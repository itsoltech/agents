# effect-typescript-review Reference Sector: API client i fetch

## Zawartość

- API client i fetch
- Schema i walidacja runtime
- Typy domenowe, Data i branded types

## API client i fetch

- nie wywołuj `fetch` bezpośrednio w komponentach, jeśli projekt używa Effect jako warstwy efektów
- opakuj `fetch` w typed API client zwracający `Effect`
- obsługuj osobno błąd sieci, status HTTP i błąd dekodowania odpowiedzi
- pamiętaj, że `fetch` nie odrzuca Promise dla statusów HTTP typu 400/500; sprawdzaj `response.ok` albo `response.status`
- przekazuj `AbortSignal` z `Effect.tryPromise` do `fetch`
- waliduj odpowiedź przez `Schema.decodeUnknown`
- nie zakładaj, że typ TypeScript z backendu jest zgodny z runtime response
- nie parsuj JSON kilka razy z tego samego `Response`
- nie czytaj pełnego body błędu, jeśli odpowiedź może być bardzo duża
- ogranicz rozmiar payloadów po stronie serwera i klienta, jeśli endpoint może zwrócić duże dane
- nie loguj pełnych odpowiedzi API z danymi osobowymi albo sekretami
- mapuj statusy HTTP na typowane błędy domenowe albo infrastrukturalne
- retry stosuj tylko dla błędów, które można bezpiecznie powtórzyć
- nie retryuj automatycznie operacji mutujących bez idempotency key albo innego zabezpieczenia
- timeout powinien być częścią klienta API, a nie przypadkowym `setTimeout` w UI

Przykładowy klient API:

```ts
import { Data, Effect, Schema } from "effect"

class NetworkError extends Data.TaggedError("NetworkError")<{
  readonly cause: unknown
}>() {}

class HttpError extends Data.TaggedError("HttpError")<{
  readonly status: number
  readonly body: string
}>() {}

class DecodeError extends Data.TaggedError("DecodeError")<{
  readonly cause: unknown
}>() {}

const User = Schema.Struct({
  id: Schema.Number,
  name: Schema.String
})

export type User = Schema.Schema.Type<typeof User>

export const getUser = (id: number) =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: (signal) => fetch(`/api/users/${id}`, { signal }),
      catch: (cause) => new NetworkError({ cause })
    })

    if (!response.ok) {
      const body = yield* Effect.tryPromise({
        try: () => response.text(),
        catch: (cause) => new NetworkError({ cause })
      })

      return yield* Effect.fail(
        new HttpError({ status: response.status, body })
      )
    }

    const json = yield* Effect.tryPromise({
      try: () => response.json() as Promise<unknown>,
      catch: (cause) => new DecodeError({ cause })
    })

    return yield* Schema.decodeUnknown(User)(json).pipe(
      Effect.mapError((cause) => new DecodeError({ cause }))
    )
  })
```
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
