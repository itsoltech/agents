# svelte-review Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `svelte-frontend-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Svelte/SvelteKit review

## Przeniesione sekcje

- Zasady ogólne
- TypeScript
- Struktura projektu
- Pliki Svelte i długość komponentów
- Svelte 5 reactivity
- Props, events, bind i snippets
- State management
- SvelteKit routing i rendering
- `load` i pobieranie danych
- Komunikacja z API
- Runtime config i zmienne środowiskowe
- Autoryzacja i sesja
- Formularze, Superforms i Zod
- Bezpieczeństwo XSS
- CSP i nagłówki bezpieczeństwa
- CSRF, CORS i cookies
- Storage w przeglądarce
- API security z perspektywy frontendu
- Dostępność
- Performance UI i rendering
- Bundle size i zależności frontendowe
- CSS i design system
- UX stanów asynchronicznych
- Error handling w SvelteKit
- Testy jednostkowe i komponentowe
- Testy E2E
- Dostępność w testach
- Observability i diagnostyka
- CI, lint i formatowanie
- Review zależności
- Deployment i hosting
- Checklist skrócony do code review

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (188 linii) - Overview; Zasady ogólne; TypeScript; Struktura projektu; +6 więcej
- `02-komunikacja-z-api.md` (181 linii) - Komunikacja z API; Runtime config i zmienne środowiskowe; Autoryzacja i sesja; Formularze, Superforms i Zod; +1 więcej
- `03-csp-i-naglowki-bezpieczenstwa.md` (191 linii) - CSP i nagłówki bezpieczeństwa; CSRF, CORS i cookies; Storage w przeglądarce; API security z perspektywy frontendu; +7 więcej
- `04-testy-e2e.md` (185 linii) - Testy E2E; Dostępność w testach; Observability i diagnostyka; CI, lint i formatowanie; +3 więcej
