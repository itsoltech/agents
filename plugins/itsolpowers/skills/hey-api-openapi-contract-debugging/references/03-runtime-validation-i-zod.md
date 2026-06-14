# hey-api-openapi-contract-debugging Reference Sector: Runtime validation i Zod

## Zawartość

- Runtime validation i Zod
- TanStack Query plugin
- Svelte i SvelteKit
- Vite plugin
- Multi API, monorepo i wiele outputów

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
## Svelte i SvelteKit

- trzymaj generated output w `src/lib/api/generated`
- konfigurację runtime trzymaj poza katalogiem generated
- publiczny `baseUrl` pobieraj z `$env/static/public` albo `$env/dynamic/public`
- prywatne sekrety pobieraj tylko po stronie server, np. w `+server.ts`, `+page.server.ts`, `hooks.server.ts`
- nie importuj `$env/static/private` do kodu, który może trafić do klienta
- w `load` po stronie SvelteKit korzystaj z frameworkowego `fetch`, jeśli request ma używać cookies SSR
- dla server-only API wrapperów trzymaj pliki z sufiksem `.server.ts`
- dla browser-only kodu nie importuj modułów server-only
- nie konfiguruj globalnego klienta w komponencie Svelte
- konfiguracja klienta powinna odbywać się na starcie aplikacji, w runtime config albo w wrapperze
- jeśli SSR i browser mają różny sposób auth, rozdziel klient server i client
- nie przenoś tokenów server-side do browser przez `load`, jeśli nie muszą być publiczne
- jeśli korzystasz z TanStack Query w SvelteKit, ustal zasady prefetch, hydration i invalidation
- nie wykonuj tego samego requestu równolegle w `load` i w komponencie bez uzasadnienia

Przykład wrappera dla requestów server-side:

```ts
// src/lib/api/server-api.server.ts
import { PRIVATE_API_BASE_URL, PRIVATE_API_TOKEN } from '$env/static/private';
import { createClient } from './generated/client/client';

export const serverApiClient = createClient({
  auth: () => PRIVATE_API_TOKEN,
  baseUrl: PRIVATE_API_BASE_URL,
});
```
## Vite plugin

- `@hey-api/vite-plugin` może uruchamiać generację podczas resolve konfiguracji Vite
- Vite plugin jest wygodny w development flow, ale nie zastępuje jawnego CI checka
- nie ukrywaj generacji wyłącznie w Vite buildzie, jeśli zespół reviewuje generated diff
- w CI nadal uruchamiaj jawny skrypt `openapi:check`
- jeśli specyfikacja jest remote, awaria źródła może psuć build; to powinno być świadome zachowanie
- przy monorepo sprawdź, czy plugin czyta właściwy config
- unikaj generacji w watch, która stale modyfikuje pliki obserwowane przez Vite i wywołuje pętle rebuildów

Przykład:

```ts
import { heyApiPlugin } from '@hey-api/vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [heyApiPlugin()],
});
```
## Multi API, monorepo i wiele outputów

- dla wielu API używaj wielu jobów albo job matrix
- osobne API powinny zwykle mieć osobne katalogi output
- merge kilku inputów do jednego outputu stosuj tylko wtedy, gdy nazwy operacji i schemas są kontrolowane
- przy merge inputów wymuszaj unikalne `operationId`
- konflikty nazw w generated code traktuj jako problem kontraktu, nie tylko problem generatora
- jeśli generator dodaje suffix numeryczny do konfliktu, rozwiąż przyczynę w specyfikacji
- w monorepo trzymaj generated client blisko aplikacji, która go używa, albo publikuj go jako osobny pakiet
- jeśli client jest osobnym pakietem, wersjonuj go zgodnie z wersją API
- nie pozwalaj kilku aplikacjom modyfikować tego samego katalogu generated output
- jeśli API jest współdzielone, przygotuj osobny package, np. `@company/api-client`

Przykład wielu jobów:

```ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig([
  {
    input: './openapi/billing.json',
    output: 'src/lib/api/billing/generated',
    plugins: ['@hey-api/client-fetch', '@hey-api/typescript', '@hey-api/sdk'],
  },
  {
    input: './openapi/identity.json',
    output: 'src/lib/api/identity/generated',
    plugins: ['@hey-api/client-fetch', '@hey-api/typescript', '@hey-api/sdk'],
  },
]);
```
