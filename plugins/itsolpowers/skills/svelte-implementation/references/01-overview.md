# svelte-implementation Reference Sector: Overview

## Zawartość

- Overview
- Cel dokumentu
- Założenia techniczne
- Zasady ogólne
- TypeScript
- Struktura projektu
- Pliki Svelte i długość komponentów
- Svelte 5 reactivity
- Props, events, bind i snippets
- State management
- SvelteKit routing i rendering


## Cel dokumentu

Ten dokument służy jako checklist do code review dla projektów Svelte i SvelteKit. Obejmuje praktyki frameworkowe, architekturę frontendu, komunikację z API, bezpieczeństwo, wydajność, dostępność, testy, CI i organizację kodu.

Dokument zakłada pracę na Svelte 5 i SvelteKit, ale część zasad pasuje też do projektów w trybie legacy. Jeśli projekt nadal używa składni Svelte 4, traktuj sekcje o runes jako kierunek migracji, a nie wymóg dla każdej zmiany.

Checklist nie zastępuje pomiarów, testów i przeglądu wymagań biznesowych. Reguła dobra dla dashboardu SPA może być błędna dla publicznej strony SSR albo komponentowej biblioteki UI.
## Założenia techniczne

- projekt używa TypeScript
- projekt może działać jako SPA, SSG, SSR albo hybryda SvelteKit
- backend API może być osobną aplikacją, np. .NET, Node, Rust albo Python
- konfiguracja środowiskowa może być dostarczana w runtime przez endpoint JSON, szczególnie przy buildzie kontenera raz i uruchamianiu go w wielu środowiskach
- formularze mogą korzystać z Superforms i Zod
- kod ma być utrzymywalny przez zespół, bez skracania pracy kosztem późniejszego utrzymania
## Zasady ogólne

- najpierw poprawność, potem optymalizacja
- nie optymalizuj bez pomiaru albo konkretnego problemu z UX, bundle size, memory, CPU albo latency
- trzymaj logikę domenową poza komponentem, jeśli komponent zaczyna mieszać UI, walidację, API, mapping i permissions
- traktuj dane z API, localStorage, query params, formularzy i websocketów jako niezaufane
- waliduj dane na granicy systemu, a w kodzie aplikacji używaj już typowanych struktur
- nie używaj `any` jako sposobu wyciszenia problemu typów
- nie ukrywaj kosztownego I/O za nazwą funkcji wyglądającą jak prosty getter
- kod widoczny w przeglądarce nie może zawierać sekretów
- backend pozostaje źródłem prawdy dla autoryzacji, walidacji biznesowej i uprawnień
- UI może poprawiać UX przez walidację klienta, ale nie zastępuje walidacji serwera
## TypeScript

- używaj `strict: true`
- unikaj `any`; jeśli typ jest nieznany, użyj `unknown` i zawęź go walidacją
- preferuj typy domenowe zamiast luźnych stringów, np. `OrderStatus`, `UserRole`, `TenantId`
- dla ID, kwot, dat i jednostek rozważ branded types albo newtype-style wrappers
- nie używaj `as SomeType` do maskowania niepoprawnych danych z API
- typy z API generuj z OpenAPI, GraphQL schema albo waliduj przez Zod/Valibot/ArkType
- w `load` używaj typów generowanych przez SvelteKit z `./$types`
- typuj propsy komponentów przez `$props()`
- nie eksportuj typów z losowych plików komponentów, jeśli są używane przez wiele modułów
- wspólne typy trzymaj blisko funkcjonalności albo w module domenowym, nie w jednym dużym `types.ts`
- unikaj unionów stringowych rozsianych po kodzie; trzymaj je w jednym module domenowym
- jeśli używasz enumów, sprawdź wpływ na bundle i interoperacyjność z API
- preferuj `satisfies` tam, gdzie chcesz sprawdzić kształt obiektu bez rozszerzania typu
- używaj `Readonly`, `ReadonlyArray` albo immutable conventions tam, gdzie dane nie powinny być modyfikowane
- nie ignoruj błędów typów przez `// @ts-ignore`; jeśli trzeba, użyj `// @ts-expect-error` z powodem
## Struktura projektu

Preferuj podział po funkcjonalnościach. Pliki techniczne typu `components`, `api`, `schemas` mogą istnieć wewnątrz konkretnej funkcjonalności, ale nie powinny tworzyć jednego globalnego worka.

Przykład:

```txt
src/
  lib/
    app/
      config/
      navigation/
      permissions/
      telemetry/
    features/
      orders/
        api/
        components/
        model/
        schemas/
        stores/
        utils/
      users/
        api/
        components/
        model/
        schemas/
    shared/
      api/
      forms/
      ui/
      utils/
  routes/
    +layout.ts
    +layout.svelte
    (public)/
    app/
      orders/
        +page.ts
        +page.svelte
```

Zasady:

- `routes/` powinno składać widoki i dane routingu, a nie przechowywać całą logikę domenową
- logikę API trzymaj w `$lib/features/<feature>/api` albo `$lib/shared/api`
- schematy walidacyjne trzymaj blisko formularza albo modelu domenowego
- komponenty UI wielokrotnego użytku trzymaj w `$lib/shared/ui`
- komponenty specyficzne dla funkcjonalności trzymaj w `$lib/features/<feature>/components`
- nie twórz globalnego `utils.ts` bez jasnej odpowiedzialności
- nazwa modułu powinna opisywać powód istnienia kodu, nie kategorię techniczną
- unikaj importów typu `../../../../`; ustaw aliasy i trzymaj konsekwentną strukturę
- unikaj zależności cyklicznych między feature'ami
- feature może zależeć od `shared`, ale `shared` nie powinien zależeć od feature'a
- jeśli dwa feature'y zaczynają się wzajemnie importować, wyciągnij wspólną domenę albo kontrakt
## Pliki Svelte i długość komponentów

- komponent powinien mieć jedną odpowiedzialność widoczną w nazwie
- komponent powyżej 250-350 linii wymaga sprawdzenia, czy nie miesza zbyt wielu zachowań
- `+page.svelte` powinien być możliwie cienki; cięższą logikę przenieś do komponentów, modelu albo `load`
- nie łącz w jednym komponencie dużego formularza, tabeli, modali, API i walidacji uprawnień
- rozbij duże formularze na sekcje, ale nie rozbijaj na drobne komponenty bez potrzeby
- nie przenoś stanu do globalnego store tylko po to, żeby skrócić propsy
- jeśli propsy przechodzą przez wiele poziomów, rozważ context albo zmianę kompozycji
- nie twórz komponentu dla trzech linijek HTML, jeśli pogarsza to czytelność
- komponenty współdzielone powinny mieć prosty kontrakt propsów i slotów/snippetów
- komponenty domenowe mogą znać konkretne modele aplikacji
- komponenty UI nie powinny importować API, stores domenowych ani routera bez powodu
## Svelte 5 reactivity

- używaj `$state` dla lokalnego, mutowalnego stanu komponentu albo klasy pomocniczej
- używaj `$derived` dla wartości wyliczanych ze stanu
- `$derived` powinien być czysty, bez requestów, logowania, mutacji i efektów ubocznych
- używaj `$effect` do synchronizacji z DOM, browser API, zewnętrzną biblioteką albo subskrypcją
- nie używaj `$effect` do przepisywania danych, które można policzyć przez `$derived`
- każdy `$effect`, który tworzy subskrypcję, timer, observer albo listener, powinien zwracać cleanup
- nie zakładaj, że wartości przeczytane po `await`, w `setTimeout` albo callbacku zostaną automatycznie śledzone przez `$effect`
- pamiętaj, że `$effect` nie uruchamia się podczas SSR
- do kodu uruchamianego raz po zamontowaniu używaj `onMount`, jeśli nie potrzebujesz reaktywnego efektu
- nie rób requestów w `$effect`, jeśli dane są potrzebne przez routing i mogą być pobrane w `load`
- nie twórz cykli: effect zmienia stan, który uruchamia ten sam effect bez warunku końca
- jeśli stan jest przekazywany poza komponent, opisz ownership i miejsce mutacji
- unikaj mieszania legacy `$:` i runes w nowych plikach
- przy migracji ze Svelte 4 ogranicz zakres zmiany i nie mieszaj refaktoru reactivity z dużą zmianą biznesową
## Props, events, bind i snippets

- typuj propsy przez `$props()`
- ustawiaj domyślne wartości propsów tylko tam, gdzie default ma sens biznesowy albo UI
- nie mutuj propsów, jeśli komponent nie dostał do tego jawnego kontraktu
- używaj callback props zamiast `createEventDispatcher` w nowych komponentach Svelte 5
- nazwy callbacków zapisuj jako akcje, np. `onSave`, `onCancel`, `onSelectedChange`
- przekazuj w callbacku dane potrzebne rodzicowi, ale nie cały stan komponentu bez potrzeby
- używaj `$bindable` oszczędnie; dwukierunkowy przepływ danych utrudnia debugowanie większych ekranów
- `bind:` stosuj głównie w inputach, prostych wrapperach inputów i kontrolowanych komponentach formularzy
- do wielokrotnego użycia fragmentu markup w obrębie komponentu używaj snippetów
- do wielokrotnego użycia zachowania, lifecycle albo kontraktu API używaj komponentu
- unikaj przekazywania dużych obiektów przez rest props bez kontroli
- nie mieszaj wielu sposobów komunikacji w jednym komponencie: propsy, context, store i events naraz
## State management

- domyślnie trzymaj stan jak najbliżej miejsca użycia
- stan formularza trzymaj przy formularzu
- stan filtrów, sortowania i paginacji zapisuj w URL, jeśli ma być linkowalny albo odtwarzalny po odświeżeniu
- dane pobrane przez routing trzymaj w `data` z `load`, nie duplikuj ich w globalnym store bez powodu
- używaj context dla stanu ograniczonego do poddrzewa komponentów, np. tabela, wizard, formularz wieloetapowy
- używaj stores albo modułów `.svelte.ts` dla współdzielonego stanu klienta
- nie przechowuj per-user/per-request state w module scope po stronie serwera SvelteKit
- w SSR per-request state trzymaj w `event.locals`, `load`, `data` albo context tworzonym per request
- w SPA globalny client store jest dopuszczalny, ale nadal powinien mieć jasny właściciel, reset i lifecycle
- po logout wyczyść stores, cache API i dane użytkownika w pamięci
- nie zapisuj w store danych, które można jednoznacznie wyliczyć przez `$derived`
- nie używaj globalnego store jako event busa dla losowych zdarzeń
- dla złożonych przepływów rozważ maszynę stanów albo jawny reducer
## SvelteKit routing i rendering

- wybierz rendering per route: SSR, CSR, prerender albo SPA fallback
- nie wyłączaj SSR globalnie, jeśli część aplikacji korzysta z SEO, szybkiego pierwszego HTML albo danych serwerowych
- dla czystej aplikacji panelowej SPA użyj `adapter-static` z fallbackiem albo świadomie ustaw `ssr = false`
- przy `ssr = false` kod komponentów działa tylko w przeglądarce, ale nadal sprawdzaj importy modułów używanych przez SvelteKit
- nie używaj `window`, `document`, `localStorage`, `ResizeObserver` poza kodem klienta
- browser API wywołuj w `onMount`, `$effect` albo po sprawdzeniu `browser` z `$app/environment`
- `+layout.ts` używaj do danych wspólnych dla grupy tras
- nie pobieraj tych samych danych w wielu sąsiadujących page loadach, jeśli można pobrać je w layoucie
- używaj route groups do rozdzielenia public, auth, app, admin
- trasy chronione sprawdzaj po stronie serwera, jeśli aplikacja działa SSR/server mode
- w czystym SPA route guard w kliencie poprawia UX, ale nie zabezpiecza API
- `+error.svelte` projektuj jako część UX, nie jako debug page
- nie ujawniaj stack trace i szczegółów infrastruktury w błędach dla użytkownika
