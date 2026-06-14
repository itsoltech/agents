# hey-api-openapi-codegen Reference Sector: Output i wygenerowane pliki

## Zawartość

- Output i wygenerowane pliki
- OpenAPI jako kontrakt
- Jakość schematów danych
- Parser, patch, filters i transforms
- Plugin TypeScript
- Plugin SDK

## Output i wygenerowane pliki

- traktuj output jako dependency, nie jako kod aplikacyjny
- nie edytuj wygenerowanych plików ręcznie
- nie dopisuj wrapperów do katalogu output
- zostaw suffix `.gen`, jeśli pomaga zespołowi rozpoznawać wygenerowany kod
- nie wyłączaj nagłówka informującego, że plik jest generowany, jeśli w projekcie często dochodzi do ręcznych edycji outputu
- `source: true` pomaga utrzymać snapshot specyfikacji użytej do generacji
- nie commituj snapshotu specyfikacji do publicznego repo, jeśli ujawnia prywatne endpointy, przykłady danych albo nazwy systemów wewnętrznych
- używaj `postProcess` do formatowania albo lintowania wygenerowanego kodu
- nie wymuszaj ręcznego formatowania wygenerowanych plików poza procesem generacji
- jeśli generated output jest bardzo duży, rozważ wyłączenie lintowania stylistycznego dla tego katalogu, ale zostaw typecheck
- ustaw `tsConfigPath`, jeśli generator nie wykrywa właściwego tsconfig w monorepo
- nie ustawiaj `clean: false`, jeśli nie masz testu wykrywającego stare wygenerowane pliki

Przykład outputu z formatowaniem:

```ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi/openapi.json',
  output: {
    path: 'src/lib/api/generated',
    postProcess: ['prettier'],
    source: {
      fileName: 'openapi',
      path: './source',
    },
  },
});
```
## OpenAPI jako kontrakt

- `operationId` musi być stabilny, unikalny i czytelny
- zmiana `operationId` jest zmianą łamiącą dla wygenerowanego klienta
- każdy endpoint powinien mieć jawne response schemas dla sukcesu i błędów
- nie ograniczaj dokumentacji response tylko do `200`
- modeluj `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`, jeśli frontend ma je rozróżniać
- używaj spójnego error envelope dla API
- nie zwracaj innego kształtu błędu dla każdego endpointu bez powodu
- jawnie opisuj `required`, `nullable`, enumy, formaty dat i content types
- unikaj `additionalProperties: true` bez uzasadnienia
- unikaj pól typu `object` bez schematu, jeśli frontend ma na nich polegać
- rozróżniaj brak pola, `null` i pustą wartość
- opisuj `204 No Content` jako brak body
- opisuj paginację, sortowanie i filtry jako jawne parametry
- jeśli endpoint przyjmuje pliki, jawnie modeluj `multipart/form-data`
- jeśli endpoint zwraca pliki, jawnie modeluj content type i binary response
- jeśli endpoint wymaga idempotency key, dodaj header do specyfikacji
- jeśli endpoint wymaga tenant id, locale albo request id, dodaj je do specyfikacji
- security schemes muszą być w OpenAPI, ale realna autoryzacja musi być po stronie serwera
- tagi powinny opisywać domenę lub moduł, a nie przypadkowe grupy techniczne
- endpointy deprecated oznaczaj jako deprecated w specyfikacji
- nie usuwaj starego endpointu ze specyfikacji przed usunięciem jego użyć we frontendzie
## Jakość schematów danych

- nazwy komponentów powinny być stabilne
- wspólne typy wynoś do `components.schemas`
- enumy, które mają być importowane w frontendzie, trzymaj jako reusable components
- inline enumy utrudniają ponowne użycie w UI
- daty i czas opisuj konsekwentnie, np. `format: date-time`
- ustal, czy API zwraca offset czasowy, UTC, czy lokalny czas bez strefy
- kwoty, waluty, jednostki i identyfikatory modeluj jako konkretne typy domenowe w specyfikacji
- nie używaj `number` dla pieniędzy, jeśli backend wymaga precyzji decimal i frontend nie powinien wykonywać obliczeń floatami
- jeśli backend zwraca decimal jako string, opisz to w OpenAPI
- nie używaj jednego modelu `User` do wszystkich kontekstów, jeśli endpointy zwracają różne zakresy pól
- osobne DTO request/response są często lepsze niż jeden wspólny model
- nie ujawniaj w publicznej specyfikacji pól administracyjnych, których frontend nie ma używać
- przykłady w OpenAPI nie mogą zawierać sekretów, tokenów, prawdziwych danych osobowych ani wewnętrznych URL
## Parser, patch, filters i transforms

- `parser.patch` traktuj jako tymczasową naprawę błędnej specyfikacji, nie jako stałe miejsce na logikę kontraktu
- każdy patch powinien mieć komentarz z powodem i linkiem do issue albo decyzji technicznej
- patch powinien być deterministyczny
- nie ukrywaj przez patch problemów, które powinny zostać naprawione w backendzie
- `validate_EXPERIMENTAL` może zatrzymać generację przy błędach, ale nie zastępuje pełnego lintowania OpenAPI
- do pełnej walidacji specyfikacji używaj osobnego narzędzia w CI
- filters stosuj, gdy frontend potrzebuje tylko części dużej specyfikacji
- nie filtruj endpointów tylko po to, żeby ukryć nieporządek w kontrakcie
- przy `include` i `exclude` pamiętaj, że `exclude` ma pierwszeństwo
- filtr deprecated może pomóc odcinać stare API, ale nie włączaj go przed usunięciem użyć w aplikacji
- jeśli kolejność outputu ma znaczenie dla review, rozważ `preserveOrder`
- `transforms.enums` stosuj, gdy chcesz mieć importowalne enumy zamiast inline enumów
- `propertiesRequiredByDefault` zmieniaj tylko wtedy, gdy specyfikacja backendu realnie używa takiej konwencji
- nie naprawiaj masowo optional/required w generatorze bez rozmowy z właścicielem API

Przykład patcha z komentarzem:

```ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi/openapi.json',
  output: 'src/lib/api/generated',
  parser: {
    patch: {
      schemas: {
        LegacyUser: (schema) => {
          // TODO(API-1234): backend powinien oznaczyć `metadata` jako obiekt.
          // Patch zostaje do czasu wydania poprawionej specyfikacji.
          schema.properties.metadata = {
            additionalProperties: true,
            type: 'object',
          };
        },
      },
    },
  },
});
```
## Plugin TypeScript

- generuj typy przez `@hey-api/typescript`
- typy z `types.gen.ts` nie powinny wpływać na bundle, jeśli są używane jako type-only imports
- używaj `import type` dla typów z generated output
- nie twórz ręcznych duplikatów typów API, jeśli generated type jest poprawny
- twórz typy domenowe osobno, jeśli model UI różni się od DTO API
- nie przekazuj DTO API głęboko przez całą aplikację, jeśli aplikacja potrzebuje stabilnego modelu domenowego
- runtime enumy generuj tylko wtedy, gdy UI potrzebuje iterować po wartościach
- preferuj obiekty JavaScript dla runtime enumów, jeśli chcesz uniknąć problemów klasycznych TypeScript enumów
- komentarze w generated code zostaw włączone, jeśli pomagają w IDE
- wyłącz komentarze tylko wtedy, gdy generated output jest zbyt duży albo komentarze są niskiej jakości

Przykład pluginu TypeScript:

```ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi/openapi.json',
  output: 'src/lib/api/generated',
  plugins: [
    {
      name: '@hey-api/typescript',
      comments: true,
      enums: false,
    },
  ],
});
```
## Plugin SDK

- SDK generuje wysokopoziomowe funkcje lub klasy nad klientem HTTP
- preferuj strategię `flat` dla aplikacji frontendowych, bo lepiej wspiera tree-shaking
- strategię `single` z klasą wybieraj tylko wtedy, gdy składnia instancji jest ważniejsza niż rozmiar bundle
- nie twórz ręcznych funkcji API, jeśli SDK generuje już poprawną funkcję
- ręczny wrapper powinien dodawać zachowanie aplikacyjne, np. mapowanie błędów, telemetry, retry policy, nie kopiować SDK
- nie mieszaj kilku stylów wywołań API w jednym module
- generowane funkcje SDK powinny być używane zamiast ręcznego `fetch` do endpointów objętych specyfikacją
- jeśli endpoint nie jest w specyfikacji, najpierw zaktualizuj OpenAPI, a dopiero potem generuj klienta
- nie ukrywaj wywołań mutujących pod nazwami wyglądającymi jak query
- `validator` albo `transformer` w SDK włączaj świadomie, bo runtime validation ma koszt
- waliduj runtime odpowiedzi z zewnętrznych albo niestabilnych API
- nie waliduj ogromnych payloadów w hot path bez pomiaru

Przykład SDK flat:

```ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi/openapi.json',
  output: 'src/lib/api/generated',
  plugins: [
    '@hey-api/client-fetch',
    '@hey-api/typescript',
    {
      name: '@hey-api/sdk',
      operations: {
        strategy: 'flat',
      },
    },
  ],
});
```
