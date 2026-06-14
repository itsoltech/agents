# infra-backup-dr Reference

Ten plik jest wewnętrzną referencją skilla, wyciętą z `infrastructure-deployment-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj poniższej wiedzy bezpośrednio.

## Zakres

Review backup/restore i disaster recovery: RPO/RTO, test restore, DB/cache/queue/object storage, stateful workloads, storage, multi-region i procedury odtworzenia.

## Przeniesione sekcje

- Bazy danych, cache i kolejki
- Storage i pliki
- Nomad - storage i stateful workloads
- Backup, restore i disaster recovery
- Multi-region i geografia
- Checklist do review infrastruktury

## Wiedza skilla

## Bazy danych, cache i kolejki

Aplikacje można skalować horyzontalnie tylko do momentu, w którym nie wyczerpią wspólnych zależności.

Zasady DB:

- baza nie powinna być publicznie dostępna z internetu
- migracje uruchamiaj w kontrolowanym miejscu, nie równolegle z każdej repliki aplikacji
- pool połączeń musi być dobrany do liczby replik i limitu DB
- maksymalna liczba połączeń aplikacji nie może przekraczać możliwości bazy
- read replica nie rozwiązuje problemów z transakcjami zapisującymi
- backup i restore są częścią wdrożenia, nie dodatkiem
- monitoruj slow queries, locki, deadlocki, replication lag, connection count, disk usage

Zasady cache:

- cache musi mieć TTL albo limit rozmiaru
- cache invalidation powinno być opisane
- Redis używany jako session store wymaga backup/HA zgodnie z wymaganiami sesji
- nie traktuj cache jako trwałego storage, jeśli nie ma procesu odtworzenia

Zasady kolejek:

- worker musi obsługiwać retry, backoff i dead-letter queue
- job powinien być idempotentny albo mieć deduplikację
- kolejka musi mieć monitoring depth, age of oldest message, retry count i failure rate
- worker powinien reagować na shutdown i kończyć albo bezpiecznie przerywać job
- nie pobieraj z kolejki więcej pracy, niż proces może obsłużyć przed shutdownem

## Storage i pliki

Trwałe pliki w kontenerach są częstym źródłem problemów przy skalowaniu.

Zasady:

- uploady użytkowników trzymaj w object storage albo dedykowanym storage, nie w lokalnym filesystemie kontenera
- lokalny dysk kontenera traktuj jako ephemeral
- pliki tymczasowe zapisuj do kontrolowanego katalogu z limitem
- nie zakładaj, że kolejny request użytkownika trafi na tę samą instancję
- jeśli wymagany jest shared filesystem, opisz consistency model, backup i performance
- backupuj dane, nie kontenery
- sprawdzaj restore, a nie tylko obecność plików backupu

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

## Backup, restore i disaster recovery

Backup bez testu restore jest tylko przypuszczeniem.

Zasady:

- definiuj RPO i RTO dla każdego systemu danych
- backupuj bazy danych, object storage, volumes, konfigurację proxy, certyfikaty, IaC state, Nomad/Consul/Vault zgodnie z procedurą
- backup trzymaj poza serwerem produkcyjnym
- szyfruj backupy
- monitoruj sukces backupu i wiek ostatniego backupu
- testuj restore okresowo
- dokumentuj restore krok po kroku
- sprawdzaj czas restore względem RTO
- testuj odtworzenie na czystym środowisku
- backup przed migracją schematu powinien mieć opisany sposób użycia
- snapshot VM nie zastępuje backupu logicznego bazy

## Multi-region i geografia

Multi-region zwiększa złożoność. Nie wprowadzaj go bez konkretnego wymagania RTO/latency/compliance.

Zasady:

- określ, czy regiony działają active-active, active-passive czy cold standby
- ustal źródło prawdy dla danych
- rozwiąż konflikty zapisu przed uruchomieniem active-active
- DNS failover powinien być testowany
- certyfikaty i sekrety muszą istnieć w każdym regionie albo być odtwarzalne
- monitoring powinien odróżniać awarię regionu od awarii usługi
- Nomad federation ma własne pojęcie authoritative region dla wybranych obiektów; dokumentacja opisuje replikację ACL policies, roles, namespaces, node pools, quota specifications i Sentinel policies z authoritative region[^nomad-federation]

## Checklist do review infrastruktury

### Artefakty

- czy obraz jest budowany przez CI?
- czy obraz ma wersję, SHA i metadane?
- czy produkcja używa konkretnego tagu albo digestu?
- czy finalny obraz nie zawiera narzędzi buildowych?
- czy sekrety nie trafiają do obrazu ani build args?
- czy obraz jest skanowany?
- czy jest SBOM/provenance dla produkcji?

### Runtime

- czy proces działa jako non-root?
- czy kontener ma ograniczone capabilities?
- czy filesystem może być read-only?
- czy są limity CPU/RAM?
- czy healthcheck ma poprawną semantykę?
- czy aplikacja obsługuje SIGTERM?
- czy logi idą na stdout/stderr?

### Nomad

- czy job spec jest w repo?
- czy `type` joba pasuje do workloadu?
- czy job ma jawne `datacenters`, `namespace` i `node_pool`, jeśli są używane?
- czy każdy task ma `resources`?
- czy service job ma `update`, `restart`, `reschedule` i `migrate`?
- czy service registration ma health check?
- czy porty są nazwane?
- czy nie użyto static port bez powodu?
- czy constraints/affinity/spread nie blokują placementu?
- czy deployment ma rollback albo `auto_revert`?
- czy CI wykonuje `nomad job plan`?
- czy node drain został przetestowany?
- czy pending allocations są monitorowane?
- czy restarty i failed deployments są alertowane?

### Routing

- czy publicznie wystawiony jest tylko reverse proxy/LB?
- czy routing jest jawny i wersjonowany?
- czy każdy host ma TLS?
- czy HTTP przekierowuje do HTTPS?
- czy dashboardy admin są zabezpieczone?
- czy `X-Forwarded-*` są poprawnie ustawione?
- czy aplikacja ma skonfigurowane trusted proxies?
- czy WebSocket/SSE mają właściwe timeouty?

### Load balancing

- czy backendy są wycinane z rotacji po failed readiness?
- czy connection draining działa?
- czy retry nie powtarza nieidempotentnych operacji?
- czy sticky sessions są świadome i przetestowane?
- czy long-lived connections są uwzględnione w deployu?

### Dane

- czy baza nie jest publiczna?
- czy migracje są kompatybilne wstecznie?
- czy pool DB uwzględnia liczbę replik?
- czy backup jest automatyczny?
- czy restore był testowany?
- czy cache ma TTL albo limit?
- czy kolejki mają retry, backoff i DLQ?

### Sekrety

- czy sekrety nie są w obrazie ani repo?
- czy Vault/Nomad Variables mają minimalne ACL?
- czy rotacja sekretu była testowana?
- czy template ma opisany `change_mode`?
- czy logi nie zawierają sekretów?

### Observability

- czy są logi, metryki i trace'y?
- czy request id przechodzi przez proxy i aplikację?
- czy dashboard pokazuje aplikację i Nomad razem?
- czy alerty mają ownera i runbook?
- czy są alerty na certyfikaty, backup, dysk, Nomad quorum i failed deployments?

### Bezpieczeństwo

- czy host firewall blokuje wszystko poza wymaganymi portami?
- czy SSH jest ograniczone?
- czy Docker socket nie jest montowany do kontenerów?
- czy panele admin nie są publiczne?
- czy CVE są skanowane i mają politykę wyjątków?
- czy uprawnienia CI/CD są minimalne?

### Deployment

- czy rollback jest opisany i przetestowany?
- czy staging odpowiada produkcyjnemu routingowi?
- czy smoke test przechodzi przez realny proxy?
- czy release może być zatrzymany po metrykach?
- czy migracje danych są oddzielone od dużych zmian kodu?
- czy feature flags mają właściciela i termin usunięcia?
