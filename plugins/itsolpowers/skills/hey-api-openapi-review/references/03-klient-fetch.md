# hey-api-openapi-review Reference Sector: Klient Fetch

## Zawartość

- Klient Fetch
- Auth i sesja
- Komunikacja z API
- Runtime validation i Zod
- TanStack Query plugin

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
## Komunikacja z API

- wszystkie requesty do endpointów objętych OpenAPI powinny przechodzić przez generated SDK albo wspólny wrapper
- ręczny `fetch` dopuszczaj tylko dla endpointów spoza specyfikacji, prototypów albo niskopoziomowych przypadków
- każdy request powinien mieć jasny model błędu dla UI
- nie mapuj wszystkich błędów API do jednego tekstu
- rozróżniaj błędy walidacji, auth, permission, not found, conflict, rate limit i błąd serwera
- UI nie powinien zależeć od raw error response, jeśli backend nie gwarantuje jego stabilności
- dodawaj request id albo correlation id, jeśli backend wspiera diagnostykę
- dla mutacji, które mogą zostać powtórzone, używaj idempotency key
- nie wysyłaj pustych query params, jeśli backend rozróżnia brak parametru i pustą wartość
- nie wysyłaj `undefined` w body JSON
- nie wysyłaj `null`, jeśli backend oczekuje braku pola
- dla dużych list używaj paginacji
- dla search/filter unikaj requestów na każde naciśnięcie klawisza bez debounce i cancellation
- requesty z komponentów powinny być anulowane, jeśli komponent znika albo parametr się zmienia
- w SvelteKit `load` używaj `fetch` z kontekstu load, jeśli request ma korzystać z cookies, SSR i zależności frameworka
## Runtime validation i Zod

- TypeScript sprawdza kod w czasie kompilacji, ale nie waliduje odpowiedzi z backendu w runtime
- używaj pluginu `zod`, jeśli potrzebujesz walidować requesty, response albo reusable definitions
- włącz `validator` w SDK dla endpointów, gdzie błędny payload może uszkodzić UI albo dane lokalne
- włącz `transformer`, jeśli chcesz zamieniać odpowiedź do oczekiwanego kształtu przez wygenerowane schematy
- nie waliduj każdej odpowiedzi bez pomiaru, jeśli API zwraca duże payloady
- walidacja runtime jest szczególnie przydatna przy integracji z zewnętrznym API, niestabilnym backendem albo migracji kontraktu
- błędy walidacji loguj z correlation id, ale bez pełnych danych użytkownika
- przy datach ustal, czy akceptowane są offsety i lokalne wartości bez strefy
- jeśli backend wysyła lokalny czas bez timezone, nie parsuj go automatycznie jako UTC
- metadata schematów może pomóc przy formularzach i dokumentacji, ale może zwiększyć output

Przykład Zod z SDK validator:

```ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi/openapi.json',
  output: 'src/lib/api/generated',
  plugins: [
    '@hey-api/client-fetch',
    '@hey-api/typescript',
    'zod',
    {
      name: '@hey-api/sdk',
      validator: true,
    },
  ],
});
```

Przykład konfiguracji dat dla Zod:

```ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi/openapi.json',
  output: 'src/lib/api/generated',
  plugins: [
    {
      name: 'zod',
      dates: {
        offset: true,
      },
    },
  ],
});
```
## TanStack Query plugin

- plugin `@tanstack/svelte-query` generuje query options, mutation options i query keys dla TanStack Query
- używaj wygenerowanych query keys zamiast ręcznie składanych tablic
- nie duplikuj query key factory w aplikacji, jeśli generator może ją utworzyć
- query keys powinny zawierać wszystkie parametry wpływające na wynik
- jeśli aplikacja używa wielu `baseUrl`, upewnij się, że query key rozróżnia te źródła
- `queryKeys.tags` może ułatwić invalidację po tagach, ale powiększa klucze
- invalidację po mutacji opieraj na wygenerowanych key functions albo tags
- nie invaliduj całego cache po każdej mutacji, jeśli można invalidować konkretny zakres
- query options z generatora traktuj jako bazę, a lokalne opcje UI dodawaj przy użyciu spread
- nie nadpisuj `queryFn` bez powodu, bo tracisz spójność z wygenerowanym SDK
- paginację i infinite queries projektuj w OpenAPI tak, żeby parametry strony były jednoznaczne
- przy optimistic updates używaj typów generated responses, ale aktualizuj cache zgodnie z modelem UI
- po zmianie specyfikacji uruchom typecheck, bo błędy w query options często pokażą miejsca wymagające migracji

Przykład konfiguracji dla Svelte Query:

```ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi/openapi.json',
  output: 'src/lib/api/generated',
  plugins: [
    '@hey-api/client-fetch',
    '@hey-api/typescript',
    '@hey-api/sdk',
    {
      name: '@tanstack/svelte-query',
      queryKeys: {
        tags: true,
      },
    },
  ],
});
```
