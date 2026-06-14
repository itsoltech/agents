# effect-typescript-implementation Reference Sector: Observability

## Zawartość

- Observability
- Bezpieczeństwo
- Frontend i Svelte/SvelteKit
- Backend, CLI i workery
- Testowanie
- Wydajność

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
