# security-qa-scenarios Reference Sector: Overview

## Zawartość

- Overview
- Security definition of done
- Testy bezpieczeństwa w development


### QA

- testuje happy path, negative path i abuse path
- przygotowuje scenariusze z użytkownikiem bez roli, innym tenantem, wygasłą sesją, zmianą ID w requestach, ponownym wysłaniem akcji i równoległymi requestami
- sprawdza zachowanie aplikacji przy błędach API, timeoutach, braku sieci i częściowych awariach
- testuje, czy UI nie ujawnia danych po wylogowaniu, zmianie konta albo zmianie uprawnień
- raportuje podatność jako security issue, nie jako zwykły bug UI
## Security definition of done

Funkcja jest gotowa do release, gdy:

- autoryzacja działa po stronie backendu
- testy obejmują brak sesji, złą rolę, obcy tenant i obce ID obiektu
- dane wejściowe są walidowane po stronie backendu
- requesty mutujące mają ochronę przed CSRF, jeśli auth opiera się o cookies
- endpointy mają limity rozmiaru, paginację albo streaming dla dużych danych
- błędy nie ujawniają stack trace, SQL, sekretów, tokenów ani danych innych użytkowników
- zdarzenia bezpieczeństwa są logowane bez danych wrażliwych
- zależności i obraz kontenera przeszły skan podatności
- nie ma nowych sekretów w repozytorium, konfiguracji ani logach
- OpenAPI, typy klienta i dokumentacja są zgodne z zachowaniem backendu
- migracje DB są zgodne w przód i w tył z planem deploymentu
- mechanizmy cache nie pokazują danych po zmianie użytkownika, roli albo tenanta
## Testy bezpieczeństwa w development

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

### Testy DAST

DAST uruchamiaj na środowisku testowym ze sztucznymi danymi.

- skan baseline dla aplikacji webowej
- skan API na podstawie OpenAPI
- skan formularzy i endpointów auth z dedykowanymi kontami testowymi
- test nagłówków bezpieczeństwa
- test TLS i redirectów HTTP -> HTTPS
- test CORS
- test endpointów administracyjnych

DAST nie zastępuje testów ręcznych. Narzędzia automatyczne zwykle nie wykryją poprawnie błędów logiki biznesowej, BOLA, IDOR i problemów z tenantami.

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
