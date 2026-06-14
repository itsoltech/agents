# security-frontend-browser-review Reference

Ten plik jest wewnętrzną referencją skilla, wyciętą z `application-security-sdlc-qa-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj poniższej wiedzy bezpośrednio.

## Zakres

Review bezpieczeństwa przeglądarki: XSS, CSP, CSRF/CORS/cookies, browser storage, cache, logout cleanup, API security z perspektywy frontendu i E2E.

## Przeniesione sekcje

- Frontend i przeglądarka
- XSS i output encoding
- CSRF
- Cache, CDN i przeglądarkowy cache
- Testy bezpieczeństwa w development / Testy E2E
- Katalog scenariuszy QA / Frontend i cache
- Checklist code review / Frontend
- Checklist QA

## Wiedza skilla

## Frontend i przeglądarka

- frontend traktuj jako niezaufanego klienta
- nie trzymaj sekretów aplikacji w bundle frontendu
- zmienne publiczne frontendu nie są sekretami
- tokeny, ID tenantów, role i flagi z frontendu traktuj jako dane do UI, nie jako źródło autoryzacji
- nie używaj `innerHTML`, `dangerouslySetInnerHTML` albo `{@html}` bez sanitizacji i review
- dane z API wyświetlaj przez mechanizmy frameworka, które escapują tekst
- linki generowane z danych użytkownika waliduj i blokuj `javascript:`, `data:` oraz nieoczekiwane schematy
- zewnętrzne linki otwierane w nowym oknie powinny używać `rel="noopener noreferrer"`
- nie zapisuj danych poufnych w `localStorage`, `sessionStorage` albo IndexedDB bez powodu i analizy ryzyka
- po wylogowaniu czyść cache aplikacji, store'y, query cache, dane formularzy i subskrypcje live
- UI nie może pokazywać starych danych po zmianie użytkownika, organizacji albo uprawnień
- błędy walidacji pokazuj bez ujawniania reguł wewnętrznych, jeśli mogłyby pomagać w ataku
- CSP traktuj jako dodatkową warstwę ochrony przed XSS, nie jako zamiennik escapingu i sanitizacji

## XSS i output encoding

- wszystkie dane pochodzące od użytkownika traktuj jako niezaufane
- tekst HTML escapuj kontekstowo
- atrybuty HTML, URL, CSS i JavaScript mają różne reguły escapingu
- sanitizuj HTML tylko wtedy, gdy produkt naprawdę wymaga rich text
- do rich text używaj sprawdzonego sanitizera z allowlistą tagów i atrybutów
- nie zapisuj surowego HTML z edytora jako zaufanego bez oznaczenia źródła i sanitizacji
- markdown renderuj przez parser z bezpieczną konfiguracją
- nie pozwalaj na inline event handlers, np. `onclick`, w treści użytkownika
- nie buduj skryptów przez konkatenację stringów z danymi użytkownika
- w CSP unikaj `unsafe-inline`, jeśli architektura pozwala używać nonce albo hash

## CSRF

- jeśli auth opiera się o cookies, requesty mutujące muszą mieć ochronę CSRF
- preferuj `SameSite=Lax` albo `SameSite=Strict`, jeśli flow produktu na to pozwala
- dla requestów mutujących używaj CSRF tokenów albo równoważnego mechanizmu frameworka
- nie traktuj CORS jako ochrony CSRF
- nie traktuj samego `SameSite` jako jedynej ochrony w aplikacjach wysokiego ryzyka
- token CSRF powinien być powiązany z sesją albo użytkownikiem
- endpointy typu logout, zmiana e-maila, zmiana hasła, dodanie integracji i usunięcie danych traktuj jako mutujące

## Cache, CDN i przeglądarkowy cache

- odpowiedzi z danymi prywatnymi ustawiaj jako `Cache-Control: no-store` albo kontroluj cache per użytkownik
- nie cache'uj odpowiedzi z `Authorization` w publicznym CDN
- HTML aplikacji SPA/SSR zwykle powinien mieć krótki cache albo revalidation
- assety z hashem w nazwie mogą mieć długi cache immutable
- po wylogowaniu czyść cache aplikacji po stronie klienta
- cache key musi uwzględniać tenant, użytkownika, język, role i parametry wpływające na wynik
- nie używaj danych z cache poprzedniego użytkownika po zmianie konta
- nie przechowuj danych poufnych w service worker cache bez świadomej decyzji
- przy invalidacji cache po mutacjach i live eventach testuj brak danych obcego tenanta

### Testy E2E

Dodawaj testy dla:

- logowania i wylogowania
- zmiany konta/organizacji
- wygasłej sesji
- odświeżenia strony na widoku wymagającym auth
- deep linku do zasobu bez uprawnień
- ukrycia elementów UI bez zastępowania tym autoryzacji backendowej
- wyczyszczenia cache po logout
- błędów API 401, 403, 404, 409, 429 i 5xx

### Frontend i cache

- po logout nie widać danych poprzedniego użytkownika po kliknięciu back
- po zmianie organizacji nie widać danych poprzedniej organizacji
- po 403 UI pokazuje brak dostępu i nie zostawia starych danych
- po 401 aplikacja czyści sesję i query cache
- po reconnect WebSocket aplikacja robi resync albo uzupełnia brakujące eventy
- optimistic update cofa zmianę po błędzie backendu
- dane w cache nie mieszają się między tenantami

### Frontend

- czy cache jest czyszczony po logout i zmianie tenanta
- czy query keys zawierają parametry wpływające na dane
- czy UI obsługuje 401, 403, 404, 409, 429 i 5xx
- czy dane z API nie są renderowane jako HTML bez sanitizacji
- czy dane poufne nie trafiają do localStorage

## Checklist QA

- test użytkownika niezalogowanego
- test użytkownika bez roli
- test użytkownika z obcego tenanta
- test użytkownika po odebraniu roli
- test requestu z podmienionym ID w URL
- test requestu z podmienionym ID w body
- test requestu z dodatkowymi polami administracyjnymi
- test powtórzenia tej samej operacji
- test równoległego wykonania operacji
- test wygasłej sesji
- test logout i back button
- test zmiany organizacji bez odświeżenia strony
- test błędów API
- test dużego payloadu
- test limitów paginacji
- test uploadu z niepoprawną nazwą
- test eksportu danych
- test eventów WebSocket po zmianie uprawnień
- test retry integracji
