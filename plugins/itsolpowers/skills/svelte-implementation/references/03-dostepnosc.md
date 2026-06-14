# svelte-implementation Reference Sector: Dostępność

## Zawartość

- Dostępność
- Performance UI i rendering
- Bundle size i zależności frontendowe
- Obrazy, fonty i assets
- CSS i design system
- UX stanów asynchronicznych
- Error handling w SvelteKit
- Realtime, WebSocket i SSE
- Internationalizacja i formatowanie danych
- Testy jednostkowe i komponentowe
- Testy E2E
- Dostępność w testach
- Observability i diagnostyka

## Dostępność

- nie ignoruj ostrzeżeń a11y z kompilatora Svelte bez powodu
- jeśli używasz `svelte-ignore`, dodaj komentarz z uzasadnieniem
- używaj semantycznych elementów HTML przed ARIA
- `button` służy do akcji, `a` z `href` do nawigacji
- element klikalny musi być obsługiwalny klawiaturą
- nie rób `div` jako przycisku, jeśli możesz użyć `button`
- każdy input powinien mieć label albo poprawny accessible name
- błędy formularza powinny być powiązane z polem przez `aria-describedby` albo równoważny mechanizm
- focus po otwarciu modala powinien przejść do modala i wrócić po zamknięciu
- modal powinien blokować focus poza sobą
- stan loading, error i success powinien być czytelny bez koloru jako jedynego sygnału
- zachowuj widoczny focus ring
- testuj obsługę klawiaturą: Tab, Shift+Tab, Enter, Space, Escape, strzałki tam, gdzie pasują do wzorca
- obrazy informacyjne muszą mieć sensowny `alt`; dekoracyjne mogą mieć pusty `alt`
- nie usuwaj tekstu z przycisków tylko dlatego, że jest ikona
- dla tabel używaj poprawnych nagłówków i scope
- dynamiczne komunikaty używaj z `aria-live`, gdy użytkownik screen readera musi dostać informację
- sprawdzaj kontrast i rozmiary hit targetów według WCAG 2.2
## Performance UI i rendering

- mierz performance przed większą optymalizacją
- unikaj dużych komponentów renderujących tysiące elementów DOM naraz
- dla dużych list używaj paginacji, lazy loading albo virtualizacji
- używaj keyed each blocks, gdy elementy są dodawane, usuwane albo sortowane
- nie licz kosztownych wartości w template przy każdym renderze, jeśli można użyć `$derived`
- nie rób ciężkiego sortowania, filtrowania i grupowania bez debounce albo memoizacji przy dużych danych
- unikaj zapisu do stanu w pętli, jeśli można zbudować wynik lokalnie i przypisać raz
- nie trzymaj ogromnych odpowiedzi API w wielu store'ach naraz
- nie duplikuj tego samego modelu w kilku miejscach stanu
- sprzątaj event listenery, intervale, observery, subskrypcje i zewnętrzne instancje bibliotek
- nie inicjalizuj ciężkich bibliotek w komponencie, jeśli używasz ich tylko po kliknięciu
- ładuj rzadko używane moduły przez dynamic import
- debouncuj resize, scroll i input search
- nie wykonuj layout thrashing przez naprzemienne odczyty i zapisy layoutu
- używaj CSS do animacji prostych stanów zamiast ręcznego manipulowania stylem w JS
- przy animacjach preferuj transform i opacity
## Bundle size i zależności frontendowe

- sprawdzaj bundle analyzerem największe paczki
- nie dodawaj dużej biblioteki dla jednej funkcji
- importuj konkretne moduły zamiast całych bibliotek, jeśli biblioteka nie tree-shake'uje się dobrze
- uważaj na biblioteki z ciężkimi peer dependencies
- nie importuj bibliotek Node-only do kodu klienta
- sprawdzaj, czy paczka działa w przeglądarce i SSR
- dynamicznie importuj edytory, wykresy, mapy, PDF viewer, syntax highlighting i podobne ciężkie moduły
- ikony importuj pojedynczo albo przez system generujący tylko użyte ikony
- usuwaj dead code, stare komponenty i nieużywane style
- kontroluj polyfills; nie dodawaj ich globalnie bez potrzeby
- ustal budżet bundle dla głównych entrypointów
## Obrazy, fonty i assets

- nie wrzucaj pełnych obrazów 4K do miniatur
- generuj warianty rozmiarów obrazów
- używaj nowoczesnych formatów tam, gdzie wspierają je docelowe przeglądarki
- ustaw `width` i `height`, żeby ograniczyć layout shift
- używaj `loading="lazy"` dla obrazów poza pierwszym ekranem
- dla obrazu LCP ustaw priorytet ładowania świadomie
- nie ładuj wielu rodzin i wag fontów bez potrzeby
- self-host fontów może poprawić kontrolę cache i prywatność
- ustaw `font-display`, żeby ograniczyć niewidoczny tekst podczas ładowania fontu
- fingerprintowane assety mogą mieć długi cache
- pliki zależne od użytkownika albo środowiska nie powinny mieć immutable cache bez wersjonowania
## CSS i design system

- preferuj style komponentowe i design tokens
- nie rozsiewaj magicznych kolorów, spacingów i z-indexów po komponentach
- używaj CSS variables dla motywów i wartości współdzielonych
- nie używaj `!important` jako zwykłego narzędzia
- unikaj globalnych styli ingerujących w komponenty feature'ów bez kontroli
- reset albo base styles trzymaj w jednym miejscu
- klasy utility są dopuszczalne, ale zbyt długie template'y obniżają czytelność
- komponenty UI powinny mieć przewidywalne warianty, rozmiary i stany
- stany hover, focus, active, disabled i loading powinny być spójne
- layout responsywny testuj na realnych breakpointach aplikacji, zamiast ograniczać testy do desktopu
- dla overlay, modal, dropdown i tooltip ustal jedną strategię pozycjonowania i z-indexów
## UX stanów asynchronicznych

- każdy ekran pobierający dane powinien mieć stan loading, empty, error i success
- empty state powinien odróżniać brak danych od błędu pobierania
- nie pokazuj pustej tabeli podczas ładowania, jeśli można pokazać skeleton albo spinner z opisem
- przy przejściach route używaj stanu nawigacji, jeśli opóźnienie jest widoczne
- nie resetuj filtrów i formularzy bez zgody użytkownika
- przy błędach API pokazuj komunikat możliwy do działania, a trace id zachowaj dla wsparcia
- toast nie powinien być jedynym miejscem ważnego błędu formularza
- przy operacjach destrukcyjnych wymagaj potwierdzenia albo daj undo
- przy auto-save pokazuj stan zapisu i błąd synchronizacji
- optimistic UI musi mieć rollback albo jasną informację o konflikcie
- przy konflikcie wersji danych pokaż możliwość odświeżenia albo ręcznego rozwiązania
## Error handling w SvelteKit

- używaj `+error.svelte` dla błędów route'ów
- używaj `handleError` do logowania nieoczekiwanych błędów po stronie serwera
- nie pokazuj użytkownikowi surowych błędów z backendu, DB albo stack trace
- mapuj błędy API na typy UI, np. validation, unauthorized, forbidden, notFound, conflict, unavailable
- przy `throw error(...)` używaj statusu zgodnego z sytuacją
- przy redirectach używaj mechanizmów SvelteKit, a nie ręcznej zmiany `window.location` bez powodu
- błędy w background taskach klienta loguj i pokazuj tylko wtedy, gdy wpływają na użytkownika
- nie połykaj błędów przez pusty `catch`
- w `catch` dodaj context albo przekaż błąd dalej
## Realtime, WebSocket i SSE

- połączenie realtime powinno mieć jasny lifecycle związany z route, layoutem albo sesją
- zamykaj socket/subskrypcję po opuszczeniu ekranu, jeśli nie jest globalna
- dodaj reconnect z backoffem i limitem
- nie wysyłaj reconnectów w ciasnej pętli
- waliduj wiadomości przychodzące tak samo jak odpowiedzi HTTP
- obsługuj duplikaty, opóźnienia i wiadomości poza kolejnością
- przy danych krytycznych używaj numerów wersji albo timestampów z serwera
- nie traktuj eventu realtime jako autoryzacji; backend nadal sprawdza uprawnienia
- przy utracie połączenia pokaż stan offline/degraded, jeśli użytkownik może wykonywać akcje
- po reconnect wykonaj resync danych, jeśli eventy mogły zostać utracone
## Internationalizacja i formatowanie danych

- nie sklejaj zdań z fragmentów tekstu, jeśli aplikacja ma być tłumaczona
- formatowanie dat, liczb i walut rób przez `Intl`
- nie trzymaj kwot jako floatów w UI, jeśli mogą podlegać obliczeniom finansowym
- timezone powinien być jawny dla dat biznesowych
- rozróżniaj datę lokalną od timestampu UTC
- nie parsuj dat przez niejednoznaczne formaty tekstowe
- komunikaty błędów powinny mieć kody albo klucze, jeśli są mapowane z API
- walidacja tekstu powinna obsługiwać znaki spoza ASCII
## Testy jednostkowe i komponentowe

- testuj logikę domenową bez renderowania komponentów
- testuj komponenty przez zachowanie użytkownika, nie strukturę wewnętrzną
- unikaj testów zależnych od klas CSS, jeśli klasa nie jest częścią kontraktu
- mockuj API na granicy klienta API, nie wewnątrz komponentów
- waliduj schemas Zod osobnymi testami dla przypadków poprawnych i błędnych
- testuj warunkowe formularze, hidden fields, disabled fields i błędy serwera
- testuj stores i moduły stanu bez przeglądarki, jeśli nie używają browser API
- testy nie powinny zależeć od kolejności wykonania
- nie snapshotuj dużego HTML bez powodu
- snapshot ma być czytelny i reviewowalny
- przy komponentach dostępnościowych testuj role, label i keyboard interaction
## Testy E2E

- używaj Playwright dla krytycznych przepływów użytkownika
- testuj logowanie, logout, odświeżenie sesji i brak uprawnień
- testuj happy path i główne ścieżki błędów
- testuj reload strony w środku procesu, jeśli stan ma się odtwarzać z URL albo backendu
- testuj deep linki do tras chronionych
- nie polegaj na stałych timeoutach; używaj web-first assertions
- seeduj dane testowe jawnie
- każdy test powinien sprzątać dane albo używać izolowanego tenant/user
- testuj aplikację po buildzie produkcyjnym, zamiast ograniczać testy do dev servera
- dla regresji UI rozważ visual snapshots tylko dla stabilnych ekranów
- E2E nie powinny zastępować testów jednostkowych walidacji i logiki
## Dostępność w testach

- sprawdzaj brak podstawowych naruszeń przez axe albo podobne narzędzie
- ręcznie testuj klawiaturę dla modali, dropdownów, menu, tabel i formularzy
- testuj focus po błędzie formularza
- testuj komunikaty `aria-live` dla async statusów
- testuj zoom, większe fonty i małe viewporty
- nie traktuj automatycznego testu a11y jako pełnego pokrycia WCAG
## Observability i diagnostyka

- usuwaj `console.log`, `debugger` i tymczasowe logi przed merge
- loguj błędy klienta przez narzędzie telemetryczne albo wspólny logger
- dodawaj release version, environment, route i user/session id w formie bezpiecznej dla prywatności
- nie wysyłaj do telemetryki tokenów, haseł, pełnych payloadów formularzy ani danych wrażliwych
- zbieraj Web Vitals dla produkcji, jeśli performance ma znaczenie biznesowe
- dodawaj trace id z API do komunikatu diagnostycznego albo logu
- przy błędach API zapisuj status, code i trace id, nie całe body
- feature flags powinny być widoczne w diagnostyce sesji
- błędy inicjalizacji runtime config powinny być łatwe do odróżnienia od błędów API
