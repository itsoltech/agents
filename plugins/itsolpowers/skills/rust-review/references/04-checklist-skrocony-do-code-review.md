# rust-review Reference Sector: Checklist skrócony do code review

## Zawartość

- Checklist skrócony do code review

## Checklist skrócony do code review

### Poprawność

- czy typy wymuszają reguły domenowe?
- czy błędy są typowane tam, gdzie ma to znaczenie?
- czy brak `unwrap()` / `expect()` bez opisanego invariantu?
- czy przypadki brzegowe są obsłużone?
- czy testy obejmują ścieżki błędów?
- czy migracje DB i constraints pasują do logiki aplikacji?

### Pamięć

- czy nie ma niepotrzebnych `.clone()`, `.to_string()`, `.collect()`?
- czy funkcje przyjmują `&str`, `&[T]`, `&Path`, gdy tylko czytają dane?
- czy duże bufory są reuse'owane?
- czy capacity jest ustawione przy dużych kolekcjach?
- czy nie ma `fetch_all()` dla dużych wyników?
- czy payloady bajtowe nie są kopiowane między warstwami bez potrzeby?

### Wydajność

- czy zmiana wydajnościowa ma benchmark albo profil?
- czy hot path nie robi blokującego I/O?
- czy hot path nie alokuje w pętli bez powodu?
- czy Rayon jest użyty tylko dla CPU-bound pracy?
- czy async nie odpala nieograniczonej liczby future?
- czy timeouty i backpressure są ustawione?

### Async i współbieżność

- czy każdy task ma lifecycle?
- czy `JoinHandle` nie jest porzucany bez powodu?
- czy lock nie jest trzymany przez `.await`?
- czy bounded channel chroni przed zalaniem pamięci?
- czy shutdown jest obsłużony?
- czy retry ma limit i backoff?

### API i utrzymanie

- czy publiczne API jest minimalne?
- czy `pub(crate)` wystarcza?
- czy nazwy opisują intencję?
- czy moduły są podzielone po funkcjonalności?
- czy logika domenowa nie zależy bezpośrednio od HTTP/DB/runtime?
- czy makra nie ukrywają zbyt wiele?

### Baza danych

- czy zapytania SQLx są sprawdzane compile-time albo przez `.sqlx/`?
- czy dynamiczny SQL używa bind parameters?
- czy pool jest tworzony raz i klonowany jako uchwyt?
- czy transakcje są krótkie?
- czy nie ma N+1 queries?
- czy paginacja jest bezpieczna dla dużych tabel?

### Bezpieczeństwo

- czy sekrety nie trafiają do logów?
- czy dane wejściowe są walidowane na granicy systemu?
- czy błędy wewnętrzne nie wyciekają do API?
- czy `unsafe` ma komentarz `SAFETY:`?
- czy zależności są sprawdzane przez `cargo deny` / `cargo audit`?
- czy cache ma limit rozmiaru albo TTL?
