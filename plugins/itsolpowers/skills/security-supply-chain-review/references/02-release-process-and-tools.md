# Release Process And Tools

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
