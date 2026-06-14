# infra-container-runtime-review Reference Sector: Overview

## Zawartość

- Overview
- Runtime kontenerów
- Health checks
- Docker Compose na produkcji
- Bezpieczeństwo obrazu


## Runtime kontenerów

Kontener produkcyjny powinien mieć opisane zasoby, healthcheck, politykę restartu, logi, sekrety i sposób shutdownu.

Checklist:

- ustaw politykę restartu na poziomie schedulera, nie tylko w aplikacji
- ustaw limity pamięci i CPU tam, gdzie runtime je obsługuje
- ustaw healthcheck kontenera albo health check na poziomie orchestratora
- nie zapisuj trwałych danych w ephemeral filesystemie kontenera
- loguj na stdout/stderr
- nie rotuj logów wewnątrz aplikacji, jeśli log collector zbiera stdout/stderr
- jeśli kontener pisze pliki tymczasowe, określ katalog i limit
- obsługuj `SIGTERM`
- zamykaj HTTP server, worker, kolejki i pool DB w czasie graceful shutdown
- `ENTRYPOINT` powinien uruchamiać proces aplikacji jako PID 1 albo przez init typu `tini`
- nie używaj `tail -f /dev/null` jako sposobu utrzymania kontenera przy życiu
- jeden kontener powinien zwykle uruchamiać jeden główny proces
## Health checks

Health check nie powinien być przypadkowym endpointem. Musi mieć konkretną semantykę.

Podział:

- `startup` - aplikacja zakończyła inicjalizację
- `liveness` - proces nie jest martwy i może zostać zrestartowany, jeśli nie odpowiada
- `readiness` - aplikacja może przyjmować ruch
- `dependency` - stan połączenia z bazą, cache, kolejką, usługą zewnętrzną

Zasady:

- readiness może zależeć od lokalnej gotowości aplikacji i minimalnych zależności
- liveness nie powinien padać tylko dlatego, że baza miała chwilową awarię
- health check nie powinien wykonywać ciężkich zapytań do bazy
- health check nie powinien wymagać autoryzacji, ale endpoint powinien być ograniczony sieciowo albo zwracać tylko stan techniczny
- health check powinien mieć timeout krótszy niż timeout proxy
- health check powinien wykrywać deadlocki runtime, zapełnienie kolejki, brak gotowości workerów albo brak możliwości obsługi requestów, jeśli te stany są krytyczne
- endpoint readiness powinien przejść na failure podczas graceful shutdown, zanim proces zamknie połączenia
- w Nomad service check traktuj jako informację dla service discovery i deployment health, nie jako pełny test biznesowy
## Docker Compose na produkcji

Docker Compose może być dobrym wyborem dla małych i średnich instalacji single-host albo prostych środowisk wewnętrznych. Nie zastępuje jednak schedulera multi-node.

Compose jest sensowny, gdy:

- masz jeden serwer albo prosty układ active/passive
- liczba usług jest mała
- deployment robi jeden zespół
- nie potrzebujesz automatycznego placementu między hostami
- awaria hosta jest obsługiwana przez restore albo manualny failover

Compose przestaje wystarczać, gdy:

- masz wiele hostów i wiele kopii usług
- chcesz robić node drain, rolling deploy i reschedule
- wiele zespołów deployuje niezależnie
- potrzebujesz service discovery między hostami
- ruch wymaga canary, traffic split albo regionów

Checklist Compose:

- wersjonuj `compose.yml`
- oddziel `compose.override.yml` dla dev od pliku produkcyjnego
- nie używaj bind mountów kodu w produkcji
- używaj named volumes dla danych trwałych
- trzymaj sekrety jako secrets albo pliki dostarczone przez bezpieczny mechanizm; Docker Compose montuje secrets jako pliki w `/run/secrets/<name>` i nadaje dostęp per service[^docker-compose-secrets]
- publikuj tylko porty reverse proxy
- usługi aplikacyjne trzymaj na prywatnej sieci Dockera
- ustaw healthchecki
- ustaw politykę restartu
- ustaw log rotation w Docker daemon albo driverze logów
- backupuj volumes przed zmianami schematu danych
- testuj `docker compose pull && docker compose up -d` na stagingu
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
