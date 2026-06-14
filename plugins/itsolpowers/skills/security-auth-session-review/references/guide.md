# security-auth-session-review Reference

Ten plik jest wewnętrzną referencją skilla, wyciętą z `application-security-sdlc-qa-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj poniższej wiedzy bezpośrednio.

## Zakres

Review i implementacja tożsamości użytkownika: login, logout, sesje, cookies, tokeny, CSRF dla cookie-auth, zdarzenia audytu i testy auth.

## Przeniesione sekcje

- Uwierzytelnianie
- Sesje, cookies i tokeny
- CSRF
- Logowanie, audyt i monitoring bezpieczeństwa
- Testy bezpieczeństwa w development / Testy integracyjne API
- Testy bezpieczeństwa w development / Testy E2E
- Katalog scenariuszy QA / Auth
- Checklist code review / Auth i sesja
- Checklist QA

## Wiedza skilla

## Uwierzytelnianie

- używaj sprawdzonego mechanizmu auth zamiast własnego protokołu
- login nie powinien ujawniać, czy istnieje konto o danym e-mailu, jeśli produkt nie wymaga takiej informacji
- hasła przechowuj przez algorytm przeznaczony do password hashing, np. Argon2id, bcrypt albo scrypt
- nie haszuj haseł zwykłym SHA-256, SHA-1, MD5 ani własną funkcją
- reset hasła powinien używać jednorazowego tokenu o krótkim czasie życia
- token resetu hasła powinien być haszowany w bazie tak jak inne dane uwierzytelniające
- zmiana hasła powinna unieważniać istniejące sesje albo wymuszać ponowne uwierzytelnienie dla akcji wysokiego ryzyka
- MFA stosuj dla kont administracyjnych, operatorów i użytkowników z dostępem do danych wielu organizacji
- po zbyt wielu próbach logowania stosuj rate limit, lockout progresywny albo dodatkową weryfikację
- komunikaty błędów logowania nie powinny pomagać w enumeracji kont
- magic linki i kody jednorazowe muszą mieć limit prób, krótki TTL i powiązanie z konkretnym celem
- OAuth/OIDC konfiguruj z walidacją `issuer`, `audience`, `state`, `nonce`, redirect URI i algorytmu podpisu
- nie akceptuj tokenów JWT bez weryfikacji podpisu, `exp`, `nbf`, `iss`, `aud` i algorytmu

## Sesje, cookies i tokeny

- sesja powinna być powiązana z użytkownikiem, tenantem, rolami i czasem ważności
- cookies sesyjne ustawiaj z `HttpOnly`, `Secure`, `SameSite`
- dla aplikacji webowych z cookie auth stosuj ochronę CSRF dla requestów mutujących
- access token powinien mieć krótki czas życia
- refresh token powinien być rotowany i możliwy do unieważnienia
- nie trzymaj długowiecznych tokenów w `localStorage`, jeśli aplikacja działa w przeglądarce i używa danych poufnych
- po wylogowaniu usuń lokalny cache, dane użytkownika, subskrypcje live eventów i stan aplikacji
- po zmianie konta albo tenanta wyczyść cache związany z poprzednim kontekstem
- nie wysyłaj tokenów w query stringu, bo trafią do logów, historii, refererów i narzędzi analitycznych
- sesje administracyjne powinny mieć krótszy TTL i wymagać re-auth dla akcji wysokiego ryzyka
- pamiętaj o global logout dla incydentów, zmiany hasła i odebrania uprawnień

## CSRF

- jeśli auth opiera się o cookies, requesty mutujące muszą mieć ochronę CSRF
- preferuj `SameSite=Lax` albo `SameSite=Strict`, jeśli flow produktu na to pozwala
- dla requestów mutujących używaj CSRF tokenów albo równoważnego mechanizmu frameworka
- nie traktuj CORS jako ochrony CSRF
- nie traktuj samego `SameSite` jako jedynej ochrony w aplikacjach wysokiego ryzyka
- token CSRF powinien być powiązany z sesją albo użytkownikiem
- endpointy typu logout, zmiana e-maila, zmiana hasła, dodanie integracji i usunięcie danych traktuj jako mutujące

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
