# effect-typescript-debugging Reference Sector: Overview

## Zawartość

- Overview
- Granice uruchamiania Effect
- Error model
- Cause, Exit i diagnostyka błędów
- API client i fetch


## Granice uruchamiania Effect

- uruchamiaj Effect możliwie blisko granicy aplikacji
- w Node CLI albo workerze używaj `NodeRuntime.runMain`, jeśli potrzebujesz poprawnego shutdown i obsługi przerwania procesu
- w kodzie frontendowym używaj `Effect.runPromise` na granicy event handlera, `load`, submit formularza albo integracji z biblioteką
- w domenie i service layer nie wywołuj `Effect.runPromise`, `Effect.runSync` ani `Effect.runFork`
- `Effect.runSync` stosuj tylko dla efektów synchronicznych
- nie uruchamiaj async efektu przez `runSync`
- `Effect.runPromise` mapuje błąd Effect na odrzucony Promise, więc na granicy UI/API obsłuż reject
- jeśli potrzebujesz pełnego wyniku sukces/porażka bez reject, użyj `Effect.runPromiseExit`
- `Effect.runFork` stosuj tylko wtedy, gdy masz plan na lifecycle fibera
- nie odpalaj fibera w tle bez możliwości zatrzymania, dołączenia albo monitorowania
- każdy long-running fiber powinien mieć właściciela: scope, supervisor, proces, komponent, job albo runtime
- nie uruchamiaj Effect w module scope, jeśli zależy od konfiguracji, requestu, użytkownika albo środowiska

Przykład granicy w Node:

```ts
import { Console, Effect, Schedule } from "effect"
import { NodeRuntime } from "@effect/platform-node"

const program = Effect.gen(function* () {
  yield* Console.log("Application started")
  yield* Effect.repeat(Console.log("still alive"), {
    schedule: Schedule.spaced("1 second")
  })
})

NodeRuntime.runMain(program)
```

Przykład granicy w UI:

```ts
import { Effect } from "effect"

const submit = async () => {
  const result = await Effect.runPromiseExit(saveOrder(order))

  if (result._tag === "Failure") {
    showError("Nie udało się zapisać zamówienia")
    return
  }

  showSuccess(result.value)
}
```
## Error model

- rozróżniaj expected errors i defects
- expected errors są częścią domeny i powinny trafiać do kanału `E`
- defects oznaczają błąd programisty, naruszenie invariantu, nieoczekiwany crash albo sytuację poza normalnym flow
- nie używaj `throw` do modelowania expected errors
- nie używaj stringów jako błędów w większym kodzie
- modeluj błędy przez klasy z `_tag`, najczęściej `Data.TaggedError`
- nie twórz jednego błędu `AppError` z polem `code`, jeśli przez to tracisz exhaustiveness
- nie mapuj wszystkich błędów na `Error` z message, jeśli potem musisz rozróżniać przypadki
- używaj `catchTag` / `catchTags` do obsługi konkretnych błędów
- używaj `catchAll` tylko tam, gdzie naprawdę chcesz obsłużyć wszystkie błędy z kanału `E`
- używaj `mapError`, gdy zmieniasz poziom abstrakcji błędu
- używaj `orElse` albo fallback tylko wtedy, gdy fallback jest poprawny biznesowo
- nie maskuj błędów przez pusty fallback, np. `Effect.succeed([])`, jeśli użytkownik powinien dostać informację o problemie
- nie loguj błędu na każdej warstwie; loguj na granicy requestu, joba albo procesu
- zachowuj oryginalną przyczynę błędu w polu `cause`, jeśli jest przydatna diagnostycznie

Przykład błędów domenowych:

```ts
import { Data } from "effect"

export class OrderNotFound extends Data.TaggedError("OrderNotFound")<{
  readonly orderId: string
}>() {}

export class OrderAlreadyPaid extends Data.TaggedError("OrderAlreadyPaid")<{
  readonly orderId: string
}>() {}

export class AccessDenied extends Data.TaggedError("AccessDenied")<{
  readonly userId: string
}>() {}
```

Przykład obsługi:

```ts
import { Effect } from "effect"

const response = submitOrder(orderId).pipe(
  Effect.catchTag("OrderNotFound", (error) =>
    Effect.succeed({ status: 404 as const, body: { orderId: error.orderId } })
  ),
  Effect.catchTag("OrderAlreadyPaid", (error) =>
    Effect.succeed({ status: 409 as const, body: { orderId: error.orderId } })
  )
)
```
## Cause, Exit i diagnostyka błędów

- używaj `Exit`, gdy chcesz jawnie pracować z wynikiem sukces/porażka bez rzucania wyjątku do Promise
- używaj `Cause`, gdy potrzebujesz informacji o fail, die, interrupt albo złożonych błędach równoległych
- nie pokazuj użytkownikowi surowego `Cause`
- nie serializuj pełnego `Cause` do API response bez sanitizacji
- loguj `Cause` na granicy systemu, jeśli potrzebujesz pełnej diagnostyki
- nie łap defects jako normalnych błędów domenowych
- jeśli musisz odzyskać się po defects, izoluj to na granicy procesu, workera albo request handlera
- przy błędach równoległych sprawdzaj, czy kod nie traci części przyczyn
- przy `Effect.all` z concurrency pamiętaj, że równoległe błędy mogą mieć inną strukturę przyczyn niż sekwencyjne
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
