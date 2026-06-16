# Audit Monitoring And QA

## Logowanie, audyt i monitoring bezpieczeństwa

- loguj zdarzenia bezpieczeństwa: login, logout, failed login, reset hasła, zmiana hasła, zmiana e-maila, MFA, zmiana uprawnień, zaproszenia, dostęp supportu, eksport, usunięcie danych, błędne podpisy webhooków
- loguj decyzje autoryzacyjne odmowne dla operacji wrażliwych
- audyt powinien zawierać actor, akcję, obiekt, tenant, wynik, czas i correlation id
- nie loguj haseł, tokenów, sekretów, pełnych cookie, pełnych nagłówków auth i pełnych payloadów z danymi poufnymi
- logi powinny pozwalać odtworzyć incydent bez ujawniania danych użytkownika
- błędy 401, 403, 429 i 5xx monitoruj per endpoint, IP, tenant i user id
- alertuj na skoki failed login, resetów hasła, 403, 429, błędnych podpisów webhooków, nietypowych eksportów i dużych transferów danych
- logi security trzymaj zgodnie z polityką retencji
- dostęp do logów produkcyjnych ograniczaj i audytuj

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

### Auth i sesja

- czy endpoint wymaga auth, jeśli powinien
- czy token/sesja są walidowane po stronie backendu
- czy token ma expiry i poprawną walidację issuer/audience
- czy logout czyści stan klienta
- czy reset hasła i zaproszenia mają TTL i jednorazowość
- czy MFA jest wymagane dla kont o podwyższonych uprawnieniach

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
