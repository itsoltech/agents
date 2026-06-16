# tanstack-query-svelte-debugging Reference Sector: Version Policy And v6 Debugging

## Zawartość

- Version gate
- Objawy specyficzne dla v6
- Debugowanie migracji v5 -> v6
- Minimalne poprawki

## Version gate

Na początku debugowania ustal:

- wersję `@tanstack/svelte-query`
- wersję `svelte`
- czy problem pojawił się po migracji do v6
- czy komponent działa w runes mode
- czy błąd dotyczy SSR, reaktywności inputów, odczytu wyniku query, czy cache/invalidation

Nie stosuj automatycznie fixów v6 w repo na v5. Najpierw potwierdź wersję i zakres migracji.

## Objawy specyficzne dla v6

Typowe symptomy po migracji:

- template nadal używa `$query.isSuccess`, `$query.data` albo `$mutation.isPending`
- `createQuery({ ... })` nie śledzi reaktywnych inputów
- komponent miesza stores i runes i nie działa w oczekiwanym trybie
- query nie refetchuje po zmianie `$state`, propsa albo URL param
- globalny `compilerOptions.runes = true` ujawnił błędy w plikach ze stores syntax
- Svelte jest starsze niż `5.25.0`

## Debugowanie migracji v5 -> v6

Kolejność diagnostyki:

1. Sprawdź `package.json` i lockfile.
2. Jeśli `@tanstack/svelte-query` jest `6.x`, potwierdź `svelte >= 5.25.0`.
3. Wyszukaj `$query`, `$mutation`, `$isFetching`, `$isMutating` w dotkniętych plikach.
4. Wyszukaj `createQuery({`, `createMutation({`, `createInfiniteQuery({`.
5. Sprawdź, czy reaktywne inputy są odczytywane wewnątrz thunk options.
6. Sprawdź, czy plik ma `<svelte:options runes={true} />` albo projekt ma świadomie włączony globalny runes mode.
7. Dla SSR sprawdź, czy `enabled: browser`, `initialData` i `prefetchQuery` mają zgodne query keys i nie powodują podwójnego fetchu.

Przykładowe komendy:

```bash
rg -n "\\$[a-zA-Z0-9_]+\\.(data|isSuccess|isError|isPending|isFetching)|create(Query|Mutation|InfiniteQuery)\\(\\{" src
rg -n "svelte-query|\"svelte\"" package.json pnpm-lock.yaml package-lock.json yarn.lock bun.lock
```

## Minimalne poprawki

Dla v6:

- zamień `$query.data` na `query.data`
- zamień `$query.isSuccess` na `query.isSuccess`
- opakuj options w thunk: `createQuery(() => ({ ... }))`
- przenieś zmienne wpływające na tożsamość danych, filtry albo `queryFn` do `queryKey`
- przenieś reaktywne inputy do runes, jeśli dotychczas były store wrappers tylko dla query
- dodaj `<svelte:options runes={true} />` dla migrowanego pliku, jeśli projekt nie ma globalnego runes mode

Dla v5:

- nie migruj całego komponentu do v6, jeśli bug dotyczy tylko query key, invalidacji albo API error
- popraw root cause zgodnie z aktualną wersją repo
- dodaj notatkę follow-up, jeśli kod wymaga osobnej migracji do v6
