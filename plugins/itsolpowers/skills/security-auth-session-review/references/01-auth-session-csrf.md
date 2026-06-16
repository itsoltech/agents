# Auth Session And CSRF

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
