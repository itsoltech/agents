# tanstack-query-svelte-implementation Reference Sector: Overview

## Zawartość

- Overview
- Cel dokumentu
- Kiedy używać TanStack Query
- Instalacja
- Minimalna konfiguracja klienta
- Konfiguracja dla SvelteKit SSR


## Cel dokumentu

Ten dokument opisuje dobre praktyki korzystania z TanStack Query w aplikacjach Svelte i SvelteKit, z uwzględnieniem repo na `@tanstack/svelte-query` v5 oraz v6. Obejmuje konfigurację klienta, query keys, `createQuery`, `createMutation`, Svelte reactivity, SSR, komunikację z API, bezpieczeństwo, cache, invalidacje, paginację, optimistic updates, testy i code review.

Przed użyciem przykładów ustal wersję z `package.json` i lockfile. Dla v5 trzymaj się wzorca repo. Dla v6 używaj runes-style API, odczytu bez `$query` oraz składni `createQuery(() => ({ ... }))`. Szczegóły wyboru wersji i migracji są w `10-version-policy-and-v6-migration.md`.
## Kiedy używać TanStack Query

TanStack Query powinien obsługiwać dane serwerowe: dane pobierane z API, cache, refetch, retry, invalidację, synchronizację po mutacjach i obsługę stanu requestów.

Nie używaj TanStack Query jako zamiennika dla całego state managementu aplikacji.

TanStack Query pasuje do:

- danych pobieranych z REST, GraphQL, RPC, SvelteKit endpoints albo zewnętrznego API
- danych współdzielonych przez wiele komponentów
- list, szczegółów, słowników, ustawień użytkownika i danych sesji czytanych z backendu
- requestów wymagających cache, retry, prefetch, invalidacji albo deduplikacji
- mutacji tworzących, zmieniających albo usuwających dane na serwerze

TanStack Query nie powinien obsługiwać:

- lokalnego stanu formularza przed wysłaniem
- stanu UI typu otwarty modal, aktywny tab, hover, lokalny filtr bez API
- danych tymczasowych zależnych tylko od komponentu
- bardzo częstego strumienia danych, jeśli prostszy store albo WebSocket handler lepiej pasuje do problemu
- sekretów, tokenów i danych, które nie powinny trafić do cache po stronie przeglądarki
## Instalacja

```bash
pnpm add @tanstack/svelte-query
```

Dla nowego projektu bez ograniczeń używaj aktualnej wersji `@tanstack/svelte-query` v6. Dla istniejącego repo nie podbijaj automatycznie v5 do v6 bez planu migracji i akceptacji użytkownika.

Devtools instaluj osobno:

```bash
pnpm add -D @tanstack/svelte-query-devtools
```

W aplikacjach produkcyjnych devtools powinny być ładowane tylko w trybie developerskim.

```svelte
<script lang="ts">
  import { dev } from '$app/environment'
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'

  let { children } = $props()

  const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
  {@render children()}

  {#if dev}
    <SvelteQueryDevtools />
  {/if}
</QueryClientProvider>
```
## Minimalna konfiguracja klienta

W aplikacji SPA można utworzyć jednego `QueryClient` przy starcie aplikacji i przekazać go przez `QueryClientProvider`.

```svelte
<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'

  let { children } = $props()

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 2,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  })
</script>

<QueryClientProvider client={queryClient}>
  {@render children()}
</QueryClientProvider>
```

Zasady:

- twórz `QueryClient` raz dla drzewa aplikacji, nie w każdym komponencie
- nie twórz `new QueryClient()` w funkcji renderującej listę albo w komponencie wielokrotnie montowanym
- nie konfiguruj domyślnych opcji losowo per komponent
- trzymaj standardy `staleTime`, `gcTime`, retry i refetch w jednym miejscu
- `QueryClientProvider` powinien znajdować się możliwie wysoko w drzewie aplikacji
- jeśli masz kilka niezależnych aplikacji na jednej stronie, każda może mieć własny `QueryClient`
- w microfrontendach ustal jawnie, czy cache ma być wspólny, czy izolowany
## Konfiguracja dla SvelteKit SSR

SvelteKit domyślnie renderuje trasy po stronie serwera. Jeżeli query ma uruchamiać się dopiero w przeglądarce, ustaw `enabled: browser` w domyślnych opcjach `QueryClient`.

```svelte
<script lang="ts">
  import { browser } from '$app/environment'
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'

  let { children } = $props()

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
      },
    },
  })
</script>

<QueryClientProvider client={queryClient}>
  {@render children()}
</QueryClientProvider>
```

Zasady dla SSR:

- nie zakładaj, że query powinno wykonywać się na serwerze tylko dlatego, że komponent jest renderowany przez SvelteKit
- do prefetchu danych w `load` używaj `queryClient.prefetchQuery`
- w `load` używaj `fetch` przekazanego przez SvelteKit, a nie globalnego `fetch`
- query wykonywane po stronie klienta powinno mieć ten sam `queryKey` i kompatybilny `queryFn` jak prefetch
- nie trzymaj jednego globalnego `QueryClient` współdzielonego między requestami SSR, jeśli dane zależą od użytkownika
- cache SSR nie może mieszać danych różnych użytkowników, tenantów albo sesji
- endpointy używane przez TanStack Query muszą być dostępne dla przeglądarki, jeśli query ma później refetchować dane po stronie klienta
