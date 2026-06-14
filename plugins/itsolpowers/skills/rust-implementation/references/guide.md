# Rust Implementation Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `rust-best-practices.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Używaj przy implementacji kodu Rust: projektowanie typów i API, ownership, struktury danych, async, SQLx, DTO, tracing, organizacja kodu, testy, zależności i CI.

## Przeniesione sekcje

- Cel dokumentu
- Zasady ogólne
- Ownership i borrowing
- Projektowanie API i typów
- Wybór struktur danych
- HashMap, hashowanie i klucze
- Iteratory i pętle ręczne
- Alokacje i zarządzanie pamięcią
- Bufory, bajty i dane binarne
- Równoległe przetwarzanie CPU-bound
- Async i Tokio
- Współdzielenie stanu i locki
- Obsługa błędów
- Paniki i unsafe
- SQLx i baza danych
- Serde, JSON i DTO
- Logowanie, tracing i diagnostyka
- Organizacja kodu
- Czytelność i utrzymywalność
- Testy
- Zależności i Cargo
- Clippy, rustfmt i lints
- Konfiguracja i sekrety
- HTTP, API i warstwa zewnętrzna
- Kolejki, joby i retry
- Makra i kod generowany
- Minimalny zestaw kontroli w CI

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (195 linii) - Overview; Cel dokumentu; Zasady ogólne; Ownership i borrowing; +9 więcej
- `02-obsluga-bledow.md` (187 linii) - Obsługa błędów; Paniki i unsafe; SQLx i baza danych; Serde, JSON i DTO; +5 więcej
- `03-clippy-rustfmt-i-lints.md` (132 linii) - Clippy, rustfmt i lints; Konfiguracja i sekrety; HTTP, API i warstwa zewnętrzna; Kolejki, joby i retry; +2 więcej
