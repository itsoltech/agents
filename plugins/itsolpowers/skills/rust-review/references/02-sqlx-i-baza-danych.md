# rust-review Reference Sector: SQLx i baza danych

## Zawartość

- SQLx i baza danych
- Serde, JSON i DTO
- Logowanie, tracing i diagnostyka
- Organizacja kodu
- Czytelność i utrzymywalność
- Testy
- Testy wydajnościowe i profilowanie
- Zależności i Cargo

## SQLx i baza danych

- używaj `sqlx::query!()`, `sqlx::query_as!()`, `sqlx::query_scalar!()` dla statycznych zapytań SQL
- compile-time verification wymaga `DATABASE_URL` podczas kompilacji albo przygotowanego katalogu `.sqlx/`
- dla offline builda generuj cache przez `cargo sqlx prepare`
- commituj katalog `.sqlx/` do repozytorium
- w CI uruchamiaj `cargo sqlx prepare --check`, żeby wykryć nieaktualny cache
- nie trzymaj `SQLX_OFFLINE=true` w tym samym środowisku, którego używasz do generowania `.sqlx/`
- unikaj `sqlx::query_unchecked!()`; jeśli musisz go użyć, dodaj komentarz z uzasadnieniem
- dla dynamicznych zapytań używaj `sqlx::QueryBuilder` i `push_bind`
- nie interpoluj wartości do SQL stringów; zawsze używaj bind parameters
- nie owijaj `PgPool` / `Pool<DB>` w dodatkowy `Arc`, jeśli nie ma innego powodu; `Pool` jest tani do klonowania
- twórz pool raz przy starcie procesu, nie per request
- ustawiaj limity puli, timeout acquire, max lifetime i idle timeout świadomie
- przy shutdownie zamykaj pool przez `.close().await`
- unikaj `fetch_all()` dla dużych wyników; używaj strumieniowania, paginacji albo batchy
- dla dużych tabel preferuj keyset pagination zamiast głębokiego `OFFSET`
- unikaj N+1 queries; pobieraj dane batchami albo przez joiny
- transakcje stosuj dla wieloetapowych zapisów, które muszą być atomowe
- nie trzymaj transakcji otwartej podczas zewnętrznego HTTP, długiego CPU albo oczekiwania na użytkownika
- migracje trzymaj w `migrations/`
- migracje uruchamiaj w kontrolowanym miejscu procesu deploymentu albo przy starcie jednego procesu odpowiedzialnego za migracje
- jeśli kilka instancji aplikacji może startować równolegle, zabezpiecz migracje przed wyścigiem
- constraints w bazie traktuj jako część logiki spójności: unique, foreign key, check, not null
- mapuj błędy constraintów na typowane błędy domenowe
- dla kolejek opartych o Postgres rozważ `FOR UPDATE SKIP LOCKED`
- dla dużych insertów używaj batch insert albo `COPY`, jeśli pasuje do przypadku użycia
## Serde, JSON i DTO

- na granicy API deserializuj do typowanych struktur, jeśli schema jest znana
- używaj `serde_json::Value` tylko dla danych rzeczywiście dynamicznych
- dla dużych payloadów rozważ borrowed deserialization: `&'de str`, `&'de [u8]`, `Cow<'de, str>`
- używaj `#[serde(default)]`, `skip_serializing_if`, `rename_all` zamiast ręcznej konwersji pól
- używaj `deny_unknown_fields`, gdy API ma odrzucać nieznane pola
- nie używaj `deny_unknown_fields`, jeśli endpoint ma przyjmować rozszerzalne payloady
- uważaj na `flatten`; zmienia kształt danych i może utrudnić walidację
- nie loguj pełnych payloadów JSON w miejscach z danymi wrażliwymi
- rozdzielaj DTO z granicy API od typów domenowych, jeśli walidacja albo invariants są inne
- walidację danych wejściowych wykonuj na granicy systemu, a w domenie trzymaj typy już poprawne
- dla statusów, ról i typów zdarzeń używaj enumów zamiast stringów rozsianych po kodzie
## Logowanie, tracing i diagnostyka

- używaj `tracing` zamiast `println!` / `dbg!` w kodzie aplikacyjnym
- `dbg!` nie może zostać w kodzie produkcyjnym
- przy `#[instrument]` używaj `skip(...)` dla dużych struktur, pooli, klientów HTTP, payloadów i sekretów
- nie formatuj ciężkich logów w hot path, jeśli poziom logowania może je odrzucić
- dodawaj request id, job id, tenant id albo correlation id na granicy operacji
- loguj błędy z kontekstem operacji, ale bez sekretów, tokenów i pełnych danych osobowych
- nie loguj tego samego błędu wielokrotnie na kilku warstwach
- logi na poziomie `error` powinny oznaczać sytuację wymagającą reakcji albo diagnozy
- metryki stosuj dla liczników requestów, błędów, czasu operacji, retry, queue depth i pool usage
- przy retry loguj liczbę prób i ostatnią przyczynę błędu
- dodawaj span dla requestu, joba, transakcji biznesowej albo importu danych
## Organizacja kodu

- preferuj strukturę vertical slice, np. `orders/`, `users/`, `billing/`, zamiast podziału wyłącznie na `models/`, `services/`, `controllers/`
- nie mieszaj domeny, adaptera HTTP, adaptera DB i konfiguracji runtime w jednym pliku
- `main.rs` powinien głównie składać aplikację, ładować konfigurację, inicjalizować zależności i uruchamiać runtime
- `lib.rs` powinien eksportować stabilne moduły i typy, a nie zawierać dużej logiki
- trzymaj pliki z typami i podstawowymi metodami zwykle w przedziale 300-700 linii
- pliki z implementacjami traitów, serde, sqlx mogą mieć 800-1000 linii, jeśli są czytelne
- pliki testów jednostkowych mogą być dłuższe, jeśli mają jasny podział na przypadki
- gdy plik przekracza 800 linii i dalej rośnie, wyciągaj prywatne moduły
- gdy w pliku są więcej niż 1-2 publiczne typy, sprawdź, czy nie warto rozbić modułu
- wyciągaj implementacje traitów, serde, sqlx do osobnych plików, np. `order/impls.rs`, `order/db.rs`
- unikaj modułów `utils`, `helpers`, `common` jako miejsca na przypadkowy kod
- jeśli tworzysz `utils`, nazwa modułu powinna opisywać konkretną odpowiedzialność
- nie używaj wildcard importów poza testami i prelude
- prelude twórz tylko wtedy, gdy projekt naprawdę na tym zyskuje
- kod domenowy powinien być możliwy do testowania bez HTTP, bazy i runtime Tokio, jeśli przypadek użycia na to pozwala
## Czytelność i utrzymywalność

- używaj nazw zmiennych i funkcji opisujących intencję, a nie typ
- unikaj skrótów, jeśli nie są standardem w domenie
- funkcje trzymaj zwykle w granicach 30-50 linii
- dłuższa funkcja jest akceptowalna, jeśli ma jeden poziom abstrakcji i czytelny flow
- rozbij funkcję, gdy miesza walidację, I/O, mapowanie, logikę domenową i formatowanie odpowiedzi
- komentarze powinny tłumaczyć powód decyzji, a nie przepisywać kod
- nie zostawiaj martwego kodu, unused imports, unused variables i starych TODO bez właściciela
- TODO powinno mieć kontekst, np. issue, datę, właściciela albo warunek usunięcia
- nie nadużywaj makr; makro powinno usuwać realny boilerplate, a nie ukrywać prostą logikę
- kod generowany przez makra powinien być możliwy do debugowania przez `cargo expand`
- nie mieszaj stylów obsługi błędów w jednym module
- nie ukrywaj kosztownego I/O za nazwą funkcji wyglądającą jak prosty getter
- funkcje wykonujące I/O powinny mieć nazwę sugerującą operację, np. `load`, `fetch`, `save`, `persist`, `send`
## Testy

- pisz testy jednostkowe dla logiki domenowej i funkcji bez I/O
- pisz testy integracyjne dla adapterów DB, HTTP, kolejek i filesystemu
- testuj przypadki typowe, graniczne i błędne
- testuj zachowanie publiczne, nie prywatną implementację
- używaj property-based testing, np. `proptest`, dla parserów, walidatorów, serializacji i algorytmów
- używaj snapshotów ostrożnie; snapshot powinien być czytelny i reviewowalny
- nie snapshotuj przypadkowych timestampów, UUID i danych zależnych od środowiska
- przy testach async kontroluj timeouty, żeby test nie wisiał bez końca
- przy kodzie współbieżnym testuj zamykanie, cancellation, retry i błędy kanałów
- dla kodu z unsafe uruchamiaj Miri, jeśli jest to możliwe
- testy nie powinny zależeć od kolejności wykonania
- testy integracyjne z bazą powinny izolować dane: transakcja, osobna schema, osobna baza albo unikalny prefix
- nie używaj prawdziwych sekretów w testach
- testuj migracje bazy, jeśli projekt intensywnie korzysta ze schematu SQL
## Testy wydajnościowe i profilowanie

- pisz benchmarki dla fragmentów, które są często wykonywane albo kosztowne
- używaj `criterion` albo `divan` do benchmarków mikro
- używaj `hyperfine` do benchmarków CLI i całych procesów
- używaj `cargo flamegraph` albo `samply` do profilowania CPU
- używaj `heaptrack`, `valgrind massif`, `dhat` albo allocator metrics do analizy alokacji
- używaj `cargo-show-asm` do inspekcji wygenerowanego kodu tylko przy niskopoziomowych fragmentach
- używaj `cargo bloat` do analizy rozmiaru binarki
- benchmarki uruchamiaj w release mode
- porównuj wyniki przed i po zmianie
- benchmarki uruchamiaj na tej samej maszynie albo w kontrolowanym środowisku CI
- przy benchmarkach ogranicz szum: stały input, rozgrzana maszyna, brak debug logów
- używaj `std::hint::black_box`, gdy benchmark mógłby zostać zoptymalizowany przez kompilator
- trzymaj hot path wolne od blokującego I/O i niepotrzebnych alokacji
- stosuj `#[inline]`, `#[inline(always)]`, `#[cold]` tylko po pomiarach
- sprawdzaj regresje wydajnościowe przy zmianach parserów, serializerów, kolejek, hot endpointów i algorytmów
## Zależności i Cargo

- ogranicz liczbę zależności do realnie potrzebnych
- sprawdzaj feature tree przez `cargo tree -e features`
- sprawdzaj duplikaty zależności przez `cargo tree -d`
- wyłączaj niepotrzebne features w `Cargo.toml`
- nie wyłączaj `default-features`, jeśli potem ręcznie odtwarzasz większość domyślnego zestawu
- w workspace trzymaj wersje zależności centralnie przez `[workspace.dependencies]`
- ustaw `rust-version` w `Cargo.toml`
- pinuj toolchain przez `rust-toolchain.toml`, jeśli build ma być powtarzalny
- używaj `cargo deny check` dla licencji, źródeł, banów i advisory
- używaj `cargo audit` albo `cargo deny check advisories` dla podatności
- sprawdzaj zależności transitive przed dodaniem dużego crate'a
- nie dodawaj dużego frameworka dla jednej małej funkcji
- przy bibliotekach dbaj o minimalny zestaw features i brak ciężkich zależności domyślnych
- dla binarek produkcyjnych rozważ osobny profil release

Przykładowe profile:

```toml
[profile.release]
opt-level = 3
lto = "thin"
codegen-units = 16
debug = 1

[profile.release-prod]
inherits = "release"
opt-level = 3
lto = "fat"
codegen-units = 1
strip = "symbols"
panic = "abort"
```

Dodatkowe zasady:

- `lto = "fat"` i `codegen-units = 1` stosuj dla finalnych artefaktów po pomiarach
- `panic = "abort"` stosuj tylko, gdy nie potrzebujesz unwindingu
- `target-cpu=native` stosuj tylko dla binarek budowanych pod znaną architekturę
- dla binary size testuj `opt-level = "z"` / `"s"` zamiast zakładać, że `opt-level = 3` da najlepszy rezultat
- nie używaj agresywnego profilu release w codziennym dev flow, jeśli mocno spowalnia build
