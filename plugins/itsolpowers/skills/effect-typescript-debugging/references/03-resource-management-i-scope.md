# effect-typescript-debugging Reference Sector: Resource management i Scope

## Zawartość

- Resource management i Scope
- Retry, timeouty i Schedule
- Concurrency
- Fibers i lifecycle
- Queue, PubSub i backpressure
- Ref, SynchronizedRef i stan
- Cache i batching
- Stream i Sink
- Observability

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
## Concurrency

- używaj `Effect.all` dla łączenia niezależnych efektów
- domyślnie operacje w `Effect.all` są sekwencyjne, jeśli nie ustawisz `concurrency`
- ustawiaj `concurrency` jawnie, gdy równoległość ma znaczenie dla wydajności albo limitów systemu
- unikaj `concurrency: "unbounded"` dla danych zależnych od użytkownika, list z API albo dużych kolekcji
- limituj równoległość dla requestów HTTP, dostępu do bazy, filesystemu i CPU-heavy operacji
- nie wykonuj tysięcy zadań naraz bez backpressure
- jeśli kolejność wyniku ma znaczenie, sprawdź kontrakt operatora, którego używasz
- nie zakładaj, że operacje z efektami ubocznymi mogą być bezpiecznie równoległe
- dla first-success albo race używaj operatorów race świadomie i obsłuż przerwanie przegranych zadań
- jeśli efekt ma finalizer, sprawdź zachowanie przy interruption
- nie używaj concurrency jako obejścia wolnego endpointu bez analizy limitów backendu

Przykład:

```ts
import { Effect } from "effect"

const loadUsers = (ids: ReadonlyArray<number>) =>
  Effect.all(
    ids.map((id) => getUser(id)),
    { concurrency: 8 }
  )
```
## Fibers i lifecycle

- fiber to jednostka współbieżnego wykonania w Effect
- nie twórz fibera bez właściciela
- jeśli używasz `Effect.fork`, później wykonaj `Fiber.join`, `Fiber.interrupt` albo zarządzaj fiberem przez scope/supervisor
- nie ignoruj błędów fibera uruchomionego w tle
- long-running fiber powinien reagować na interruption
- przy shutdown przerywaj fibery i czekaj na finalizery
- jeśli fiber pracuje cyklicznie, dodaj sleep/schedule, żeby nie zajął event loop w pętli
- dla workerów okresowych używaj `Schedule`, `repeat` albo kolejki z kontrolowanym backpressure
- nie przechowuj fiberów w globalnych zmiennych bez planu cleanup
## Queue, PubSub i backpressure

- używaj `Queue` do komunikacji producer-consumer
- preferuj bounded queue, jeśli producent może generować dane szybciej niż konsument
- nie używaj unbounded queue dla danych zależnych od użytkownika albo ruchu sieciowego bez limitu
- wybierz strategię kolejki świadomie: bounded, dropping, sliding, unbounded
- dropping/sliding są dopuszczalne tylko wtedy, gdy utrata danych jest akceptowalna
- `PubSub` stosuj do broadcastu zdarzeń do wielu subskrybentów
- nie używaj `PubSub` jako trwałej kolejki zadań
- kolejka w pamięci nie zastępuje trwałego brokera, jeśli zadania muszą przeżyć restart procesu
- konsument kolejki powinien mieć obsługę błędów, retry i shutdown
- nie loguj każdego elementu kolejki w hot path
- dla requestów do zewnętrznego API używaj `Semaphore` albo concurrency limit
- `Semaphore` powinien chronić zasób, który ma realny limit, np. API, DB, CPU, filesystem
## Ref, SynchronizedRef i stan

- używaj `Ref` dla współdzielonego, bezpiecznie modyfikowanego stanu w Effect
- nie używaj zwykłej zmiennej modułowej jako mutable state w kodzie współbieżnym
- używaj `SynchronizedRef`, gdy aktualizacja stanu sama jest efektowa
- używaj `SubscriptionRef`, gdy konsumenci mają obserwować zmiany
- nie trzymaj dużego cache w `Ref` bez limitu rozmiaru
- nie traktuj `Ref` jako globalnego worka na stan aplikacji
- operacje na stanie powinny być małe i opisane
- jeśli stan ma invariants, ukryj `Ref` za service
- nie eksponuj surowego `Ref` poza moduł, jeśli dowolna zmiana może złamać reguły domenowe
## Cache i batching

- używaj cache dla kosztownych, powtarzalnych efektów z jasnym kluczem
- każdy cache powinien mieć limit, TTL albo strategię invalidacji
- nie cache'uj danych per-user w globalnym cache bez tenant/user key
- nie cache'uj odpowiedzi zawierających dane wrażliwe bez kontroli lifecycle
- przy cache'owaniu błędów ustal, które błędy można zapamiętać
- nie ukrywaj błędów przez cache fallback bez metryki albo logu
- batching stosuj dla N+1 requestów albo powtarzalnych odczytów w jednym flow
- nie batchuj operacji, które mają różne wymagania autoryzacji bez sprawdzenia kontekstu
- cache powinien być zależnością przez Layer, jeśli jego lifetime jest aplikacyjny albo testowy
## Stream i Sink

- używaj `Stream` dla danych strumieniowych, dużych plików, eventów, websocketów, kolejek i ciągłych źródeł
- nie ładuj całego pliku albo dużego response do pamięci, jeśli można przetwarzać strumieniowo
- przy streamach stosuj backpressure
- obsługuj błędy streama typowanym kanałem błędu
- zasoby używane przez stream powinny być scoped
- nie zostawiaj streama bez cancellation
- stosuj `Sink` dla konsumpcji strumienia, agregacji, zapisu albo walidacji przepływu
- nie mieszaj Node streams, Web Streams i Effect Stream bez adaptera z jasnym lifecycle
- przy konwersji między streamami sprawdź, kto odpowiada za zamknięcie źródła
## Observability

- używaj `Effect.log`, `Effect.logInfo`, `Effect.logWarning`, `Effect.logError` zamiast przypadkowego `console.log` w kodzie Effect
- `console.log` zostaw dla prostych skryptów, prototypów albo granicy debugowej
- ustaw poziom logowania przez konfigurację
- nie loguj sekretów ani pełnych payloadów
- dodawaj annotations dla request id, job id, tenant id, user id, endpointu i operation name
- używaj spans dla operacji, które mają znaczenie diagnostyczne: API call, query, job step, import, export, retry
- nie twórz spanów dla każdej małej funkcji bez potrzeby
- metryki dodawaj dla requestów, błędów, retry, timeoutów, queue depth, latency, cache hit/miss i workerów
- nie licz metryk ręcznie w wielu miejscach, jeśli da się opakować klienta albo service
- loguj błędy raz na granicy operacji, z contextem i cause
- w środowisku produkcyjnym używaj formatu logów zgodnego z systemem obserwowalności
- nie dopisuj ręcznie timestampów, jeśli logger już je dodaje

Przykład:

```ts
import { Effect } from "effect"

const program = saveOrder(order).pipe(
  Effect.annotateLogs({ orderId: order.id }),
  Effect.withLogSpan("saveOrder"),
  Effect.tapError((error) => Effect.logError("save order failed", error))
)
```
