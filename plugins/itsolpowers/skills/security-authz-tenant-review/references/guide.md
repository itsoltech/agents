# security-authz-tenant-review Reference

Ten plik jest wewnętrzną referencją skilla, wyciętą z `application-security-sdlc-qa-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj poniższej wiedzy bezpośrednio.

## Zakres

Review i implementacja autoryzacji: RBAC/ABAC, object-level authorization, tenant isolation, admin/bulk flows, dane confidential i testy negatywne.

## Przeniesione sekcje

- Klasyfikacja danych / Confidential
- Autoryzacja
- Testy bezpieczeństwa w development / Testy jednostkowe
- Testy bezpieczeństwa w development / Testy integracyjne API
- Katalog scenariuszy QA / Authz i tenanty
- Katalog scenariuszy QA / Admin i operacje masowe
- Security review / Jak działa autoryzacja?
- Checklist code review / Authz
- Checklist code review / Dane i baza
- Minimalne bramki procesu / Dla każdego pull requestu

## Wiedza skilla

### Confidential

Dane wymagające autoryzacji.

- dane użytkowników
- dane klientów
- dokumenty
- raporty
- dane finansowe
- historia akcji
- dane operacyjne firmy

Reguły:

- wymagają autoryzacji po stronie backendu
- nie mogą trafiać do publicznego cache
- w logach zapisuj identyfikatory i metadane zamiast pełnej treści
- eksporty muszą mieć kontrolę uprawnień i ślad audytowy

## Autoryzacja

- autoryzacja musi działać po stronie backendu
- nie ufaj roli, tenantowi ani ownership przesłanym przez frontend
- sprawdzaj uprawnienie przy każdej operacji czytania, zapisu, usuwania, eksportu i akcji masowej
- autoryzacja musi uwzględniać obiekt, nie tylko endpoint
- dla multi-tenant SaaS każdy query do danych tenantowych musi mieć filtr tenant/organization z zaufanego kontekstu
- nie pobieraj obiektu po ID, a dopiero potem sprawdzaj tenant, jeśli istnieje ryzyko wycieku przez timing, error albo logi
- dla list i wyszukiwarek filtruj dane po stronie DB, nie po stronie aplikacji po pobraniu zbyt szerokiego zbioru
- role administracyjne rozdzielaj według zakresu: system admin, tenant admin, billing admin, support, read-only
- panel supportu powinien mieć audyt, ograniczenia dostępu i mechanizm uzasadnienia dostępu do danych klienta
- funkcje eksportu danych traktuj jak osobne operacje z osobną autoryzacją
- nie zakładaj, że ukryty przycisk w UI zabezpiecza akcję
- każda zmiana uprawnień powinna być widoczna w audycie

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

### Authz i tenanty

- użytkownik nie może odczytać zasobu z innego tenanta przez zmianę ID w URL
- użytkownik nie może edytować zasobu z innego tenanta przez zmianę ID w body
- użytkownik nie może wykonać akcji przez endpoint API, jeśli przycisk jest ukryty w UI
- użytkownik z rolą read-only nie może wykonać mutacji
- admin tenanta A nie może administrować tenantem B
- operator supportu ma dostęp tylko przez audytowany flow
- bulk action pomija albo odrzuca obiekty bez uprawnień
- eksport zawiera tylko dane, do których użytkownik ma dostęp

### Admin i operacje masowe

- operacja masowa wymaga osobnego uprawnienia
- operacja masowa ma limit liczby obiektów
- operacja masowa loguje actor, zakres i wynik
- admin nie może wykonać akcji bez potwierdzenia, jeśli operacja jest destrukcyjna
- akcja destrukcyjna jest idempotentna albo bezpieczna przy retry
- panel admina nie jest indeksowany i nie jest dostępny bez auth

### Jak działa autoryzacja?
Opis źródła roli, tenanta i ownership.

### Authz

- czy sprawdzany jest tenant/organization z zaufanego kontekstu
- czy sprawdzany jest ownership obiektu
- czy rola wystarcza do tej konkretnej operacji
- czy bulk action sprawdza każdy obiekt
- czy eksport ma osobne uprawnienie
- czy frontend nie jest jedyną warstwą blokującą operację

### Dane i baza

- czy query do danych tenantowych ma filtr tenant
- czy dynamiczne SQL używa bind parameters
- czy transakcja nie trwa za długo
- czy migracja nie tworzy okna niespójności przy rolling deployment
- czy dane poufne nie trafiają do niezaszyfrowanego pola, logów albo cache

### Dla każdego pull requestu

- code review
- testy jednostkowe i integracyjne
- lint/format
- SAST
- SCA
- secret scanning
- review zmian w lockfile
