# security-qa-scenarios Reference Sector: Katalog scenariuszy QA

## Zawartość

- Katalog scenariuszy QA
- Checklist QA

## Katalog scenariuszy QA

### Auth

- logowanie z błędnym hasłem nie ujawnia, czy e-mail istnieje
- 10 błędnych prób logowania uruchamia limit albo dodatkową ochronę
- reset hasła działa tylko raz
- reset hasła wygasa po czasie
- reset hasła unieważnia poprzednie tokeny resetu
- zmiana hasła unieważnia stare sesje albo wymaga ponownego logowania
- użytkownik zablokowany nie może użyć aktywnej sesji
- użytkownik po usunięciu konta nie może odświeżyć tokenu
- konto bez MFA nie może wejść do panelu admina, jeśli MFA jest wymagane

### Authz i tenanty

- użytkownik nie może odczytać zasobu z innego tenanta przez zmianę ID w URL
- użytkownik nie może edytować zasobu z innego tenanta przez zmianę ID w body
- użytkownik nie może wykonać akcji przez endpoint API, jeśli przycisk jest ukryty w UI
- użytkownik z rolą read-only nie może wykonać mutacji
- admin tenanta A nie może administrować tenantem B
- operator supportu ma dostęp tylko przez audytowany flow
- bulk action pomija albo odrzuca obiekty bez uprawnień
- eksport zawiera tylko dane, do których użytkownik ma dostęp

### API i walidacja

- request z dodatkowymi polami typu `isAdmin`, `tenantId`, `userId` nie wpływa na wynik
- request z błędnym content type jest odrzucony
- request z bardzo dużym body jest odrzucony
- lista ma maksymalny limit wyników
- sortowanie po niedozwolonym polu jest odrzucone
- filtr kosztowny ma limit albo timeout
- błąd walidacji ma stabilny format
- błąd backendu nie pokazuje stack trace

### Frontend i cache

- po logout nie widać danych poprzedniego użytkownika po kliknięciu back
- po zmianie organizacji nie widać danych poprzedniej organizacji
- po 403 UI pokazuje brak dostępu i nie zostawia starych danych
- po 401 aplikacja czyści sesję i query cache
- po reconnect WebSocket aplikacja robi resync albo uzupełnia brakujące eventy
- optimistic update cofa zmianę po błędzie backendu
- dane w cache nie mieszają się między tenantami

### Pliki

- upload przekraczający limit jest odrzucony
- upload z `../` w nazwie jest odrzucony
- upload z nazwą z Unicode i znakami kontrolnymi nie psuje ścieżki
- plik prywatny nie jest dostępny bez autoryzacji
- signed URL wygasa po czasie
- użytkownik nie może pobrać pliku innego tenanta
- eksport CSV nie uruchamia formuły po otwarciu w arkuszu

### Webhooki i integracje

- webhook bez podpisu jest odrzucony
- webhook z błędnym podpisem jest odrzucony
- webhook ze starym timestampem jest odrzucony
- ten sam event webhooka wysłany drugi raz nie wykonuje operacji podwójnie
- provider zwraca timeout i aplikacja obsługuje retry bez duplikacji
- provider zwraca 500 i aplikacja nie gubi joba
- provider zwraca dane w nieoczekiwanym formacie i aplikacja nie zapisuje uszkodzonych danych

### WebSockety i live eventy

- połączenie bez tokenu jest odrzucone
- połączenie z tokenem użytkownika z innego tenanta nie dostaje eventów
- subskrypcja kanału z cudzym ID jest odrzucona
- duża wiadomość od klienta jest odrzucona
- szybkie wysyłanie wiadomości uruchamia rate limit
- po odebraniu uprawnień użytkownik przestaje dostawać eventy
- duplikat eventu nie powoduje podwójnej zmiany w UI
- event poza kolejnością nie psuje stanu cache

### Admin i operacje masowe

- operacja masowa wymaga osobnego uprawnienia
- operacja masowa ma limit liczby obiektów
- operacja masowa loguje actor, zakres i wynik
- admin nie może wykonać akcji bez potwierdzenia, jeśli operacja jest destrukcyjna
- akcja destrukcyjna jest idempotentna albo bezpieczna przy retry
- panel admina nie jest indeksowany i nie jest dostępny bez auth

### LLM i automatyzacja

- prompt użytkownika nie może nadpisać polityki systemowej
- model nie dostaje sekretów ani danych spoza zakresu użytkownika
- narzędzia wykonywane przez model mają minimalne uprawnienia
- każda akcja destrukcyjna wywołana przez agenta wymaga jawnej autoryzacji albo zatwierdzenia
- output modelu jest walidowany przed użyciem jako JSON, SQL, komenda, e-mail albo decyzja biznesowa
- RAG nie zwraca dokumentów z innego tenanta
- logi promptów nie zawierają sekretów i danych osobowych bez podstawy
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

### Kontrole dynamiczne

- OWASP ZAP baseline dla web UI
- OWASP ZAP API scan z OpenAPI
- testy auth i authz z różnymi rolami
- testy BOLA/IDOR generowane z kontraktu API
- testy rate limitów
- testy nagłówków bezpieczeństwa
- test TLS
- test CORS
- test redirectów

### Jakie testy negatywne dodano?
Lista testów.

### Dla każdego release

- DAST na środowisku testowym albo staging
- skan obrazów
- SBOM
- lista podatności otwartych z severity
- potwierdzony rollback albo forward fix
- potwierdzenie, że nie ma sekretów w logach i artefaktach
