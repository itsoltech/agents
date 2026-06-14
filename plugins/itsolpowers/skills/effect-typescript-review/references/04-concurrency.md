# effect-typescript-review Reference Sector: Concurrency

## Zawartość

- Concurrency
- Fibers i lifecycle
- Queue, PubSub i backpressure
- Cache i batching
- Stream i Sink
- Observability
- Bezpieczeństwo
- Frontend i Svelte/SvelteKit
- Backend, CLI i workery

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
## Bezpieczeństwo

- traktuj dane z API, formularzy, storage, URL, websocketów i message event jako niezaufane
- waliduj dane runtime przez Schema albo inną ustaloną bibliotekę walidacyjną
- nie wysyłaj sekretów do przeglądarki
- nie zapisuj tokenów długiego życia w localStorage, jeśli projekt może użyć bezpieczniejszego mechanizmu sesji
- nie loguj tokenów, cookies, API keys, danych kart, haseł, connection stringów i pełnych nagłówków auth
- używaj `Redacted` dla wartości wrażliwych w kodzie Effect
- nie wyciągaj `Redacted.value` w miejscu, które może trafić do logów
- nie pokazuj użytkownikowi surowych błędów infrastruktury
- mapuj błędy na bezpieczne komunikaty UI/API
- autoryzacja musi być egzekwowana po stronie backendu
- frontend może ukrywać elementy UI, ale nie może być źródłem prawdy dla uprawnień
- retry operacji mutujących musi uwzględniać idempotencję
- timeouty i limity concurrency chronią też stabilność systemu
- nie uruchamiaj kodu Effect z niezaufanego źródła
- jeśli tworzysz integrację z workerem, iframe albo `postMessage`, waliduj origin i payload
- jeśli efekt wykonuje command albo dostęp do filesystemu, oddziel dane użytkownika od argumentów systemowych i waliduj ścieżki
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
