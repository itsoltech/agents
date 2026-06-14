# svelte-debugging Reference Sector: Autoryzacja i sesja

## Zawartość

- Autoryzacja i sesja
- Formularze, Superforms i Zod
- CSRF, CORS i cookies
- Storage w przeglądarce
- UX stanów asynchronicznych
- Error handling w SvelteKit
- Realtime, WebSocket i SSE
- Performance UI i rendering
- Bundle size i zależności frontendowe
- Testy E2E
- Dostępność w testach
- Observability i diagnostyka

## Autoryzacja i sesja

- UI może ukrywać akcje, ale API musi sprawdzić uprawnienia dla każdej mutacji i każdego odczytu
- nie traktuj route guarda w SPA jako zabezpieczenia danych
- preferuj sesję w cookie `HttpOnly`, `Secure`, `SameSite=Lax` albo `Strict`, jeśli architektura na to pozwala
- nie zapisuj długowiecznych access tokenów w `localStorage`
- jeśli token musi być po stronie klienta, trzymaj go możliwie krótko w pamięci i ogranicz jego zakres oraz czas życia
- refresh token nie powinien być dostępny dla JavaScript
- po logout wyczyść client state, query cache, localStorage związany z użytkownikiem i dane formularzy
- odświeżanie sesji powinno mieć limit i obsługę błędów
- nie pokazuj przez chwilę danych poprzedniego użytkownika po zmianie konta
- nie opieraj permissions tylko na rolach z client state; po stronie API sprawdzaj także ownership i tenant
- przy wielu tenantach tenant id z URL albo UI traktuj jako niezaufane wejście
- w odpowiedziach API nie wysyłaj pól, których użytkownik nie powinien widzieć
## Formularze, Superforms i Zod

- używaj natywnych formularzy i progressive enhancement, jeśli aplikacja korzysta z SvelteKit server actions
- w czystym SPA formularz może wysyłać dane przez API client, ale walidacja serwerowa nadal jest obowiązkowa
- Zod/Superforms traktuj jako wspólny kontrakt walidacji UI i requestu
- nie utrzymuj osobnych, rozjeżdżających się definicji walidacji dla klienta i serwera
- walidację warunkową zapisuj jawnie przez `refine`, `superRefine` albo uniony wariantów formularza
- jeśli pole jest ukryte warunkowo, ustal czy ma być czyszczone, zachowane czy ignorowane przy submit
- nie ufaj polom hidden, disabled ani wartościom pochodzącym z DOM
- pamiętaj, że disabled input nie jest wysyłany w natywnym submit formularza
- błędy pól pokazuj przy polu, a błędy globalne formularza w miejscu widocznym dla użytkownika
- nie wysyłaj requestu, jeśli lokalna walidacja wykrywa oczywisty błąd
- nie blokuj możliwości submit tylko przez disabled button bez komunikatu błędu
- przy długim submit pokazuj stan loading i blokuj podwójne kliknięcie
- dla mutacji ryzykownych dodaj confirmation flow albo undo, jeśli pasuje do produktu
- optimistic UI stosuj tylko z rollbackiem
- przy uploadach pokazuj rozmiar, typ pliku, postęp i obsługę anulowania
- formularz wieloetapowy powinien mieć jawny model stanu, nie luźny zestaw zmiennych w kilku komponentach

Przykład walidacji warunkowej:

```ts
import { z } from 'zod';

export const userFormSchema = z
  .object({
    isCompany: z.boolean(),
    companyName: z.string().trim().optional(),
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
  })
  .superRefine((value, ctx) => {
    if (value.isCompany && !value.companyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyName'],
        message: 'Nazwa firmy jest wymagana',
      });
    }
  });
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
