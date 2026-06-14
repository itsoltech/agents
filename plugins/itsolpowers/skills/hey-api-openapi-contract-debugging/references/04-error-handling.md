# hey-api-openapi-contract-debugging Reference Sector: Error handling

## Zawartość

- Error handling
- Review wygenerowanego kodu
- Testy
- CI i kontrola kontraktu
- Migracje kontraktu API
- Minimalny standard projektu

## Error handling

- ustal jeden model błędów API i trzymaj go w OpenAPI
- endpointy powinny zwracać typowane response schemas dla błędów
- UI powinien rozróżniać błąd transportu, błąd HTTP, błąd walidacji response i błąd domenowy
- nie zakładaj, że każdy błąd ma JSON body
- obsłuż `204 No Content`
- obsłuż błędy sieciowe i timeouty niezależnie od statusów HTTP
- nie pokazuj technicznego message użytkownikowi bez mapowania
- loguj błędy z correlation id i nazwą operacji
- nie loguj pełnego body błędu, jeśli może zawierać dane wrażliwe
- retry stosuj tylko dla błędów przejściowych
- nie retryuj automatycznie mutacji bez idempotency key
- przy `429` respektuj `Retry-After`, jeśli backend go zwraca
- przy `401` wykonaj kontrolowany refresh albo logout
- przy `403` nie wykonuj refresh tokena w pętli
- przy `409` pokaż konflikt albo odśwież dane, jeśli ma to sens domenowo
- przy `422` mapuj błędy walidacji na formularz

Przykład warstwy mapowania błędów:

```ts
export type ApiUiError =
  | { type: 'network'; message: string }
  | { type: 'auth'; message: string }
  | { type: 'permission'; message: string }
  | { type: 'not_found'; message: string }
  | { type: 'validation'; fields: Record<string, string[]> }
  | { type: 'conflict'; message: string }
  | { type: 'unknown'; message: string };
```
## Review wygenerowanego kodu

- nie reviewuj ręcznie każdej linii generated output, jeśli diff jest duży
- reviewuj zmianę OpenAPI, konfigurację generatora i miejsca użycia klienta
- generated diff sprawdzaj pod kątem nieoczekiwanych usunięć, zmian nazw i rozmiaru outputu
- każde usunięcie `operationId` powinno mieć odpowiadające usunięcie użyć w frontendzie
- każda zmiana typu response powinna uruchomić typecheck i testy UI
- każde dodanie pola required może złamać formularze i mutacje
- każde usunięcie pola response może złamać widoki
- każda zmiana enumu może złamać mapowanie labeli, kolorów, filtrów i formularzy
- każda zmiana auth/security w OpenAPI wymaga sprawdzenia konfiguracji klienta
- przy dużym generated diffie warto dodać krótki opis: co zmieniło się w kontrakcie i które ekrany są dotknięte
- jeśli generated output zmienił się mimo braku zmian w specyfikacji, sprawdź wersję generatora i środowisko Node
## Testy

- typecheck jest minimalnym testem kontraktu generated client z aplikacją
- testuj wrappery API, nie generated code
- generated code traktuj jako dependency z zewnątrz
- używaj mocków HTTP, np. MSW, do testów UI i integration tests
- mocki powinny odpowiadać kształtom z OpenAPI
- nie twórz mocków z polami, których API nigdy nie zwraca
- testuj błędy 400/401/403/404/409/422/429/500, jeśli UI ma osobne ścieżki
- testuj 204, puste listy i brak opcjonalnych pól
- testuj przypadki z nowymi i nieznanymi wartościami enumów, jeśli backend może je dodać
- testuj cache invalidation po mutacjach
- testuj logout i czyszczenie cache
- testuj retry i brak retry dla mutacji bez idempotency key
- testuj response validation, jeśli Zod validator jest włączony
- w kontraktowych testach backendu sprawdzaj, czy OpenAPI odpowiada realnym response
## CI i kontrola kontraktu

- generacja klienta musi być powtarzalna
- CI powinno wykrywać niezatwierdzony generated diff
- CI powinno uruchamiać typecheck po generacji
- CI powinno lintować specyfikację OpenAPI
- CI powinno sprawdzać breaking changes specyfikacji, jeśli API jest wersjonowane kontraktowo
- nie pobieraj specyfikacji z dev servera, który może być niedostępny podczas CI
- jeśli CI pobiera remote spec, ustaw timeout i jasny błąd
- jeśli spec wymaga auth, token trzymaj w secrets managerze CI
- build pull requestów z forków nie powinien mieć dostępu do sekretów specyfikacji
- cache dependencies jest OK, cache generated output jako substytut generacji nie jest OK
- generated output w PR powinien pochodzić z tej samej wersji generatora, którą deklaruje lockfile

Przykład CI:

```bash
pnpm install --frozen-lockfile
pnpm openapi:generate
pnpm typecheck
pnpm lint
pnpm test
pnpm openapi:check
```

Przykład mocniejszego checka:

```bash
pnpm openapi:generate
git diff --exit-code src/lib/api/generated
pnpm tsc --noEmit
pnpm svelte-check
pnpm test:unit
pnpm test:e2e
```
## Migracje kontraktu API

- dodanie opcjonalnego pola response zwykle jest bezpieczne
- usunięcie pola response jest breaking change
- zmiana typu pola jest breaking change
- dodanie required pola w request body jest breaking change dla klienta
- usunięcie wartości enumu jest breaking change
- zmiana `operationId` jest breaking change dla generated client
- zmiana path albo parametru path jest breaking change
- zmiana auth requirements jest breaking change z perspektywy klienta
- endpoint deprecated powinien mieć okres migracji
- frontend powinien usuwać użycia deprecated endpointów przed wyłączeniem ich z outputu
- przy migracji z v1 na v2 trzymaj dwa klienty tylko przez ograniczony czas
- nie mieszaj modeli v1 i v2 w tych samych typach UI
- po migracji usuń stare generated output i query keys
## Minimalny standard projektu

```bash
pnpm add @hey-api/openapi-ts -D -E
pnpm add @tanstack/svelte-query zod
```

```json
{
  "scripts": {
    "openapi:generate": "openapi-ts",
    "openapi:check": "openapi-ts && git diff --exit-code src/lib/api/generated",
    "typecheck": "svelte-check --tsconfig ./tsconfig.json",
    "test": "vitest run"
  }
}
```

```text
src/lib/api/generated/    # tylko generated output
src/lib/api/api-client.ts # wrapper aplikacyjny
src/lib/api/api-errors.ts # mapowanie błędów
src/lib/api/queries.ts    # opcjonalne wspólne helpers nad TanStack Query
```
