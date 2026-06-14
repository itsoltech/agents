# effect-typescript-implementation Reference Sector: Overview

## Zawartość

- Overview
- Cel dokumentu
- Założenia techniczne
- Instalacja i konfiguracja
- Importy i styl modułów
- Mental model Effect
- Granice uruchamiania Effect
- Tworzenie efektów


## Cel dokumentu

Ten dokument służy jako checklist do code review dla projektów TypeScript korzystających z Effect. Obejmuje model `Effect<Success, Error, Requirements>`, tworzenie i uruchamianie efektów, obsługę błędów, dependency injection przez services i layers, walidację przez Schema, retry, timeouty, concurrency, resource management, observability, komunikację z API, bezpieczeństwo, testy, CI i organizację kodu.

Dokument zakłada aktualny pakiet `effect` i nowy styl API z oficjalnej dokumentacji Effect. Nie opisuje starszych pakietów typu `@effect/io`, `@effect/data` albo historycznych wariantów API.

Checklist nie zastępuje pomiarów, testów i decyzji architektonicznych. Effect zwiększa kontrolę nad błędami, zależnościami, współbieżnością i zasobami, ale może też utrudnić kod, jeśli jest używany bez granic i konsekwentnych konwencji.
## Założenia techniczne

- projekt używa TypeScript
- `strict` w TypeScript jest włączony
- kod korzysta z pakietu `effect`
- w aplikacjach Node można używać `@effect/platform-node`
- walidacja runtime korzysta z `effect/Schema`, importowanego jako `Schema` z pakietu `effect`
- błędy domenowe są modelowane jako typy, najczęściej przez `Data.TaggedError`
- zależności aplikacji są modelowane przez `Effect.Service`, `Context.Tag` i `Layer`
- kod frontendowy uruchamia Effect na granicy UI, np. event handler, `load`, akcja formularza, store, adapter API
- kod backendowy uruchamia Effect na granicy procesu, request handlera, workera, joba albo CLI
## Instalacja i konfiguracja

- instaluj aktualny pakiet `effect`
- nie mieszaj w jednym projekcie starego API `@effect/io` z nowym importem z `effect`
- włącz `strict: true` w `tsconfig.json`
- dla intensywnego użycia Schema włącz `exactOptionalPropertyTypes: true`
- nie wyciszaj błędów TypeScript przez `skipLibCheck`, jeśli projekt ma problem z typami własnego kodu
- pinuj wersje pakietów w lockfile
- po aktualizacji Effect uruchamiaj pełny typecheck, testy i lint
- przy większych projektach rozważ Effect LSP / `tsgo`, jeśli zespół aktywnie pracuje z Effect i potrzebuje lepszego feedbacku z typów

Przykład instalacji:

```bash
pnpm add effect
```

Przykładowy fragment `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "useUnknownInCatchVariables": true
  }
}
```
## Importy i styl modułów

- importuj moduły z pakietu `effect`, np. `import { Effect, Data, Schema, Layer } from "effect"`
- nie używaj namespace aliasów bez powodu, jeśli utrudniają czytanie typów
- nie importuj wszystkiego jako jeden globalny obiekt, jeśli plik używa tylko 2-3 modułów
- trzymaj importy Effect oddzielnie od importów domenowych i frameworkowych
- nie mieszaj w jednym pliku wielu stylów kompozycji, jeśli pogarsza to czytelność
- używaj `pipe` tam, gdzie pipeline jest krótszy i liniowy
- używaj `.pipe(...)` tam, gdzie poprawia lokalność kodu i jest zgodne ze stylem projektu
- używaj `Effect.gen` dla flow z wieloma krokami, warunkami, zależnościami i obsługą błędów
- nie twórz lokalnych wrapperów na każdy operator Effect bez realnego powodu
## Mental model Effect

- traktuj `Effect<A, E, R>` jako opis programu, a nie jako uruchomioną operację
- `A` oznacza typ sukcesu
- `E` oznacza typ oczekiwanego błędu
- `R` oznacza wymagane zależności z kontekstu
- `Effect` powinien być składany w środku aplikacji i uruchamiany dopiero na granicy systemu
- nie mieszaj `Promise` i `Effect` w środku domeny bez powodu
- nie ukrywaj efektów ubocznych w zwykłych funkcjach zwracających `A`
- funkcja wykonująca I/O, czas, losowość, logowanie, dostęp do konfiguracji albo zależność zewnętrzną powinna zwracać `Effect`
- czyste funkcje domenowe mogą pozostać zwykłymi funkcjami TypeScript
- nie zamieniaj całego kodu na Effect, jeśli część jest prostą transformacją danych
- typ `Effect<A, never, never>` oznacza efekt bez oczekiwanego błędu i bez wymagań, ale nadal może zawierać obliczenie efektowe
- typ `Effect<A, E, never>` nadaje się na gotową operację bez dependency injection
- typ `Effect<A, E, R>` powinien zostać zamknięty przez `Layer`, `provide`, `provideService` albo runtime przed uruchomieniem
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
## Tworzenie efektów

- używaj `Effect.succeed` dla wartości już gotowej
- używaj `Effect.sync` dla synchronicznej operacji, która może mieć efekt uboczny, ale nie powinna rzucać
- używaj `Effect.try` dla synchronicznej operacji, która może rzucić wyjątek
- używaj `Effect.promise` tylko dla Promise, który zgodnie z kontraktem nie powinien zostać odrzucony
- używaj `Effect.tryPromise` dla Promise, który może zostać odrzucony
- w `Effect.tryPromise` podawaj `catch`, żeby nie przepuszczać `UnknownException` głębiej w domenę
- przekazuj `AbortSignal` do API, które wspiera przerwanie, np. `fetch`
- nie twórz Promise przed wejściem do `Effect.tryPromise`; Promise powinien powstać leniwie w funkcji `try`
- nie opakowuj zwykłej wartości przez `Effect.sync`, jeśli `Effect.succeed` wystarczy
- nie opakowuj błędów domenowych w `throw`; używaj `Effect.fail`
- nie używaj `Effect.die` do obsługi normalnych błędów użytkownika, API, walidacji albo bazy
- jeśli callback API może wywołać callback wiele razy, używaj `Effect.async` ostrożnie i opisz kontrakt
- przy `Effect.async` obsłuż cleanup i interruption, jeśli API wspiera anulowanie
- jeśli operacja alokuje zasób, użyj `Effect.acquireRelease`, `Effect.scoped` albo `Layer.scoped`

Przykład `tryPromise`:

```ts
import { Data, Effect } from "effect"

class NetworkError extends Data.TaggedError("NetworkError")<{
  readonly cause: unknown
}>() {}

export const fetchText = (url: string) =>
  Effect.tryPromise({
    try: (signal) => fetch(url, { signal }).then((response) => response.text()),
    catch: (cause) => new NetworkError({ cause })
  })
```
