# infra-incident-debugging Reference Sector: Logi i cardinality

## Zawartość

- Logi i cardinality
- Edge case'y, które często powodują awarie

## Logi i cardinality

Grafana Loki zaleca ostrożność przy labelach, bo wysoka cardinality zwiększa koszt i pogarsza działanie systemu logów.[^loki-labels]

Zasady:

- labelami powinny być stabilne pola o małej cardinality: service, env, region, host, level
- nie używaj user id, request id, email, order id jako label
- dane wysokiej cardinality trzymaj w treści loga
- nie loguj sekretów, tokenów, haseł, pełnych payloadów i danych osobowych bez potrzeby
- loguj statusy deploymentów i migracji
- logi powinny pozwalać odtworzyć ścieżkę requestu przez proxy i backend
- ustaw retencję logów zależną od środowiska i wymagań audytu
## Edge case'y, które często powodują awarie

- obraz działa lokalnie, ale w Nomad brakuje CA certificates albo timezone data
- aplikacja zapisuje pliki w read-only filesystemie
- health check zależy od zewnętrznego API i wycina wszystkie repliki naraz
- readiness nigdy nie przechodzi na false podczas shutdownu
- proxy wysyła requesty do instancji w trakcie zamykania
- WebSocket działa lokalnie, ale proxy ma za krótki timeout
- SSE buforuje się w NGINX i klient nie dostaje eventów na żywo
- `X-Forwarded-Proto` jest błędny i aplikacja generuje linki HTTP zamiast HTTPS
- aplikacja ufa `X-Forwarded-For` od klienta i rate limiting da się obejść
- ACME rate limit blokuje wydanie certyfikatu po serii testów
- `acme.json` nie jest trwały i certyfikaty giną po restarcie proxy
- deployment zmienia kod i DB w jednym kroku bez kompatybilności wstecznej
- rollback kodu nie działa, bo schema DB została zmieniona nieodwracalnie
- pool DB pomnożony przez liczbę replik przekracza `max_connections`
- queue retry bez backoff zalewa zależność po awarii
- brak limitu kolejki powoduje OOM workera
- logi zapełniają dysk hosta
- Loki dostaje `user_id` jako label i eksploduje cardinality
- backup istnieje, ale restore trwa dłużej niż akceptowany RTO
- firewall pozwala na publiczny dostęp do bazy
- panel Traefik/NGINX/Nomad/Consul/Vault jest publiczny bez auth
- Nomad job ma zbyt ostre constraints i alokacje wiszą jako pending
- node drain zatrzymuje się na batch jobach albo stateful workloadach
- Nomad server quorum zostaje utracone przez prace na dwóch serwerach naraz
- Vault outage powoduje problemy z token renewal albo template rendering
- użyto static port dla wielu replik i tylko jedna alokacja może wystartować na danym node
