# Browser XSS And CSRF

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
