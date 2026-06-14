# security-api-input-review Reference

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

## SSRF i requesty wychodzące

- requesty do URL podanych przez użytkownika traktuj jako wysokie ryzyko
- blokuj adresy prywatne, loopback, link-local, metadata service i sieci wewnętrzne
- waliduj host po DNS resolution i po redirectach
- ogranicz liczbę redirectów
- pozwalaj tylko na `http` / `https`, jeśli produkt nie wymaga innych schematów
- stosuj allowlistę hostów dla integracji, jeśli jest możliwa
- nie pozwalaj użytkownikowi kontrolować nagłówków auth w requestach wychodzących
- dodawaj timeouty, limit rozmiaru odpowiedzi i limit czasu połączenia
- loguj host docelowy i wynik walidacji, ale bez sekretów

### Testy jednostkowe

Dodawaj testy dla:

- walidatorów wejścia
- parserów
- reguł autoryzacji
- mapowania błędów
- state machine workflow
- funkcji generujących tokeny, linki, podpisy i expiry
- filtrów tenantowych
- sanitizacji i normalizacji danych

Przykłady:

- użytkownik `Viewer` nie może wykonać operacji `delete`
- użytkownik z `tenantA` nie może odczytać obiektu z `tenantB`
- zmiana statusu z `Cancelled` na `Paid` jest odrzucona
- token resetu hasła po użyciu nie działa drugi raz
- upload z nazwą `../../secret.txt` jest odrzucony

### Testy integracyjne API

Dodawaj testy dla:

- braku tokenu
- błędnego tokenu
- wygasłego tokenu
- poprawnego tokenu bez uprawnień
- poprawnego tokenu z obcego tenanta
- poprawnego tokenu z inną rolą
- requestu z dodatkowymi polami, których klient nie powinien ustawiać
- requestu z ID obiektu należącego do innego użytkownika
- requestu powtórzonego kilka razy
- requestu równoległego
- bardzo dużego payloadu
- błędnego content type
- błędnego sortowania, filtrowania i paginacji

### Fuzzing i property-based tests

Stosuj dla:

- parserów plików
- importów CSV/Excel/PDF/XML/JSON
- transformacji danych
- walidatorów
- serializacji/deserializacji
- protokołów binarnych
- endpointów przyjmujących złożone filtry
- komponentów pracujących z tekstem Unicode

Testuj:

- puste dane
- bardzo długie dane
- niepoprawne kodowanie
- znaki kontrolne
- nietypowe Unicode
- zagnieżdżone struktury
- powtarzające się pola
- losową kolejność pól
- liczby skrajne
- null/undefined/brak pola

### API i walidacja

- request z dodatkowymi polami typu `isAdmin`, `tenantId`, `userId` nie wpływa na wynik
- request z błędnym content type jest odrzucony
- request z bardzo dużym body jest odrzucony
- lista ma maksymalny limit wyników
- sortowanie po niedozwolonym polu jest odrzucone
- filtr kosztowny ma limit albo timeout
- błąd walidacji ma stabilny format
- błąd backendu nie pokazuje stack trace

### Wejście i wyjście

- czy dane wejściowe mają walidację typu, długości, zakresu i formatu
- czy dodatkowe pola są odrzucane albo ignorowane bez efektu
- czy odpowiedzi nie zawierają sekretów i danych innych użytkowników
- czy HTML/markdown/rich text są escapowane albo sanityzowane
- czy błędy nie ujawniają stack trace, SQL albo konfiguracji

### Dane i baza

- czy query do danych tenantowych ma filtr tenant
- czy dynamiczne SQL używa bind parameters
- czy transakcja nie trwa za długo
- czy migracja nie tworzy okna niespójności przy rolling deployment
- czy dane poufne nie trafiają do niezaszyfrowanego pola, logów albo cache
