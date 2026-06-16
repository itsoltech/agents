# tanstack-query-svelte-implementation Reference Sector: Version Policy And v6 Migration

## Zawartość

- Version gate
- Kiedy używać v5, a kiedy v6
- Wymagania v6
- Najważniejsze zmiany v6
- Migracja z v5 do v6
- Reguły implementacji dla nowych zmian

## Version gate

Przed implementacją sprawdź lokalne wersje:

- `package.json`
- lockfile
- wersję `@tanstack/svelte-query`
- wersję `svelte`
- czy projekt używa Svelte runes, stores, czy trybu mieszanego
- czy repo ma `.itsol.md` albo inną politykę wersji

Nie zakładaj v6 tylko dlatego, że jest najnowsze. Jeśli repo ma pin v5, implementuj zgodnie z v5, chyba że zadanie dotyczy migracji albo użytkownik zatwierdzi upgrade.

## Kiedy używać v5, a kiedy v6

Używaj v5, gdy:

- repo ma `@tanstack/svelte-query` w wersji `5.x`
- projekt nie jest gotowy na migrację do Svelte runes
- zmiana jest małym bugfixem albo review bez zakresu upgrade
- user albo plan techniczny wymaga kompatybilności z obecną wersją

Używaj v6, gdy:

- repo ma `@tanstack/svelte-query` w wersji `6.x`
- rozpoczynasz nowy projekt bez ograniczeń wersji
- zadanie dotyczy migracji z v5 do v6
- user zatwierdził upgrade w planie technicznym

## Wymagania v6

`@tanstack/svelte-query` v6 wymaga Svelte `>=5.25.0`.

Adapter v6 jest oparty o runes/signals. Nie używa już store API jako głównego modelu odczytu wyniku query.

Ważne: `@tanstack/svelte-query` v6 nadal zależy od `@tanstack/query-core` v5. Nie interpretuj tego jako błąd ani jako częściowej migracji.

## Najważniejsze zmiany v6

Funkcje `createQuery`, `createMutation`, `createInfiniteQuery` i podobne przyjmują opcje jako thunk:

```ts
const query = createQuery(() => ({
  queryKey: ['todos'],
  queryFn: fetchTodos,
}))
```

W v6 nie używaj odczytu przez `$query` w template. Czytaj właściwości bezpośrednio:

```svelte
{#if todos.isSuccess}
  {#each todos.data.items as item}
    <TodoItem {item} />
  {/each}
{/if}
```

Dla reaktywnych inputów używaj runes:

```svelte
<script lang="ts">
  let intervalMs = $state(1000)

  const query = createQuery(() => ({
    queryKey: ['refetch'],
    queryFn: async () => await fetch('/api/data').then((r) => r.json()),
    refetchInterval: intervalMs,
  }))
</script>
```

Jeśli plik miesza stores i runes, migracja może nie wejść w runes mode. Przy migracji stopniowej dodaj w zmigrowanym pliku:

```svelte
<svelte:options runes={true} />
```

Dla pełnej migracji projektu można ustawić `compilerOptions.runes = true` w `svelte.config.js`, ale rób to dopiero po usunięciu składni stores z aplikacji.

## Migracja z v5 do v6

Minimalny plan migracji:

1. Potwierdź `svelte >= 5.25.0`.
2. Zaktualizuj `@tanstack/svelte-query` do `latest` albo zatwierdzonej wersji `6.x`.
3. Znajdź odczyty store-style: `$query`, `$mutation`, `$isFetching`, `$isMutating`.
4. Zamień je na odczyt bezpośredni: `query.data`, `query.isSuccess`, `mutation.isPending`.
5. Usuń `derived`, `writable` i inne store wrappers używane tylko po to, żeby wymusić reaktywność inputów query.
6. Przenieś reaktywne inputy do runes (`$state`, `$derived`, `$props`) i odczytuj je wewnątrz thunk options. Do `queryKey` dodawaj tylko wartości, które zmieniają tożsamość danych albo parametry `queryFn`, nie ustawienia takie jak `refetchInterval`.
7. Dodaj `<svelte:options runes={true} />` w plikach migrowanych stopniowo, jeśli projekt nie ma globalnego runes mode.
8. Sprawdź SSR/SvelteKit: `enabled: browser`, `initialData` i `prefetchQuery` nadal muszą mieć zgodne query keys.
9. Uruchom typecheck, testy komponentów i smoke test przepływów z cache/invalidation/logout.

## Reguły implementacji dla nowych zmian

- Dla nowych projektów wybieraj v6, jeśli nie ma ograniczeń repo ani decyzji użytkownika.
- Dla istniejących repo używaj wersji z lockfile.
- Jeśli zmiana wymaga v6, opisz to w Technical Plan jako upgrade, a nie ukryty refactor.
- Nie mieszaj w jednym komponencie wzorca `$query.data` i `query.data`.
- Nie migruj całej aplikacji do runes mode przy małym bugfixie bez zgody użytkownika.
- Przy codegen/API client zmianach sprawdź, czy query keys i invalidacje nie zmieniły semantyki.
