# Secrets Config And CI

Ten plik jest wewnętrzną referencją skilla, wyciętą z `application-security-sdlc-qa-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj poniższej wiedzy bezpośrednio.

## Zakres

Review sekretów i konfiguracji: secret data, env/config, CI secrets, log leakage, rotacja, skanowanie sekretów i IaC/config.

## Przeniesione sekcje

- Klasyfikacja danych / Secret
- Sekrety i konfiguracja
- Logowanie, audyt i monitoring bezpieczeństwa
- CI/CD
- Checklist code review / Infra i konfiguracja
- Przykładowe narzędzia / Repozytorium i kod
- Przykładowe narzędzia / IaC i konfiguracja
- Procedura po wykryciu podatności

## Wiedza skilla

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

## Sekrety i konfiguracja

- sekrety trzymaj poza repozytorium
- sekrety trzymaj poza obrazem kontenera
- używaj secrets managera albo zmiennych dostarczanych przez orchestrator, jeśli środowisko to wspiera
- nie przekazuj sekretów przez argumenty procesu, bo mogą być widoczne w listach procesów
- nie loguj konfiguracji w całości przy starcie aplikacji
- konfiguracja publiczna frontendu nie może zawierać sekretów
- dla każdego środowiska używaj osobnych sekretów
- dla każdej usługi używaj osobnych credentiali
- credentiale powinny mieć minimalne uprawnienia
- rotacja sekretu powinna być przećwiczona przed incydentem
- po wykryciu sekretu w repo usuń go z historii tylko jako działanie porządkowe; najpierw unieważnij i wymień sekret
- dostęp do sekretów powinien być audytowany

## CI/CD

- pipeline powinien blokować merge przy błędach formatowania, testów, SAST, SCA, secret scanning i krytycznych podatnościach
- branch protection powinien wymagać review i zielonego CI
- CODEOWNERS powinien wskazywać właścicieli modułów auth, billing, integracji, infra i danych wrażliwych
- pipeline nie powinien ujawniać sekretów w logach
- sekrety CI powinny mieć minimalne uprawnienia i osobne wartości per repo/projekt
- joby CI uruchamiane dla forków nie powinny mieć dostępu do sekretów produkcyjnych
- build release powinien być powtarzalny
- artefakty release powinny być wersjonowane i możliwe do powiązania z commitem
- deployment powinien mieć możliwość rollbacku albo forward fix z jasnym planem
- migracje DB muszą być zgodne z rolling deployment, jeśli system działa bez przerwy
- każda zmiana infra powinna przejść review tak jak kod aplikacji

### Infra i konfiguracja

- czy sekret nie jest w repo, obrazie, logach albo konfiguracji publicznej
- czy service account ma minimalne uprawnienia
- czy endpoint jest za TLS
- czy CORS jest ograniczony
- czy rate limit chroni endpointy kosztowne i auth
- czy obraz kontenera działa jako non-root, jeśli to możliwe

### Repozytorium i kod

- GitHub Advanced Security / CodeQL
- Semgrep
- SonarQube / SonarCloud
- Gitleaks
- TruffleHog
- GitHub secret scanning i push protection
- cargo-audit, cargo-deny
- npm audit, pnpm audit, OSV Scanner

### IaC i konfiguracja

- Checkov
- tfsec
- Terrascan
- kube-score/kube-linter, jeśli projekt używa Kubernetes
- skanery konfiguracji chmury albo registry
