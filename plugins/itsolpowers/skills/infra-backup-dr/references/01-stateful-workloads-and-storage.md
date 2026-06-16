# Stateful Workloads And Storage

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
