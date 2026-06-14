# infra-container-build-review Reference Sector: Overview

## Zawartość

- Overview
- Artefakty i wersjonowanie
- Budowanie obrazów Dockerowych
- Rozmiar obrazu i cache builda
- Bezpieczeństwo obrazu
- SBOM, provenance i supply chain


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
## Rozmiar obrazu i cache builda

Mniejszy obraz zwykle oznacza mniej zależności, mniejszy transfer i mniejszą powierzchnię ataku. Nie optymalizuj jednak rozmiaru kosztem diagnozy, bezpieczeństwa albo powtarzalności builda.

Sprawdzaj:

- które warstwy są największe
- czy finalny obraz zawiera pliki źródłowe
- czy finalny obraz zawiera cache package managerów
- czy finalny obraz zawiera testy, dokumentację, source mapy dla kodu prywatnego albo narzędzia buildowe
- czy `COPY` nie wciąga przypadkiem `.env`, sekretów, dumpów bazy i lokalnych plików
- czy obraz ma więcej niż jeden proces i czy jest to świadome

Narzędzia:

```bash
docker history image:tag
docker image inspect image:tag
dive image:tag
docker buildx build --call=check .
```

Docker Build Checks mogą walidować konfigurację builda w CI bez pełnego builda.[^docker-build-checks]
## Bezpieczeństwo obrazu

OWASP Docker Security Cheat Sheet opisuje kontenery jako dodatkową warstwę izolacji, która może zostać osłabiona przez błędną konfigurację.[^owasp-docker]

Checklist:

- uruchamiaj proces jako non-root
- nie ustawiaj `--privileged`
- nie montuj socketu Dockera do kontenera, jeśli nie jest to absolutnie konieczne
- nie montuj host path bez powodu
- ustawiaj read-only filesystem tam, gdzie aplikacja nie musi pisać do filesystemu
- dla katalogów wymagających zapisu używaj `tmpfs`, named volume albo jawnego mounta
- ogranicz capabilities przez `cap_drop: ["ALL"]` i dodawaj tylko potrzebne
- używaj `no-new-privileges`, seccomp, AppArmor albo SELinux, jeśli środowisko na to pozwala
- nie przechowuj sekretów w obrazie
- skanuj obrazy pod CVE
- rozdziel obrazy dev i prod, jeśli dev wymaga narzędzi debugowych
- usuwaj nieużywane pakiety systemowe
- aktualizuj obrazy bazowe w kontrolowanym procesie
- trzymaj listę akceptowanych wyjątków CVE z datą, powodem i właścicielem

Przykład Compose:

```yaml
services:
  api:
    image: registry.example.com/app/api:1.12.3
    user: "10001:10001"
    read_only: true
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    tmpfs:
      - /tmp
```

Przykład Nomad Docker task:

```hcl
task "api" {
  driver = "docker"

  config {
    image = "registry.example.com/app/api:1.12.3"
    ports = ["http"]
    readonly_rootfs = true
  }

  user = "10001:10001"

  resources {
    cpu    = 500
    memory = 512
  }
}
```
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
