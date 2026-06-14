# Rust Review Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `rust-best-practices.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Używaj przy review kodu Rust: znajdowanie ryzyk poprawności, pamięci, wydajności, async, API, bazy danych, bezpieczeństwa, testów, zależności i utrzymania.

## Przeniesione sekcje

- Cel dokumentu
- Zasady ogólne
- Ownership i borrowing
- Projektowanie API i typów
- Wybór struktur danych
- HashMap, hashowanie i klucze
- Alokacje i zarządzanie pamięcią
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
- Testy wydajnościowe i profilowanie
- Zależności i Cargo
- Clippy, rustfmt i lints
- Konfiguracja i sekrety
- HTTP, API i warstwa zewnętrzna
- Kolejki, joby i retry
- Makra i kod generowany
- Minimalny zestaw kontroli w CI
- Checklist skrócony do code review

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (182 linii) - Overview; Cel dokumentu; Zasady ogólne; Ownership i borrowing; +8 więcej
- `02-sqlx-i-baza-danych.md` (173 linii) - SQLx i baza danych; Serde, JSON i DTO; Logowanie, tracing i diagnostyka; Organizacja kodu; +4 więcej
- `03-clippy-rustfmt-i-lints.md` (132 linii) - Clippy, rustfmt i lints; Konfiguracja i sekrety; HTTP, API i warstwa zewnętrzna; Kolejki, joby i retry; +2 więcej
- `04-checklist-skrocony-do-code-review.md` (70 linii) - Checklist skrócony do code review
