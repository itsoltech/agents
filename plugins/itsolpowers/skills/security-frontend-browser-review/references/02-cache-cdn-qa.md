# Cache CDN And QA

## Cache, CDN i przeglądarkowy cache

- odpowiedzi z danymi prywatnymi ustawiaj jako `Cache-Control: no-store` albo kontroluj cache per użytkownik
- nie cache'uj odpowiedzi z `Authorization` w publicznym CDN
- HTML aplikacji SPA/SSR zwykle powinien mieć krótki cache albo revalidation
- assety z hashem w nazwie mogą mieć długi cache immutable
- po wylogowaniu czyść cache aplikacji po stronie klienta
- cache key musi uwzględniać tenant, użytkownika, język, role i parametry wpływające na wynik
- nie używaj danych z cache poprzedniego użytkownika po zmianie konta
- nie przechowuj danych poufnych w service worker cache bez świadomej decyzji
- przy invalidacji cache po mutacjach i live eventach testuj brak danych obcego tenanta

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

### Frontend i cache

- po logout nie widać danych poprzedniego użytkownika po kliknięciu back
- po zmianie organizacji nie widać danych poprzedniej organizacji
- po 403 UI pokazuje brak dostępu i nie zostawia starych danych
- po 401 aplikacja czyści sesję i query cache
- po reconnect WebSocket aplikacja robi resync albo uzupełnia brakujące eventy
- optimistic update cofa zmianę po błędzie backendu
- dane w cache nie mieszają się między tenantami

### Frontend

- czy cache jest czyszczony po logout i zmianie tenanta
- czy query keys zawierają parametry wpływające na dane
- czy UI obsługuje 401, 403, 404, 409, 429 i 5xx
- czy dane z API nie są renderowane jako HTML bez sanitizacji
- czy dane poufne nie trafiają do localStorage

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
