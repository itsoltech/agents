# security-supply-chain-review Reference

Ten plik jest wewnętrzną referencją skilla, wyciętą z `application-security-sdlc-qa-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj poniższej wiedzy bezpośrednio.

## Zakres

Review zależności, lockfile, artefaktów, CI/CD, kontenerów, SBOM/provenance, SCA/SAST i release gates.

## Przeniesione sekcje

- Przykładowe narzędzia
- Zależności i łańcuch dostaw
- CI/CD
- Wykrywanie podatności we własnej aplikacji / Automatyczne kontrole w repozytorium
- Minimalne bramki procesu / Dla każdego release
- Procedura release bezpieczeństwa
- Przykładowe narzędzia / Repozytorium i kod
- Przykładowe narzędzia / Kontenery i supply chain
- Checklist code review / Infra i konfiguracja

## Wiedza skilla

## Zależności i łańcuch dostaw

- zależności dodawaj świadomie, z przeglądem maintenance, licencji, liczby transitive dependencies i historii podatności
- używaj SCA w CI, np. Dependabot, Renovate, cargo-audit, npm audit, pnpm audit, OSV Scanner, Snyk, Trivy albo Grype
- generuj SBOM dla aplikacji i obrazów kontenerowych
- przechowuj SBOM jako artefakt release
- monitoruj podatności po release, nie tylko w momencie builda
- używaj lockfile i nie ignoruj zmian w lockfile podczas review
- aktualizacje security dependency traktuj jako pilniejsze niż zwykły refactor
- skanuj obrazy kontenerowe, także base image
- pinuj obrazy bazowe przez digest dla produkcyjnych artefaktów, jeśli proces release wymaga powtarzalności
- nie instaluj narzędzi buildowych w finalnym obrazie runtime bez powodu
- używaj podpisywania artefaktów, provenance i zasad SLSA tam, gdzie proces dojrzał do tego poziomu
- sprawdzaj repozytoria open source przez OpenSSF Scorecard albo podobne narzędzia przed wprowadzeniem zależności wysokiego ryzyka

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

### Automatyczne kontrole w repozytorium

- SAST: CodeQL, Semgrep, Sonar albo równoważne narzędzie
- SCA: Dependabot, Renovate, cargo-audit, pnpm audit, npm audit, OSV Scanner, Trivy, Grype
- secret scanning: GitHub secret scanning, Gitleaks, TruffleHog albo równoważne narzędzie
- lint reguł bezpieczeństwa: ESLint security plugins, Clippy, cargo-deny, framework-specific linty
- IaC scanning: Checkov, tfsec, Terrascan albo skanery registry/orchestratora
- container scanning: Trivy, Grype, Docker Scout albo skaner registry
- SBOM: CycloneDX, SPDX, Syft, cargo-cyclonedx, npm/pnpm SBOM tooling

### Dla każdego release

- DAST na środowisku testowym albo staging
- skan obrazów
- SBOM
- lista podatności otwartych z severity
- potwierdzony rollback albo forward fix
- potwierdzenie, że nie ma sekretów w logach i artefaktach

## Procedura release bezpieczeństwa

Przed release sprawdź:

- brak podatności Critical/High bez zaakceptowanego wyjątku
- skany SAST/SCA/secret/container zakończone
- SBOM wygenerowany i zapisany jako artefakt
- zależności zaktualizowane albo ryzyka zaakceptowane
- migracje DB sprawdzone pod rolling deployment
- testy auth/authz/API przeszły
- testy DAST dla publicznych endpointów przeszły albo mają opisane wyjątki
- nagłówki bezpieczeństwa i TLS sprawdzone na środowisku release candidate
- logi nie zawierają sekretów i danych wrażliwych
- rollback albo forward fix jest opisany
- alerty i dashboardy dla nowej funkcji są gotowe, jeśli funkcja ma ryzyko operacyjne

### Repozytorium i kod

- GitHub Advanced Security / CodeQL
- Semgrep
- SonarQube / SonarCloud
- Gitleaks
- TruffleHog
- GitHub secret scanning i push protection
- cargo-audit, cargo-deny
- npm audit, pnpm audit, OSV Scanner

### Kontenery i supply chain

- Trivy
- Grype
- Syft
- Docker Scout
- OWASP Dependency-Track
- SLSA provenance tooling
- cosign

### Infra i konfiguracja

- czy sekret nie jest w repo, obrazie, logach albo konfiguracji publicznej
- czy service account ma minimalne uprawnienia
- czy endpoint jest za TLS
- czy CORS jest ograniczony
- czy rate limit chroni endpointy kosztowne i auth
- czy obraz kontenera działa jako non-root, jeśli to możliwe

## Przykładowe narzędzia

### Repozytorium i kod

- GitHub Advanced Security / CodeQL
- Semgrep
- SonarQube / SonarCloud
- Gitleaks
- TruffleHog
- GitHub secret scanning i push protection
- cargo-audit, cargo-deny
- npm audit, pnpm audit, OSV Scanner

### API i DAST

- OWASP ZAP
- Burp Suite
- Schemathesis
- Postman/Newman z testami negatywnymi
- k6 dla rate limitów i prostych testów obciążeniowych

### Kontenery i supply chain

- Trivy
- Grype
- Syft
- Docker Scout
- OWASP Dependency-Track
- SLSA provenance tooling
- cosign

### IaC i konfiguracja

- Checkov
- tfsec
- Terrascan
- kube-score/kube-linter, jeśli projekt używa Kubernetes
- skanery konfiguracji chmury albo registry
