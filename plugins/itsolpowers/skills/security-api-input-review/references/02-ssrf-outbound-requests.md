# SSRF And Outbound Requests

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
