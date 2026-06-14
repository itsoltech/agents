# security-threat-modeling Reference Sector: Overview

## Zawartość

- Overview
- Cel dokumentu
- Standardy odniesienia
- Zasady pracy
- Security definition of ready
- Threat modeling
- Klasyfikacja danych


## Cel dokumentu

Dokument opisuje zasady pracy nad bezpieczeństwem aplikacji od planowania funkcji, przez development i code review, po testy, QA, release i utrzymanie. Ma działać jako wewnętrzny standard dla zespołu tworzącego aplikacje webowe, API, aplikacje desktopowe, mobilne, systemy z WebSocketami, usługi backendowe oraz systemy korzystające z LLM.

Dokument jest niezależny od technologii backendu i frontendu. Te same reguły stosuj przy Rust, Effect, .NET, Node.js, Svelte, React, TanStack Query, OpenAPI, Dockerze, Nomadzie i usługach chmurowych.
## Standardy odniesienia

Ten standard warto mapować do kilku publicznych źródeł:

- OWASP ASVS 5.0 - wymagania weryfikacyjne dla aplikacji webowych i API.[^owasp-asvs]
- OWASP Web Security Testing Guide - baza scenariuszy testów bezpieczeństwa aplikacji webowych.[^owasp-wstg]
- OWASP Top 10 2025 - lista najczęstszych klas ryzyk dla aplikacji webowych.[^owasp-top10]
- OWASP API Security Top 10 2023 - lista klas ryzyk specyficznych dla API.[^owasp-api]
- OWASP Cheat Sheet Series - praktyczne instrukcje dla auth, sesji, CSRF, XSS, logowania, secrets i threat modelingu.[^owasp-cheats]
- NIST SSDF SP 800-218 - model bezpiecznego tworzenia oprogramowania.[^nist-ssdf]
- OWASP SAMM - model do rozwijania procesu bezpieczeństwa w organizacji.[^owasp-samm]
- CISA Secure by Design - zasady projektowania produktów z domyślnie włączonymi mechanizmami ochrony.[^cisa-secure-by-design]
- CISA SBOM Minimum Elements 2025 - odniesienie dla inwentaryzacji zależności i artefaktów.[^cisa-sbom]
- SLSA - model ochrony łańcucha dostaw oprogramowania i artefaktów builda.[^slsa]
## Zasady pracy

- bezpieczeństwo jest częścią developmentu, a nie osobnym etapem po zakończeniu funkcji
- każde wymaganie biznesowe z dostępem do danych, płatnościami, rolami, plikami, integracjami albo automatyzacją wymaga krótkiego przeglądu bezpieczeństwa
- kod nie przechodzi do release, jeśli wprowadza znaną podatność bez zaakceptowanego wyjątku
- każdy wyjątek bezpieczeństwa ma właściciela, datę wygaśnięcia i opis ryzyka
- brak testu dla reguły autoryzacji traktuj jak brak samej reguły
- frontend nie jest granicą bezpieczeństwa; walidacje i autoryzacje muszą działać po stronie backendu
- API nie może ufać ID, roli, tenantowi, cenie, statusowi ani uprawnieniom przesłanym przez klienta
- logi, metryki i alerty są częścią ochrony systemu, bo pozwalają wykrywać nadużycia po wdrożeniu
- bezpieczeństwo powinno mieć właściciela procesu, ale odpowiedzialność za konkretną zmianę ma autor i reviewer
## Security definition of ready

Funkcja jest gotowa do developmentu, gdy wiadomo:

- kto może wykonać operację
- na jakich obiektach może ją wykonać
- jakie dane są czytane, zapisywane, eksportowane albo usuwane
- czy funkcja dotyka danych osobowych, płatności, sekretów, plików, konfiguracji, uprawnień albo integracji zewnętrznych
- jakie są role, tenanty, organizacje, lokalizacje albo inne granice dostępu
- jakie są limity: rozmiar pliku, liczba requestów, liczba rekordów, timeout, retry, batch size
- jakie zdarzenia trzeba logować do audytu
- jakie są abuse cases do przetestowania
## Threat modeling

Threat modeling ma odpowiedzieć na cztery pytania:

- co budujemy
- co może pójść źle
- co zrobimy, żeby zmniejszyć ryzyko
- jak sprawdzimy, że zabezpieczenia działają

### Kiedy robić threat modeling

Krótki threat model rób dla każdej funkcji, która dotyka:

- logowania, sesji, resetu hasła, MFA, zaproszeń i tokenów
- ról, uprawnień, tenantów, organizacji i konfiguracji systemowej
- danych osobowych, danych finansowych, danych kontrahentów i danych poufnych
- uploadu, eksportu, importu i generowania plików
- integracji zewnętrznych, webhooków, OAuth, API keys i service accounts
- WebSocketów, live eventów, kolejek, jobów i automatyzacji
- LLM, agentów, narzędzi wykonywanych przez model, RAG i danych promptów
- paneli administracyjnych, raportów, billingów, audytu i operacji masowych

Pełniejszy threat model rób dla nowych modułów, zmian architektonicznych, nowych integracji, zmian modelu auth albo zmian w danych między tenantami.

### Minimalny artefakt threat modelu

Każda funkcja wysokiego ryzyka powinna mieć krótki wpis w issue, MR albo dokumencie:

```md

## Security notes

### Assets
- dane użytkownika
- konfiguracja organizacji
- token integracji X

### Actors
- użytkownik bez logowania
- użytkownik z rolą Viewer
- użytkownik z rolą Admin w innym tenancie
- operator systemu
- zewnętrzny webhook provider

### Trust boundaries
- browser -> API
- API -> baza danych
- API -> zewnętrzny provider
- worker -> object storage

### What can go wrong
- użytkownik podmienia `organizationId` w request body
- webhook wysyła payload podpisany starym sekretem
- worker zapisuje wygenerowany plik pod ścieżką kontrolowaną przez użytkownika

### Controls
- tenant z sesji, nie z body
- weryfikacja podpisu webhooka
- canonicalizacja ścieżki i zapis tylko do przypisanego bucket/prefix

### Tests
- request z obcym `organizationId` zwraca 403
- webhook bez poprawnego podpisu zwraca 401
- upload z `../` w nazwie pliku jest odrzucony
```
## Klasyfikacja danych

Każdy projekt powinien mieć prostą klasyfikację danych.

### Public

Dane, które mogą być pokazane wszystkim bez logowania.

- publiczne strony marketingowe
- publiczna dokumentacja
- publiczne assety

Reguły:

- mogą być cache'owane publicznie
- nie wymagają autoryzacji
- nie mogą zawierać danych użytkownika, tenantów, tokenów ani konfiguracji

### Internal

Dane używane wewnątrz firmy albo aplikacji, ale bez wysokiej poufności.

- techniczne ID bez danych użytkownika
- metryki bez danych osobowych
- nazwy środowisk

Reguły:

- nie pokazuj ich publicznie bez potrzeby
- nie używaj ich jako sekretów
- nie zakładaj, że są bezpieczne tylko dlatego, że są „techniczne”

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

### Secret

Dane, które dają dostęp do systemów albo podpisują zaufanie.

- hasła
- refresh tokeny
- API keys
- OAuth client secrets
- prywatne klucze TLS/JWT
- connection stringi
- tokeny serwisowe
- seed phrases, signing keys, webhook secrets

Reguły:

- nigdy nie commituj do repozytorium
- nigdy nie zapisuj w logach
- trzymaj w systemie secrets management
- rotuj po incydencie, odejściu pracownika albo zmianie uprawnień
- przypisuj per środowisko i per usługa
- dawaj minimalne uprawnienia
