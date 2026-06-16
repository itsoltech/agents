# API Input And Injection

Ten plik jest wewnętrzną referencją skilla, wyciętą z `application-security-sdlc-qa-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj poniższej wiedzy bezpośrednio.

## Zakres

Review API, DTO, walidacji wejścia, błędów, injection, SSRF, OpenAPI-like kontraktów i testów negatywnych requestów.

## Przeniesione sekcje

- API
- Injection
- SSRF i requesty wychodzące
- Testy bezpieczeństwa w development / Testy jednostkowe
- Testy bezpieczeństwa w development / Testy integracyjne API
- Testy bezpieczeństwa w development / Fuzzing i property-based tests
- Katalog scenariuszy QA / API i walidacja
- Checklist code review / Wejście i wyjście
- Checklist code review / Dane i baza

## Wiedza skilla

## API

- OpenAPI albo inny kontrakt API powinien być źródłem typów klienta i dokumentacji
- każde pole wejściowe powinno mieć walidację typu, zakresu, długości i formatu
- pola, których klient nie może ustawiać, ignoruj albo odrzucaj po stronie backendu
- nie pozwalaj klientowi ustawiać pól takich jak `userId`, `tenantId`, `role`, `isAdmin`, `price`, `status`, `createdBy`, jeśli powinny wynikać z kontekstu backendu
- endpointy listujące dane muszą mieć paginację, limit maksymalny i sortowanie po dozwolonych polach
- endpointy wyszukiwania muszą mieć limit długości query, timeout i ochronę przed kosztownymi filtrami
- endpointy mutujące powinny być idempotentne albo mieć idempotency key, jeśli retry może powtórzyć operację
- operacje masowe muszą mieć limit liczby obiektów i sprawdzenie autoryzacji dla każdego obiektu
- endpointy eksportu powinny mieć limit rozmiaru, async job albo streaming
- błędy API powinny mieć stabilny format, ale bez stack trace, SQL, ścieżek plików i sekretów
- nie zwracaj różnych komunikatów błędu, jeśli pomagają w enumeracji kont, tokenów albo zasobów
- CORS ustawiaj tylko dla zaufanych originów
- nie używaj `Access-Control-Allow-Origin: *` z credentialed requests
- rate limituj login, reset hasła, zaproszenia, wysyłkę e-maili, upload, eksport, webhooki i endpointy kosztowne

## Injection

- zapytania SQL buduj przez bind parameters albo query builder z parametrami
- nie interpoluj danych użytkownika do SQL, LDAP, shell, HTML, XPath, regex, GraphQL ani zapytań wyszukiwarek
- dynamiczne sortowanie i filtrowanie rób przez allowlistę pól, nie przez surowe nazwy z requestu
- komendy systemowe uruchamiaj bez shell, jeśli to możliwe
- jeśli używasz shell, każdy argument musi być escapowany zgodnie z regułami platformy
- nie przekazuj danych użytkownika do eval, Function constructor, template engine albo interpreterów
- regex z danych użytkownika limituj albo unikaj, żeby nie dopuścić do ReDoS
- GraphQL limituj przez depth, complexity, timeout i rate limit
