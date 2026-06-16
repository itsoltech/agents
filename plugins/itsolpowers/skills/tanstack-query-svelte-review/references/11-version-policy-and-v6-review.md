# tanstack-query-svelte-review Reference Sector: Version Policy And v6 Review

## Zawartość

- Version gate
- Review v5
- Review v6
- Review migracji z v5 do v6
- Findings, które warto zgłaszać

## Version gate

Przed oceną kodu ustal:

- wersję `@tanstack/svelte-query`
- wersję `svelte`
- czy projekt używa runes, stores, czy trybu mieszanego
- czy PR jest zwykłą zmianą, częściową migracją, czy pełnym upgradem
- czy plan techniczny/user zatwierdził migrację do v6

Nie oceniaj kodu v5 regułami v6 jako blocker, jeśli PR nie dotyczy migracji. Zgłoś to najwyżej jako follow-up modernization, chyba że zmiana wprowadza realną regresję.

## Review v5

Dla repo na `@tanstack/svelte-query` v5 sprawdzaj dotychczasowe reguły:

- stabilne query keys
- poprawne `queryFn`
- `createQuery(() => ({ ... }))`, jeśli projekt już używa tego wzorca
- poprawne statusy `pending`/`isPending` zamiast starych wzorców v4
- invalidacje po mutacjach
- bezpieczeństwo cache przy logout i zmianie tenanta
- SSR/SvelteKit bez mieszania danych między requestami

Jeśli projekt v5 nadal używa store-style odczytu, nie wymuszaj v6 w ramach zwykłego review. Zgłoś ryzyko tylko wtedy, gdy nowa zmiana miesza stare i nowe wzorce albo psuje reaktywność.

## Review v6

Dla `@tanstack/svelte-query` v6 sprawdzaj dodatkowo:

- `svelte` ma wersję `>=5.25.0`
- funkcje `createQuery`, `createMutation`, `createInfiniteQuery` i podobne dostają opcje jako thunk
- wynik query/mutation jest czytany bez `$` prefixu
- reaktywne inputy używają runes (`$state`, `$derived`, `$props`) albo kompatybilnego wzorca repo
- pliki migrowane stopniowo mają `<svelte:options runes={true} />`, jeśli projekt nie ma globalnego runes mode
- globalne `compilerOptions.runes = true` nie zostało włączone przed usunięciem stores syntax z aplikacji
- `queryKey` zawiera wszystkie wartości odczytywane w `queryFn`, filtrach, tenant/user scope i URL params
- SSR/SvelteKit nadal używa `enabled: browser` dla query wykonywanych dopiero w przeglądarce

## Review migracji z v5 do v6

Migracyjny PR powinien mieć jasny zakres:

- upgrade zależności
- adaptacja komponentów z `$query` na `query`
- usunięcie store wrappers potrzebnych tylko dla reaktywności query inputs
- runes mode per file albo project-wide z uzasadnieniem
- testy/smoke dla cache, invalidacji, SSR, logout i tenant separation

Red flags:

- upgrade paczki bez zmian w komponentach, które używają `$query`
- mieszanie `$query.data` i `query.data` w jednym module
- `createQuery({ ... })` bez thunk options
- migracja do globalnego runes mode bez audytu stores
- brak testu albo smoke testu dla kluczowego przepływu po migracji

## Findings, które warto zgłaszać

Zgłaszaj jako blocker:

- v6 z `svelte < 5.25.0`
- v6 używające `$query` w template
- v6 z `createQuery({ ... })`, gdy inputy mają być reaktywne
- globalne `compilerOptions.runes = true` w projekcie, który nadal używa stores syntax w dotkniętych ścieżkach
- migracja, która może pokazać dane innego użytkownika/tenanta przez cache

Zgłaszaj jako follow-up:

- repo v5, które mogłoby zostać zmigrowane do v6, ale PR nie dotyczy upgrade
- niekrytyczne stare wzorce w nietkniętym kodzie
- brak pełnego ujednolicenia runes, jeśli PR jest świadomie częściowy
