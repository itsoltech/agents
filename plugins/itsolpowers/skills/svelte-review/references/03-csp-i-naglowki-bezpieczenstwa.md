# svelte-review Reference Sector: CSP i nagłówki bezpieczeństwa

## Zawartość

- CSP i nagłówki bezpieczeństwa
- CSRF, CORS i cookies
- Storage w przeglądarce
- API security z perspektywy frontendu
- Dostępność
- Performance UI i rendering
- Bundle size i zależności frontendowe
- CSS i design system
- UX stanów asynchronicznych
- Error handling w SvelteKit
- Testy jednostkowe i komponentowe

## CSP i nagłówki bezpieczeństwa

- ustaw Content Security Policy dla aplikacji produkcyjnej
- zaczynaj od `Content-Security-Policy-Report-Only`, jeśli aplikacja ma dużo zewnętrznych skryptów
- ogranicz `script-src`, `connect-src`, `img-src`, `style-src`, `font-src` do znanych źródeł
- unikaj `unsafe-inline` i `unsafe-eval` w produkcji
- dla SvelteKit skonfiguruj CSP w `svelte.config.js` albo na reverse proxy, zależnie od trybu deployu
- ustaw `frame-ancestors`, jeśli aplikacja nie powinna być osadzana w iframe
- dodaj `X-Content-Type-Options: nosniff`
- ustaw `Referrer-Policy`
- ustaw `Permissions-Policy` dla funkcji przeglądarki, których nie używasz
- HSTS ustawiaj na domenach produkcyjnych obsługiwanych wyłącznie przez HTTPS
- CSP traktuj jako drugą warstwę ochrony, nie jako zamiennik naprawy XSS

Przykładowy kierunek konfiguracji CSP:

```ts
const config = {
  kit: {
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ['self'],
        'script-src': ['self'],
        'style-src': ['self'],
        'img-src': ['self', 'data:', 'blob:'],
        'font-src': ['self'],
        'connect-src': ['self', 'https://api.example.com'],
        'frame-ancestors': ['none'],
        'base-uri': ['self'],
        'form-action': ['self'],
      },
    },
  },
};

export default config;
```
## CSRF, CORS i cookies

- jeśli autoryzacja opiera się o cookies, mutacje muszą mieć ochronę przed CSRF
- nie wyłączaj ochrony CSRF w SvelteKit bez zastępczego mechanizmu
- dla endpointów mutujących sprawdzaj metodę, origin, content type i token CSRF, jeśli architektura tego wymaga
- `SameSite=Lax` ogranicza część ataków CSRF, ale nie zastępuje pełnej analizy dla każdej architektury
- endpointy z credentials nie powinny mieć CORS `Access-Control-Allow-Origin: *`
- nie traktuj CORS jako kontroli dostępu do danych
- preflight CORS powinien dopuszczać tylko wymagane metody i nagłówki
- cookies ustawiaj z `HttpOnly`, `Secure`, `SameSite`, `Path` i sensownym czasem życia
- przy reverse proxy sprawdź, czy nagłówki `X-Forwarded-Proto`, `Host` i secure cookies działają poprawnie
- jeśli frontend i API są na różnych subdomenach, przetestuj cookies w docelowych przeglądarkach i trybach prywatności
## Storage w przeglądarce

- localStorage i sessionStorage traktuj jako publiczne dla JavaScript z tej samej domeny
- nie zapisuj w localStorage długowiecznych tokenów, refresh tokenów, haseł ani danych wrażliwych
- localStorage używaj do preferencji UI, np. motyw, układ tabeli, ostatnio wybrane filtry bez danych wrażliwych
- dane z localStorage waliduj po odczycie
- obsługuj brak storage, tryb prywatny, quota exceeded i usunięte dane
- nie zakładaj, że dane w storage są aktualne albo pochodzą z Twojej aplikacji
- przy logout usuń dane powiązane z użytkownikiem
- dla cache API ustaw wersję schematu i mechanizm invalidacji
- IndexedDB używaj dla większych danych offline, ale też z limitem i strategią czyszczenia
## API security z perspektywy frontendu

- każdy odczyt i zapis danych musi być autoryzowany po stronie API
- nie polegaj na tym, że frontend nie pokaże przycisku albo pola
- nie wysyłaj do API pól, których użytkownik nie może zmieniać
- backend powinien ignorować albo odrzucać pola spoza kontraktu requestu
- unikaj masowego przypisywania obiektów z formularza do modelu domenowego po stronie API
- przy operacjach na cudzych zasobach testuj IDOR/BOLA, np. podmiana `orderId` w URL
- przy akcjach administracyjnych testuj BFLA, np. zwykły użytkownik wywołuje endpoint admina
- ograniczaj rozmiar requestów, list, uploadów i eksportów
- przy wyszukiwarkach i filtrach ustaw limity, sort whitelist i maksymalny zakres dat
- nie ujawniaj różnic w błędach, które pozwalają enumerować użytkowników albo zasoby
- dla danych wrażliwych ogranicz cache przeglądarki i proxy
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
