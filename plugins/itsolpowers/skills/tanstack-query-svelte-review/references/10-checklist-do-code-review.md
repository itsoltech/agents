# tanstack-query-svelte-review Reference Sector: Checklist do code review

## Zawartość

- Checklist do code review

## Checklist do code review

### Konfiguracja

- czy `QueryClient` jest tworzony raz dla drzewa aplikacji?
- czy `QueryClientProvider` znajduje się wysoko w drzewie?
- czy `staleTime`, `gcTime`, retry i refetch są ustawione świadomie?
- czy devtools są tylko w dev mode?
- czy SvelteKit SSR ma poprawnie ustawione `enabled: browser` albo świadomy prefetch?

### Query keys

- czy query key jest tablicą?
- czy query key zawiera wszystkie parametry użyte przez `queryFn`?
- czy query key nie zawiera funkcji, klas, tokenów albo niestabilnych obiektów?
- czy filtry są normalizowane?
- czy tenant/user scope jest uwzględniony tam, gdzie trzeba?
- czy query keys są trzymane w factory?

### Query function

- czy `queryFn` rzuca błąd dla HTTP 4xx/5xx?
- czy `queryFn` przekazuje `AbortSignal` do `fetch`?
- czy `queryFn` nie wykonuje mutacji danych?
- czy `queryFn` nie zwraca `undefined`?
- czy w `load` używany jest SvelteKit `fetch`?
- czy endpoint jest dostępny dla klienta, jeśli query ma refetchować w przeglądarce?

### Svelte reactivity

- czy `createQuery` używa funkcji opcji `() => ({ ... })`?
- czy reaktywne propsy i state są odczytywane wewnątrz funkcji opcji?
- czy query key zmienia się po zmianie parametrów?
- czy komponent nie kopiuje `query.data` do lokalnego stanu bez powodu?
- czy inputy formularza nie mutują bezpośrednio danych z cache?

### Loading i error state

- czy pierwsze ładowanie używa `isPending`?
- czy background refetch nie chowa istniejących danych?
- czy empty state jest osobny od loading?
- czy błąd jest mapowany na bezpieczny komunikat?
- czy retry nie dotyczy błędów 4xx?

### Mutacje

- czy zapis danych używa `createMutation`, nie `createQuery`?
- czy mutacja ma `mutationKey`, jeśli jest obserwowana globalnie?
- czy po mutacji cache jest aktualizowany albo invalidowany?
- czy invalidacja jest zawężona do właściwych query keys?
- czy `isPending` blokuje double submit?
- czy optimistic update ma rollback?
- czy delete/update nie zostawia starych danych w cache?

### Bezpieczeństwo

- czy query cache nie przechowuje sekretów?
- czy query keys nie zawierają tokenów ani danych wrażliwych?
- czy logout czyści cache?
- czy zmiana tenanta nie pokazuje danych poprzedniego tenanta?
- czy `{@html}` nie renderuje danych z API bez sanitizacji?
- czy błędy backendu nie ujawniają szczegółów systemu?
- czy persist cache ma allowlistę i czyszczenie po logout?

### Performance

- czy `staleTime` ogranicza zbędne refetch?
- czy nie ma pętli refetch przez niestabilny query key?
- czy search input ma debounce?
- czy duże listy mają paginację albo wirtualizację?
- czy invalidacje nie odświeżają całego cache bez potrzeby?
- czy prefetch dotyczy danych faktycznie potrzebnych?
- czy ciężkie dane mają rozsądny `gcTime`?

### SSR i SvelteKit

- czy cache SSR nie jest współdzielony między użytkownikami?
- czy `prefetchQuery` używa tego samego query key co `createQuery`?
- czy w `load` używany jest `fetch` z argumentów `load`?
- czy `initialData` nie wymaga prop drilling w wielu komponentach?
- czy dane zależne od sesji nie są przypadkowo cache'owane publicznie?

### Testy

- czy testy tworzą świeży `QueryClient`?
- czy retry jest wyłączony w testach?
- czy testy obejmują loading, success, empty i error?
- czy mutacje mają test invalidacji cache?
- czy logout i zmiana tenanta są testowane?
- czy optimistic update ma test rollbacku?
