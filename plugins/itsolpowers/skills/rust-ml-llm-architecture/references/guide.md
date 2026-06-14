# rust-ml-llm-architecture Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `rust-ml-llm-rig-candle-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Rust ML LLM architecture

## Przeniesione sekcje

- Cel dokumentu
- Założenia architektoniczne
- Decyzja: Rig, Candle czy oba
- Warstwy systemu
- Struktura projektu
- Cargo, features i wersje
- Konfiguracja modeli
- Rig: providerzy, modele i agenci
- Candle: runtime, modele i tensory
- API dla funkcji ML / LLM
- Bezpieczeństwo aplikacji LLM
- RAG: ingestion, indexing i retrieval
- Candle: trening, inference service i joby
- Integracja z frontendem
- Integracja z backendem niezależnym od technologii
- Observability, koszty i audyt
- Testy i ewaluacje
- Deployment i infrastruktura
- Edge case'y

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (177 linii) - Overview; Cel dokumentu; Założenia architektoniczne; Decyzja: Rig, Candle czy oba; +3 więcej
- `02-konfiguracja-modeli.md` (38 linii) - Konfiguracja modeli
- `03-rig-providerzy-modele-i-agenci.md` (170 linii) - Rig: providerzy, modele i agenci
- `04-candle-runtime-modele-i-tensory.md` (123 linii) - Candle: runtime, modele i tensory
- `05-api-dla-funkcji-ml-llm.md` (182 linii) - API dla funkcji ML / LLM; Bezpieczeństwo aplikacji LLM; RAG: ingestion, indexing i retrieval
- `06-candle-trening-inference-service-i-joby.md` (162 linii) - Candle: trening, inference service i joby; Integracja z frontendem; Integracja z backendem niezależnym od technologii; Observability, koszty i audyt; +2 więcej
- `07-edge-case-y.md` (60 linii) - Edge case'y
