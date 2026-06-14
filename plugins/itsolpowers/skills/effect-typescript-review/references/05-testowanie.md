# effect-typescript-review Reference Sector: Testowanie

## Zawartość

- Testowanie
- Wydajność
- Organizacja projektu
- Czytelność i styl
- Integracja z bibliotekami Promise
- Integracja z bazą danych
- Antywzorce

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
## Organizacja projektu

Preferuj podział po funkcjonalnościach i granicach odpowiedzialności. Nie twórz jednego folderu `effect/` na cały projekt, jeśli przez to każdy feature importuje wszystko.

Przykład:

```txt
src/
  app/
    config/
      ConfigService.ts
    layers/
      AppLive.ts
      AppTest.ts
    runtime/
      main.ts
  shared/
    effect/
      errors.ts
      apiClient.ts
      schema.ts
    security/
      redacted.ts
  features/
    orders/
      model/
        Order.ts
        OrderErrors.ts
        OrderSchema.ts
      api/
        OrdersClient.ts
      services/
        OrdersRepository.ts
        OrdersService.ts
      program/
        submitOrder.ts
      tests/
        submitOrder.test.ts
```

Zasady:

- kod domenowy trzymaj blisko feature'a
- błędy feature'a trzymaj blisko logiki feature'a
- schema response/request trzymaj blisko API clienta albo modelu
- live implementacje zależności trzymaj w `layers`, `infra` albo `adapters`
- test implementations trzymaj przy testach albo w `testing`
- nie importuj warstwy live z domeny
- nie importuj UI z warstwy Effect
- nie importuj backend-only zależności do kodu frontendowego
- plik z programem biznesowym powinien głównie składać efekty, nie definiować wszystkie adaptery
- unikaj plików `utils.ts` z losowymi helperami Effect
- jeśli helper jest wspólny, jego nazwa powinna mówić, jaki problem rozwiązuje
## Czytelność i styl

- nazwy efektów powinny opisywać operację, np. `loadUser`, `submitOrder`, `decodeInvoice`, `withTransaction`
- nie nazywaj wszystkiego `program`, poza lokalnymi przykładami albo entrypointem
- nie używaj skrótów typu `eff`, `fx`, `svc`, jeśli projekt nie ma takiej konwencji
- nie twórz efektów o bardzo szerokim typie błędu, jeśli funkcja ma mały zakres odpowiedzialności
- nie ukrywaj zależności w closure, jeśli powinna być service
- nie ukrywaj requestu HTTP za nazwą funkcji wyglądającą jak czysty getter
- komentarze powinny opisywać powód decyzji, a nie przepisywać operator Effect
- jeśli pipeline wymaga komentarza przy każdym kroku, rozważ `Effect.gen` albo rozbicie funkcji
- jeśli `Effect.gen` ma ponad 80-100 linii, sprawdź, czy nie miesza kilku przypadków użycia
- jeśli typ błędu ma bardzo dużo wariantów, sprawdź, czy warstwa nie robi zbyt wiele
- nie pisz generycznych helperów Effect przed wystąpieniem realnej duplikacji
- unikaj operatorów punktowo-funkcyjnych dla osób spoza zespołu, jeśli prostszy kod jest wystarczający
## Integracja z bibliotekami Promise

- owijaj Promise API przez `Effect.tryPromise` albo `Effect.promise`
- jeśli biblioteka wspiera cancellation przez `AbortSignal`, przekazuj signal
- jeśli biblioteka używa własnego cancel token, zmapuj interruption Effect na cancel token przez `Effect.async` albo scoped resource
- nie mieszaj `.then/.catch` z `Effect` w środku domeny
- nie konwertuj `Effect` do Promise i z powrotem bez powodu
- na granicy z biblioteką UI dopuszczalne jest `runPromise`
- na granicy z biblioteką backendową dopuszczalne jest adapterowanie handlera Promise do Effect albo odwrotnie
- jeśli biblioteka rzuca wyjątki synchroniczne mimo że zwraca Promise, sprawdź, czy wrapper je łapie
- jeśli Promise może wisieć bez końca, dodaj timeout
## Integracja z bazą danych

- repository może być service zwracającym `Effect`
- błędy bazy mapuj na błędy infrastrukturalne albo domenowe
- nie przepuszczaj surowych błędów drivera DB do UI/API
- pool DB powinien być zależnością aplikacyjną w Layer
- transakcja DB powinna mieć scope i finalizer
- nie trzymaj transakcji przez zewnętrzny request HTTP
- constraints z bazy mapuj na konkretne błędy, np. duplicate, foreign key, not found
- unikaj N+1 queries przez batching albo jedno zapytanie
- dodawaj timeouty na query albo na flow biznesowy
- nie retryuj konfliktów transakcji bez limitu
- nie retryuj operacji, które mogą podwójnie wykonać efekt uboczny
## Antywzorce

- `Effect.runPromise` w środku funkcji domenowej
- `Effect.runFork` bez `join`, `interrupt`, scope albo supervisora
- `Effect.tryPromise(() => alreadyStartedPromise)`
- `Effect.promise` dla Promise, który może rejectować
- błędy jako stringi w publicznym API modułu
- jeden `UnknownError` dla wszystkich przypadków
- `catchAll(() => Effect.succeed(defaultValue))` bez uzasadnienia biznesowego
- `concurrency: "unbounded"` na danych od użytkownika
- live layer importowany przez kod domenowy
- service dla każdej małej funkcji
- `process.env` czytany w wielu plikach
- sekrety w bundle frontendowym
- `console.log` rozsiane po efektach produkcyjnych
- `Schema.decodeUnknownSync` w async flow, gdzie błąd powinien być w kanale Effect
- globalny mutable state poza `Ref`, service albo kontrolowanym modulem
- cache bez limitu
- retry bez limitu
- timeout bez mapowania błędu
- stream bez cleanup
- websocket/subscription bez finalizera
