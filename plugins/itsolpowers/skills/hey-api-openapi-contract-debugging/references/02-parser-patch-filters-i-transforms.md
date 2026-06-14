# hey-api-openapi-contract-debugging Reference Sector: Parser, patch, filters i transforms

## Zawartość

- Parser, patch, filters i transforms
- Plugin TypeScript
- Plugin SDK
- Klient Fetch
- Auth i sesja

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
## Klient Fetch

- `@hey-api/client-fetch` jest dobrym domyślnym klientem dla aplikacji przeglądarkowych i SvelteKit
- konfiguruj `baseUrl` centralnie
- preferuj `runtimeConfigPath`, jeśli klient ma być skonfigurowany przed pierwszym importem
- `client.setConfig()` jest prosty, ale może prowadzić do wywołań przed konfiguracją
- osobne instancje klienta twórz dla różnych domen, tenantów albo trybów auth
- nie nadpisuj globalnego klienta w losowych komponentach
- nie ustawiaj `baseUrl` per request, jeśli to nie jest świadoma część modelu aplikacji
- custom `fetch` stosuj do integracji z SvelteKit `fetch`, testami, retry, tracingiem albo adapterem runtime
- interceptory trzymaj w jednym miejscu
- interceptor musi być idempotentny, jeśli może zostać zarejestrowany wielokrotnie w HMR
- jeśli interceptor jest rejestrowany dynamicznie, zapisz ID i usuwaj go przez `eject`
- nie dodawaj `Authorization` interceptorami do wszystkich requestów, jeśli część endpointów tego nie wymaga
- jeśli korzystasz z wbudowanego `auth` w SDK, nie duplikuj tego samego zachowania w interceptorze
- token w `auth` pobieraj z aktualnego źródła, nie zamrażaj go przy starcie aplikacji, jeśli może się odświeżać
- funkcja auth nie powinna logować tokena
- obsługę 401/403 trzymaj centralnie
- nie rób nieograniczonego retry po 401
- refresh token flow musi mieć ochronę przed równoległym odświeżaniem tokena przez wiele requestów

Przykład runtime config:

```ts
// openapi-ts.config.ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi/openapi.json',
  output: 'src/lib/api/generated',
  plugins: [
    {
      name: '@hey-api/client-fetch',
      runtimeConfigPath: './src/lib/api/hey-api-runtime.ts',
    },
    '@hey-api/typescript',
    '@hey-api/sdk',
  ],
});
```

```ts
// src/lib/api/hey-api-runtime.ts
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import type { CreateClientConfig } from './generated/client.gen';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: PUBLIC_API_BASE_URL,
});
```
## Auth i sesja

- frontendowy klient API nie jest mechanizmem bezpieczeństwa
- autoryzacja musi być egzekwowana na backendzie dla każdego obiektu i każdej operacji
- OpenAPI `securitySchemes` opisuje wymagania, ale ich nie wymusza
- nie zapisuj sekretów serwerowych w publicznym frontendzie
- zmienne `PUBLIC_*` w SvelteKit są publiczne i trafiają do bundle
- bearer token w przeglądarce traktuj jako dane wrażliwe
- nie zapisuj access tokenów w `localStorage`, jeśli projekt ma wysoki poziom ryzyka XSS
- przy cookie-based auth ustawiaj `HttpOnly`, `Secure`, `SameSite` po stronie serwera
- przy cookie-based auth zaprojektuj ochronę CSRF
- przy token-based auth zaprojektuj wygasanie, refresh, logout i reakcję na 401
- nie wysyłaj refresh tokena do endpointów, które go nie potrzebują
- nie dopisuj tokenów do URL query params
- nie loguj nagłówków `Authorization`, cookies, refresh tokenów ani pełnych response headers
- przy multi-tenant API tenant id nie może być jedynym mechanizmem autoryzacji
- jeśli użytkownik może zmienić ID w URL, backend musi sprawdzić uprawnienia do obiektu
