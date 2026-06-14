# rust-debugging Reference Sector: HTTP, API i warstwa zewnętrzna

## Zawartość

- HTTP, API i warstwa zewnętrzna
- Kolejki, joby i retry
- Minimalny zestaw kontroli w CI

## HTTP, API i warstwa zewnętrzna

- waliduj dane wejściowe na granicy systemu
- nie przepuszczaj DTO HTTP bezpośrednio do domeny, jeśli wymagają walidacji albo mapowania
- mapuj błędy domenowe na statusy HTTP w jednym miejscu
- nie ujawniaj wewnętrznych błędów DB użytkownikowi API
- dodawaj timeouty na requesty wychodzące
- ograniczaj rozmiar body requestu
- nie buforuj całych uploadów w pamięci, jeśli mogą być duże
- dla endpointów listujących dane stosuj paginację
- dla endpointów modyfikujących dane stosuj idempotency key, jeśli retry może wykonać operację dwa razy
- request id powinien przechodzić przez logi i tracing
- nie rób blokującego I/O w handlerze async
## Kolejki, joby i retry

- każdy job powinien mieć ID, status, liczbę prób i ostatni błąd
- job powinien być idempotentny albo mieć mechanizm deduplikacji
- retry powinien mieć limit i backoff
- nie retryuj błędów trwałych tak samo jak błędów chwilowych
- długie joby powinny mieć heartbeat albo inny mechanizm wykrywania martwego workera
- worker powinien obsługiwać graceful shutdown
- nie pobieraj nieograniczonej liczby jobów naraz
- zapisuj postęp przy długich operacjach, jeśli ponowne wykonanie od zera jest kosztowne
- nie trzymaj transakcji DB otwartej przez cały długi job
- przy wielu workerach używaj locków DB, lease, advisory lock albo `FOR UPDATE SKIP LOCKED`
## Minimalny zestaw kontroli w CI

Podstawowy zestaw:

```bash
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --all-features -- -D warnings
cargo test --workspace --all-features
cargo doc --workspace --all-features --no-deps
cargo tree -d
cargo deny check
cargo audit
```

Dla projektów z SQLx:

```bash
cargo sqlx prepare --check --workspace
```

Dla projektów z większą liczbą testów:

```bash
cargo nextest run --workspace --all-features
```

Dla projektów z coverage:

```bash
cargo llvm-cov --workspace --all-features --lcov --output-path lcov.info
```

Dla projektów z feature matrix:

```bash
cargo hack check --workspace --feature-powerset --no-dev-deps
```
