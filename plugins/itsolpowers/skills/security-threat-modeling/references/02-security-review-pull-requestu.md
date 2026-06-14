# security-threat-modeling Reference Sector: Security review pull requestu

## Zawartość

- Security review pull requestu
- Integracja z innymi dokumentami zespołu
- Role i odpowiedzialności
- Checklist code review

## Security review pull requestu

Do każdego MR z wpływem na API, auth, dane, integracje albo infrastrukturę dopisz odpowiedzi:

```md

## Security review

### Czy zmiana dotyka danych poufnych?
Tak/Nie. Jeśli tak, jakich.

### Czy zmiana dodaje albo zmienia endpoint API?
Tak/Nie. Link do OpenAPI albo kontraktu.

### Jak działa autoryzacja?
Opis źródła roli, tenanta i ownership.

### Jakie testy negatywne dodano?
Lista testów.

### Czy zmiana wpływa na cache, live eventy albo dane po logout?
Opis.

### Czy zmiana dodaje zależność albo sekret?
Opis.

### Czy zmiana wymaga migracji albo zmiany infra?
Opis.

### Jakie abuse cases sprawdzono?
Lista.
```

### Dla zmian wysokiego ryzyka

- krótki threat model
- security review przez drugą osobę
- testy negatywne auth/authz
- testy edge case'ów QA
- aktualizacja OpenAPI i klienta
- aktualizacja logów/audytu
## Integracja z innymi dokumentami zespołu

Ten dokument powinien spinać pozostałe standardy:

- dokument Rust - reguły typów domenowych, błędów, SQLx, testów i unsafe
- dokument Svelte/React - XSS, cache, auth state, storage, formularze i obsługa błędów API
- dokument TanStack Query - query keys, invalidacja po mutacjach, czyszczenie cache po logout i live eventy
- dokument OpenAPI - kontrakt API, generated client, walidacja, typed errors i testy kontraktowe
- dokument live events - WebSocket/SSE, event envelope, deduplikacja, resync i tenant isolation
- dokument infrastruktury - TLS, routing, secrets, obrazy, Nomad, reverse proxy, observability i backupy
- dokument ML/LLM - prompt injection, tool permissions, RAG isolation, walidacja outputu i audyt akcji agentów

Przy projektowaniu funkcji zacznij od wymagań i threat modelu, potem przenieś decyzje do kontraktu API, implementacji backendu, frontendu, cache, live eventów, testów i konfiguracji deploymentu.
## Role i odpowiedzialności

### Product owner / analityk

- opisuje dane, które funkcja będzie czytać, zapisywać i ujawniać
- wskazuje role użytkowników i dozwolone operacje
- rozdziela wymagania biznesowe od założeń technicznych
- dopisuje abuse cases do kryteriów akceptacji
- nie akceptuje wymagania typu „admin może wszystko”, jeśli system ma ograniczenia tenantów, organizacji albo regionów

### Developer

- implementuje walidację wejścia, autoryzację, obsługę błędów i logowanie zdarzeń bezpieczeństwa
- nie zakłada, że frontend ukryje operacje niedozwolone
- dopisuje testy negatywne dla auth, authz, walidacji i limitów
- sprawdza wpływ zmiany na OpenAPI, migracje, cache, eventy, joby i integracje
- usuwa debug endpointy, mock credentials, przykładowe tokeny i tymczasowe obejścia przed merge

### Reviewer

- sprawdza, czy zmiana nie dodaje nowej powierzchni ataku
- szuka scenariuszy nadużyć, a nie tylko błędów w happy path
- weryfikuje autoryzację na poziomie obiektu, tenantów, ról i workflow
- sprawdza, czy błędy nie ujawniają danych technicznych albo danych użytkownika
- blokuje merge, jeśli kod polega wyłącznie na zabezpieczeniach frontendu

### QA

- testuje happy path, negative path i abuse path
- przygotowuje scenariusze z użytkownikiem bez roli, innym tenantem, wygasłą sesją, zmianą ID w requestach, ponownym wysłaniem akcji i równoległymi requestami
- sprawdza zachowanie aplikacji przy błędach API, timeoutach, braku sieci i częściowych awariach
- testuje, czy UI nie ujawnia danych po wylogowaniu, zmianie konta albo zmianie uprawnień
- raportuje podatność jako security issue, nie jako zwykły bug UI

### DevOps / platform

- zarządza sekretami, TLS, routingiem, izolacją sieci, skanowaniem obrazów i konfiguracją runtime
- utrzymuje pipeline z SAST, SCA, secret scanning, container scanning i SBOM
- kontroluje dostęp do środowisk, logów, baz i backupów
- dba o patching hostów, runtime, baz, reverse proxy i obrazów bazowych
- monitoruje alerty związane z auth, rate limitami, błędami 5xx, nietypowym ruchem i skanowaniem endpointów
## Checklist code review

### Auth i sesja

- czy endpoint wymaga auth, jeśli powinien
- czy token/sesja są walidowane po stronie backendu
- czy token ma expiry i poprawną walidację issuer/audience
- czy logout czyści stan klienta
- czy reset hasła i zaproszenia mają TTL i jednorazowość
- czy MFA jest wymagane dla kont o podwyższonych uprawnieniach

### Authz

- czy sprawdzany jest tenant/organization z zaufanego kontekstu
- czy sprawdzany jest ownership obiektu
- czy rola wystarcza do tej konkretnej operacji
- czy bulk action sprawdza każdy obiekt
- czy eksport ma osobne uprawnienie
- czy frontend nie jest jedyną warstwą blokującą operację

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

### Frontend

- czy cache jest czyszczony po logout i zmianie tenanta
- czy query keys zawierają parametry wpływające na dane
- czy UI obsługuje 401, 403, 404, 409, 429 i 5xx
- czy dane z API nie są renderowane jako HTML bez sanitizacji
- czy dane poufne nie trafiają do localStorage

### Integracje i joby

- czy webhook ma weryfikację podpisu
- czy retry jest idempotentny
- czy job ma limit prób
- czy job nie działa na danych, do których użytkownik stracił dostęp
- czy requesty wychodzące mają timeout i limit rozmiaru
- czy URL od użytkownika nie tworzy SSRF

### Infra i konfiguracja

- czy sekret nie jest w repo, obrazie, logach albo konfiguracji publicznej
- czy service account ma minimalne uprawnienia
- czy endpoint jest za TLS
- czy CORS jest ograniczony
- czy rate limit chroni endpointy kosztowne i auth
- czy obraz kontenera działa jako non-root, jeśli to możliwe
