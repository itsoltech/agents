# effect-typescript-implementation Reference Sector: Effect.gen i pipe

## Zawartość

- Effect.gen i pipe
- Error model
- Cause, Exit i diagnostyka błędów
- API client i fetch

## Effect.gen i pipe

- używaj `Effect.gen(function* () { ... })` dla kodu przypominającego sekwencyjny flow
- wewnątrz `Effect.gen` pobieraj wynik efektu przez `yield*`
- nie używaj `await` na Effect
- nie mieszaj wielu poziomów `Effect.gen` bez powodu
- jeśli funkcja ma 2-3 proste transformacje, `pipe` może być czytelniejszy niż generator
- jeśli funkcja ma wiele `if`, `switch`, retry, walidację i zależności, generator zwykle będzie czytelniejszy
- unikaj zagnieżdżonych `pipe` dłuższych niż kilka kroków
- nie używaj `Effect.gen` do czystych obliczeń, jeśli zwykła funkcja jest prostsza
- nie zwracaj gołego `Promise` z `Effect.gen`; owiń go przez `Effect.tryPromise` albo przenieś na granicę
- nie łap błędów przez `try/catch` w generatorze, jeśli są błędami Effect; używaj `catchTag`, `catchAll`, `mapError`, `either`, `exit`
- dla flow z wieloma zależnymi requestami zachowuj sekwencyjność jawnie
- dla niezależnych operacji używaj `Effect.all` z ustawionym poziomem concurrency

Przykład:

```ts
import { Effect } from "effect"

const program = Effect.gen(function* () {
  const user = yield* getUser(userId)
  const permissions = yield* getPermissions(user.id)

  if (!permissions.canEdit) {
    return yield* Effect.fail(new AccessDenied({ userId: user.id }))
  }

  return yield* updateUser(user.id, payload)
})
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
