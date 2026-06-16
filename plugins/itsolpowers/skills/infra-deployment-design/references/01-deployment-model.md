# Deployment Model

Ten plik jest wewnętrzną referencją skilla, wyciętą z `infrastructure-deployment-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj poniższej wiedzy bezpośrednio.

## Zakres

Projektowanie topologii i granic infrastruktury: warstwy, ścieżka requestu, single-host vs Nomad, TLS, service discovery, sekrety, rollback i podstawowe decyzje środowiskowe.

## Przeniesione sekcje

- Cel dokumentu
- Model warstw
- Decyzje przed uruchomieniem środowiska
- Wybór modelu uruchamiania

## Wiedza skilla

## Cel dokumentu

Ten dokument opisuje dobre praktyki uruchamiania aplikacji na produkcji i w środowiskach pośrednich. Obejmuje obrazy Dockerowe, runtime kontenerów, routing, reverse proxy, certyfikaty, load balancing, clustering, Nomad, service discovery, deployment, obserwowalność, bezpieczeństwo, backupy i disaster recovery.

Dokument jest niezależny od backendu i frontendu. Aplikacja może być napisana w Rust, TypeScript, Effect, .NET, Pythonie, React, Svelte albo innym stacku. Zasady infrastrukturalne powinny pozostać podobne: artefakt ma być powtarzalny, runtime przewidywalny, routing jawny, skalowanie mierzalne, a awarie możliwe do diagnozy.

Założenie dla większych wdrożeń: **Nomad jest domyślnym schedulerem multi-node**. Docker Compose zostaje jako wariant single-host lub małe środowiska. Kubernetes jest poza głównym zakresem tego dokumentu, ponieważ dla tego modelu operacyjnego jest traktowany jako overkill.

## Model warstw

Najpierw rozdziel odpowiedzialności. Problemy produkcyjne często wynikają z mieszania poziomów: aplikacja robi rzeczy, które powinien robić proxy, proxy przechowuje stan aplikacyjny, a deployment nie ma informacji o health checkach.

Typowy podział:

```text
Internet / CDN / DNS
        |
Edge load balancer / firewall / WAF
        |
Reverse proxy / ingress / API gateway
        |
Service discovery / internal load balancing
        |
Nomad clients / kontenery aplikacyjne
        |
Bazy danych / cache / kolejki / object storage
        |
Backup / monitoring / logi / tracing / alerting
```

Zasady:

- publicznie wystawiaj tylko warstwę edge
- aplikacje trzymaj w sieciach prywatnych
- certyfikaty kończ w kontrolowanym miejscu: edge proxy, reverse proxy albo dedykowany LB
- logika routingu powinna być jawna i wersjonowana
- aplikacja nie powinna zależeć od konkretnego hosta, jeśli ma się skalować horyzontalnie
- stan aplikacji trzymaj poza procesem: baza, Redis, object storage, queue, shared persistent storage tylko tam, gdzie jest uzasadniony
- każdy komponent powinien mieć health check, metryki, logi i opisany sposób restartu
- każdy publiczny endpoint powinien mieć właściciela, limit request body, timeouty i zasady rate limitingu
