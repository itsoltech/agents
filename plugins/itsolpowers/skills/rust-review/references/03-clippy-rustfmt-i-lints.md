# rust-review Reference Sector: Clippy, rustfmt i lints

## Zawartość

- Clippy, rustfmt i lints
- Konfiguracja i sekrety
- HTTP, API i warstwa zewnętrzna
- Kolejki, joby i retry
- Makra i kod generowany
- Minimalny zestaw kontroli w CI

## Clippy, rustfmt i lints

- kod musi przechodzić `cargo fmt --all -- --check`
- kod musi przechodzić `cargo clippy --workspace --all-targets --all-features -- -D warnings`
- jeśli features są wzajemnie wykluczające się, użyj macierzy CI zamiast `--all-features`
- nie używaj `#![allow(...)]` ani `#[allow(...)]` bez konkretnego powodu
- preferuj `#[expect(..., reason = "...")]`, jeśli oczekujesz konkretnego linta
- każde `allow` powinno mieć `reason = "..."`
- nie ustawiaj globalnego `#![allow(...)]` dla całego crate'a, jeśli problem dotyczy jednej funkcji
- nie włączaj całego `clippy::pedantic` na siłę; wybierz lints pasujące do projektu
- dla bibliotek rozważ `#![deny(missing_docs)]` albo przynajmniej dokumentację publicznego API
- nie ignoruj unused imports, unused variables i dead code
- formatuj zgodnie z `rustfmt`
- nie walcz z rustfmt przez ręczne układanie kodu

Przykład dopuszczalnego wyjątku:

```rust
#[expect(
    clippy::too_many_arguments,
    reason = "Funkcja mapuje pojedynczy rekord z warstwy DB. Argumenty odpowiadają kolumnom i są zawsze przekazywane razem."
)]
fn from_row(
    id: OrderId,
    tenant_id: TenantId,
    status: OrderStatus,
    total: Money,
    created_at: OffsetDateTime,
    updated_at: OffsetDateTime,
) -> Order {
    Order {
        id,
        tenant_id,
        status,
        total,
        created_at,
        updated_at,
    }
}
```
## Konfiguracja i sekrety

- konfigurację aplikacji trzymaj w jednym jawnie walidowanym typie
- nie czytaj zmiennych środowiskowych w losowych miejscach kodu
- waliduj konfigurację przy starcie procesu
- nie loguj sekretów, tokenów, haseł, connection stringów i pełnych nagłówków auth
- rozdziel konfigurację dev, test, staging i production
- ustawiaj timeouty klientów HTTP, DB i kolejek przez konfigurację
- nie używaj globalnego singletona konfiguracji, jeśli zależności można przekazać jawnie
- dla wartości z jednostkami używaj typów `Duration`, newtype albo nazw pól z jednostką, np. `timeout_ms`
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
## Makra i kod generowany

- makro powinno usuwać powtarzalny boilerplate, a nie ukrywać prostą logikę
- kod generowany przez makro powinien dać się obejrzeć przez `cargo expand`
- błędy makra powinny wskazywać konkretny fragment kodu użytkownika
- unikaj makr, jeśli zwykła funkcja, trait albo derive wystarcza
- przy procedural macros pisz testy kompilacji, np. `trybuild`
- dokumentuj składnię makra przykładami
- nie generuj publicznego API, którego użytkownik nie może łatwo odnaleźć w dokumentacji
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
