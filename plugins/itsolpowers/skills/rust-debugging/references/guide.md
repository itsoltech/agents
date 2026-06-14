# Rust Debugging Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `rust-best-practices.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Używaj przy debugowaniu problemów Rust: błędy kompilacji, lifetimes, paniki, async, locki, SQLx, Serde, tracing, performance, zależności, konfiguracja, HTTP i joby.

## Przeniesione sekcje

- Cel dokumentu
- Zasady ogólne
- Ownership i borrowing
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
- Testy
- Testy wydajnościowe i profilowanie
- Zależności i Cargo
- Clippy, rustfmt i lints
- Konfiguracja i sekrety
- HTTP, API i warstwa zewnętrzna
- Kolejki, joby i retry
- Minimalny zestaw kontroli w CI

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (177 linii) - Overview; Cel dokumentu; Zasady ogólne; Ownership i borrowing; +8 więcej
- `02-sqlx-i-baza-danych.md` (191 linii) - SQLx i baza danych; Serde, JSON i DTO; Logowanie, tracing i diagnostyka; Testy; +4 więcej
- `03-http-api-i-warstwa-zewnetrzna.md` (70 linii) - HTTP, API i warstwa zewnętrzna; Kolejki, joby i retry; Minimalny zestaw kontroli w CI
