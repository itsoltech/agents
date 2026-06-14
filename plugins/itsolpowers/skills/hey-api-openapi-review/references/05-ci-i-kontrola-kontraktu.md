# hey-api-openapi-review Reference Sector: CI i kontrola kontraktu

## Zawartość

- CI i kontrola kontraktu
- Migracje kontraktu API
- Checklist do code review
- Minimalny standard projektu

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
## Checklist do code review

### Konfiguracja generatora

- czy `@hey-api/openapi-ts` jest pinowany do dokładnej wersji?
- czy config jest w repozytorium?
- czy output jest w izolowanym katalogu?
- czy generated output nie zawiera ręcznych plików?
- czy `clean: false` nie jest użyte bez powodu?
- czy `postProcess` jest spójny z formatowaniem projektu?
- czy `runtimeConfigPath` jest użyty, jeśli globalny klient musi być skonfigurowany przed pierwszym użyciem?
- czy secrets nie są zapisane w configu?

### Input i OpenAPI

- czy specyfikacja jest stabilnym źródłem kontraktu?
- czy `operationId` są unikalne i stabilne?
- czy request/response schemas są jawne?
- czy błędy mają opisane schemas?
- czy required/nullable są poprawne?
- czy enumy są modelowane tak, żeby UI mogło ich używać?
- czy daty mają ustaloną semantykę timezone?
- czy securitySchemes są opisane?
- czy spec nie zawiera sekretów ani prawdziwych danych w przykładach?

### Parser i transformacje

- czy patch ma komentarz z powodem?
- czy patch nie ukrywa błędu backendu, który powinien być naprawiony w specyfikacji?
- czy filters nie wycinają używanych endpointów?
- czy deprecated endpointy są obsłużone świadomie?
- czy transforms nie zmieniają semantyki kontraktu bez decyzji zespołu?

### SDK i klient HTTP

- czy aplikacja używa generated SDK zamiast ręcznego `fetch`?
- czy strategia SDK jest dobrana do bundle size?
- czy `baseUrl` jest ustawiany centralnie?
- czy auth jest skonfigurowany centralnie?
- czy interceptory nie są rejestrowane wielokrotnie?
- czy 401/403 są obsługiwane bez pętli retry?
- czy requesty mogą być anulowane tam, gdzie to potrzebne?
- czy nie ma tokenów w URL albo logach?

### Svelte/SvelteKit

- czy publiczny base URL korzysta z public env?
- czy prywatne tokeny są tylko w server-only code?
- czy `load` używa właściwego `fetch`?
- czy klient browser i server są rozdzielone, jeśli mają różne auth?
- czy generated client nie jest konfigurowany w komponencie?
- czy SSR nie współdzieli cache między użytkownikami?

### TanStack Query

- czy query keys pochodzą z generatora?
- czy query key zawiera wszystkie parametry wyniku?
- czy invalidation po mutacji jest zawężona?
- czy cache jest czyszczony po logout albo zmianie tenanta?
- czy optimistic update używa poprawnych typów?
- czy nie ma duplikatów ręcznych query functions dla generated SDK?

### Runtime validation

- czy Zod validator jest włączony tylko tam, gdzie ma wartość?
- czy koszt walidacji dużych payloadów został sprawdzony?
- czy błędy walidacji są logowane bez danych wrażliwych?
- czy daty i timezone są obsłużone zgodnie z kontraktem?

### Bezpieczeństwo

- czy frontend nie zawiera sekretów?
- czy wygenerowana specyfikacja nie ujawnia prywatnych danych?
- czy backend nadal wymusza autoryzację dla każdego obiektu?
- czy cookie-based auth ma ochronę CSRF?
- czy bearer token nie trafia do query stringów?
- czy błędy backendu nie ujawniają stack trace w UI?
- czy przykłady OpenAPI nie zawierają prawdziwych danych?

### CI

- czy CI uruchamia generację?
- czy CI wykrywa generated diff?
- czy CI uruchamia typecheck po generacji?
- czy CI lintuje specyfikację OpenAPI?
- czy CI sprawdza testy UI zależne od API?
- czy remote spec w CI jest wersjonowana albo stabilna?
- czy fork PR nie dostaje sekretów do pobrania specyfikacji?
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
