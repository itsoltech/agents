# infra-secrets-config Reference Sector: Overview

## Zawartość

- Overview
- Konfiguracja środowisk
- Nomad - konfiguracja i sekrety
- Nomad - template, Vault i workload identity
- Artefakty i wersjonowanie
- Budowanie obrazów Dockerowych
- SBOM, provenance i supply chain
- IaC, GitOps i drift
- CI/CD dla infrastruktury i obrazów


## Konfiguracja środowisk

Zasady:

- konfiguracja środowiska powinna być jawna i walidowana przy starcie
- nie czytaj envów w losowych miejscach kodu
- konfiguracja dev/staging/prod powinna mieć ten sam kształt
- różnice środowisk powinny być wartościami konfiguracji, nie różnymi obrazami
- sekrety nie mogą być commitowane do repo
- config generowany przez Nomad template powinien być zgodny z typem konfiguracji aplikacji
- zmiana konfiguracji powinna mieć opisany efekt: restart, reload, signal albo brak natychmiastowego efektu
- każdy endpoint zewnętrzny powinien mieć timeout i retry policy
## Nomad - konfiguracja i sekrety

Nomad Variables pozwalają przechowywać małe porcje konfiguracji i sekretów w stanie Nomad. Dokumentacja Nomad zaznacza, że Variables nie są przeznaczone dla dużych ani szybko zmieniających się danych i nie są pełnym zamiennikiem Vault.[^nomad-variables]

Zasady:

- sekrety produkcyjne trzymaj w Vault, jeśli wymagają rotacji, dynamicznych credentiali albo ścisłego modelu dostępu
- Nomad Variables stosuj dla małych konfiguracji i prostych sekretów workloadów
- nie zapisuj wyników batch jobs, dużych payloadów ani szybko zmieniającego się stanu w Nomad Variables
- dostęp do Variables ogranicz przez ACL i namespace
- nie przekazuj sekretów przez job spec w plaintext commitowany do repo
- nie loguj renderowanych template z sekretami
- jeśli sekret zmienia się w runtime, jawnie zdecyduj, czy task ma dostać restart, signal, script czy noop
- testuj rotację sekretu na stagingu
## Nomad - template, Vault i workload identity

Nomad `template` może renderować konfigurację do pliku albo env i reagować na zmianę przez `change_mode`: `noop`, `restart`, `signal` albo `script`.[^nomad-template] `vault` block pozwala taskowi otrzymać token Vault, a Nomad obsługuje odnowienie tokenu.[^nomad-vault] Workload Identity pozwala nadać workloadowi tożsamość używaną do dostępu do Nomad, Vault, Consul albo zewnętrznych OIDC integracji.[^nomad-workload-identity]

Zasady:

- konfigurację niesekretną i sekretną renderuj do oddzielnych plików, jeśli to ułatwia uprawnienia i audyt
- dla sekretów preferuj destination pod `secrets/`, nie `local/`
- `change_mode = "restart"` stosuj, jeśli aplikacja nie obsługuje reload konfiguracji
- `change_mode = "signal"` stosuj tylko, gdy aplikacja pewnie obsługuje dany sygnał
- `change_mode = "noop"` stosuj tylko, gdy zmiana nie musi wejść w życie w działającym procesie
- nie uruchamiaj `change_script`, jeśli prosty restart albo signal wystarczy
- Vault role/policies powinny dawać taskowi tylko potrzebne ścieżki
- unikaj współdzielonych tokenów Vault dla wielu usług
- przy awarii Vault sprawdź, jak zachowa się renew tokenów i template rendering

Przykład template:

```hcl
template {
  destination = "secrets/app.env"
  env         = true
  change_mode = "restart"

  data = <<EOT
DATABASE_URL={{ with secret "database/creds/api" }}postgres://{{ .Data.username }}:{{ .Data.password }}@db.service.consul:5432/app{{ end }}
EOT
}
```
## Artefakty i wersjonowanie

Artefaktem produkcyjnym powinien być obraz kontenera, paczka albo binarka. Zasada jest taka sama: raz zbudowany artefakt powinien przechodzić przez środowiska bez przebudowy.

Zasady:

- buduj artefakt raz, promuj go między środowiskami
- nie buduj innego obrazu osobno dla stagingu i produkcji, jeśli różni się tylko konfiguracja
- taguj obraz numerem wersji, SHA commita i opcjonalnie semverem
- nie wdrażaj na produkcję tagu `latest`
- przy krytycznych deploymentach używaj digestu obrazu, nie samego tagu
- przechowuj metadane obrazu: commit, branch, build time, wersja aplikacji, repozytorium
- nie zapisuj sekretów w obrazie, warstwach, etykietach, build args ani logach builda
- trzymaj osobno artefakt i konfigurację środowiska
- rollback powinien wskazywać konkretną wersję artefaktu, nie „poprzedni stan z pamięci”
- job spec powinien wskazywać konkretny tag albo digest obrazu
- wersja job speca powinna być powiązana z wersją aplikacji i migracji
## Budowanie obrazów Dockerowych

Docker zaleca multi-stage builds, ponieważ pozwalają oddzielić etap builda od minimalnego runtime i skopiować do finalnego obrazu tylko potrzebne pliki.[^docker-build-best-practices]

Zasady dla Dockerfile:

- używaj multi-stage builds
- finalny obraz powinien zawierać tylko runtime, binarkę/assets i pliki wymagane do działania
- nie instaluj kompilatorów, package managerów i narzędzi debugowych w finalnym runtime, jeśli nie są potrzebne
- używaj `.dockerignore`, żeby nie kopiować `node_modules`, `.git`, test fixtures, lokalnych envów i plików tymczasowych
- ustawiaj `WORKDIR`
- grupuj warstwy tak, aby cache działał stabilnie: najpierw manifesty zależności, potem install, potem kod
- unikaj `COPY . .` na początku Dockerfile
- dla Node/JS używaj lockfile i komend typu `npm ci`, `pnpm install --frozen-lockfile`, `yarn --immutable`
- dla Rust używaj cache dependency buildów, `cargo chef` albo BuildKit cache mount, jeśli build jest długi
- dla .NET używaj osobnych etapów restore, build, publish
- pinuj wersję obrazu bazowego przynajmniej do major/minor albo konkretnego wariantu dystrybucji
- przy wysokich wymaganiach powtarzalności pinuj obraz bazowy przez digest
- nie pobieraj skryptów przez `curl | sh` bez kontroli źródła, checksumy albo podpisu
- usuwaj cache package managera w tej samej warstwie, w której instalujesz pakiety
- nie używaj `ARG` do sekretów, ponieważ wartości build arguments mogą trafić do metadanych/provenance; używaj BuildKit secrets[^docker-build-secrets]
- używaj `--mount=type=cache` dla cache package managerów i kompilatorów, jeśli build działa w BuildKit
- używaj `--mount=type=secret` dla tokenów do prywatnych registry, GitHub Packages, npm, NuGet, Cargo registry
- rozważ multi-platform build `linux/amd64` i `linux/arm64`, jeśli środowiska produkcyjne mają różne architektury[^docker-multi-platform]

Przykład finalnego stage:

```dockerfile
FROM gcr.io/distroless/cc-debian12:nonroot
WORKDIR /app
COPY --from=builder /app/target/release/api /app/api
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/app/api"]
```

Nie każdy projekt powinien używać distroless. Jeśli potrzebujesz shella do diagnozy, CA bundle, timezone data, bibliotek systemowych albo dynamicznego debugowania, użyj minimalnego Debiana/Ubuntu/Alpine świadomie. Wybór obrazu bazowego powinien wynikać z wymagań runtime i sposobu utrzymania.
## SBOM, provenance i supply chain

SBOM opisuje skład obrazu, a provenance opisuje sposób zbudowania artefaktu. Docker BuildKit i oficjalne akcje Docker wspierają generowanie SBOM i provenance attestation.[^docker-attestations]

Zasady:

- generuj SBOM dla obrazów produkcyjnych
- generuj provenance dla buildów produkcyjnych
- nie przekazuj sekretów przez build args, bo mogą trafić do metadanych attestation[^docker-attestations]
- podpisuj obrazy albo używaj mechanizmu attestation wspieranego przez platformę CI/CD
- ustaw minimalne uprawnienia w pipeline: `contents: read`, `packages: write`, `id-token: write` tylko tam, gdzie potrzebne
- ogranicz kto może wypychać tagi produkcyjne
- oddziel build od promotion
- production deploy powinien pobierać obraz z registry, nie budować go lokalnie na serwerze
- trzymaj politykę CVE: co blokuje release, co wymaga wyjątku, co może poczekać
## IaC, GitOps i drift

Terraform state przechowuje mapowanie zasobów i może zawierać dane wrażliwe, dlatego wymaga kontrolowanego backendu, blokady i kontroli dostępu.[^terraform-state][^terraform-locking]

Zasady:

- infrastruktura powinna być opisana w repozytorium
- zmiany infrastruktury powinny przechodzić review
- state Terraform trzymaj w zdalnym backendzie z lockingiem
- ogranicz dostęp do state
- nie edytuj zasobów ręcznie bez późniejszego odtworzenia zmiany w IaC
- wykrywaj drift
- secrets nie powinny trafiać do state, jeśli da się tego uniknąć
- job specs Nomad traktuj jak kod infrastruktury
- `nomad job plan` powinien być częścią pipeline przed `nomad job run`
- dla środowisk trzymaj parametry jako zmienne, ale nie ukrywaj logiki w zbyt dużej liczbie template'ów
## CI/CD dla infrastruktury i obrazów

Pipeline powinien oddzielać build, test, scan, publish i deploy.

Minimalny pipeline:

```text
lint/test aplikacji
build obrazu
scan obrazu
SBOM/provenance
push do registry
nomad job plan na staging
deploy staging
smoke test przez proxy
manual approval albo policy gate
nomad job plan production
deploy production
metryki po deployu
```

Zasady:

- CI buduje obraz, produkcja go tylko pobiera
- deployment używa konkretnego tagu albo digestu
- deploy produkcji wymaga uprawnień innych niż build PR
- pipeline nie powinien mieć globalnego admin tokena Nomad
- secrets pipeline powinny mieć minimalne scope
- wynik `nomad job plan` powinien być widoczny w review/release
- rollback powinien być jednym znanym procesem
- smoke test powinien przechodzić przez realny routing, TLS i proxy
- migracje danych powinny mieć osobny krok albo jawny etap deploymentu
