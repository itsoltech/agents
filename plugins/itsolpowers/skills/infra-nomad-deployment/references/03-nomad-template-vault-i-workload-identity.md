# infra-nomad-deployment Reference Sector: Nomad - template, Vault i workload identity

## Zawartość

- Nomad - template, Vault i workload identity
- Nomad - lifecycle tasks i sidecary
- Nomad - storage i stateful workloads
- Nomad - namespaces, ACL i dostęp operatorski
- Nomad - monitoring i diagnostyka
- Nomad - autoscaling

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
## Nomad - lifecycle tasks i sidecary

Nomad `lifecycle` pozwala uruchamiać taski `prestart`, `poststart` i `poststop`; może to być task jednorazowy albo sidecar działający razem z main taskiem.[^nomad-lifecycle]

Zasady:

- używaj `prestart` dla krótkiego przygotowania środowiska, nie dla długiego procesu biznesowego
- nie używaj `prestart` jako obejścia braku retry/backpressure w aplikacji
- `poststart` sidecar ma sens dla proxy, log shippera albo lokalnego agenta
- `poststop` ma sens dla krótkiego cleanupu albo notyfikacji, ale nie może być jedynym miejscem zapisu krytycznych danych
- sidecar zwiększa coupling tasków w group; nie dodawaj go bez powodu
- awaria sidecara może wpływać na całą alokację
- jeśli task czeka na zależność, lepiej rozwiązać retry w aplikacji niż blokować start w nieskończoność
## Nomad - storage i stateful workloads

Stateful workloads w Nomad są możliwe, ale wymagają osobnej decyzji o volumes, backupach, placement i procedurach awaryjnych. Nomad obsługuje między innymi host volumes i CSI volumes.[^nomad-volume][^nomad-csi-volume]

Zasady:

- stateless API i frontend trzymaj bez lokalnego trwałego stanu
- dla uploadów i plików użytkownika preferuj object storage
- dla bazy danych używaj dedykowanego hosta/usługi, chyba że zespół świadomie utrzymuje stateful workload w Nomad
- jeśli task używa host volume, placement jest związany z nodem albo klasą nodów
- backup volume musi być zaplanowany poza Nomad job specem
- restore volume musi być testowany
- dynamic host volume names nie są sekretem; dokumentacja Nomad zaznacza, że nazwy są widoczne dla użytkowników z `node:read` ACL[^nomad-host-volume]
- przy CSI sprawdź zachowanie pluginu podczas node drain i restartu
- nie zakładaj, że reschedule stateful workloadu będzie tak prosty jak stateless API
## Nomad - namespaces, ACL i dostęp operatorski

Nomad namespaces segmentują jobs i obiekty pochodne, takie jak allocations, deployments i evaluations.[^nomad-namespaces] ACL policy może ograniczać dostęp do namespaces, node pools, variables i innych zasobów.[^nomad-acl-policy]

Zasady:

- oddzielaj środowiska przez namespaces albo osobne klastry, ale nie mieszaj produkcji i dev bez zasad
- używaj minimalnych ACL dla CI/CD
- token CI powinien móc deployować tylko swoje namespace/job patterns
- dostęp do `alloc exec` traktuj jak dostęp produkcyjny do procesu
- ogranicz kto może drainować nody, zmieniać eligibility i czytać variables
- nie używaj jednego admin tokena w automatyzacjach
- rotuj tokeny i usuwaj tokeny po odejściu osób/projektów
- Nomad UI wystawiaj tylko przez VPN, allowlistę albo wewnętrzną sieć
- audituj job changes i operator actions
## Nomad - monitoring i diagnostyka

Nomad emituje metryki serwerów, klientów i alokacji. Dokumentacja wskazuje, że część metryk lidera pojawia się tylko na aktualnym leaderze, a metryki hosta i alokacji na klientach wymagają jawnego włączenia.[^nomad-monitor][^nomad-metrics]

Monitoruj:

- leader changes
- Raft peers i quorum
- pending evaluations
- failed allocations
- restarts i reschedules
- deployment failures
- node readiness
- client CPU/memory/disk pressure
- allocation CPU/memory
- liczba allocs per node
- długość drainów
- błędy service registration
- błędy template rendering i Vault renewal

Komendy diagnostyczne:

```bash
nomad server members
nomad node status
nomad job status <job>
nomad job plan job.nomad.hcl
nomad deployment status <deployment-id>
nomad alloc status <alloc-id>
nomad alloc logs -stderr <alloc-id>
nomad alloc exec -task <task> <alloc-id> /bin/sh
nomad operator raft list-peers
```

Zasady:

- alertuj na brak quorum i częste leader elections
- alertuj na pending allocations przez dłuższy czas
- alertuj na failed deployments
- alertuj na restart loops
- nie opieraj monitoringu tylko o stan reverse proxy
- metryki aplikacji muszą być widoczne obok metryk Nomad
- logi alokacji powinny być centralnie zbierane
- logi Nomad server i client powinny być zbierane osobno od logów aplikacji
## Nomad - autoscaling

Nomad Autoscaler może skalować task group albo klaster na podstawie metryk. Dokumentacja opisuje go jako horizontal application i cluster autoscaler; scaling policies definiują target, strategie i źródła metryk.[^nomad-autoscaler][^nomad-autoscaler-policy]

Zasady:

- skaluj po metryce powiązanej z bottleneckiem
- CPU jest dobre dla usług CPU-bound
- dla API często lepsze są latency, request rate, inflight requests albo queue depth
- dla workerów często lepsza jest długość kolejki i czas oczekiwania joba
- autoscaling nie zastępuje limitów, backpressure i rate limitingu
- ustaw `min` i `max`, żeby uniknąć zejścia do zera albo niekontrolowanego kosztu
- dodaj cooldown/stabilization window, żeby uniknąć flappingu
- testuj scale up i scale down na stagingu
- scaling aplikacji bez capacity bazy/cache może tylko przesunąć problem
- przed cluster autoscalingiem upewnij się, że node drain działa poprawnie

Przykład scaling block:

```hcl
scaling {
  min     = 2
  max     = 10
  enabled = true
}
```
