# hey-api-openapi-codegen Reference Sector: Testy

## Zawartość

- Testy
- CI i kontrola kontraktu
- Migracje kontraktu API
- Publikacja wygenerowanego klienta jako paczki
- Przykład konfiguracji produkcyjnej dla SvelteKit + TanStack Query + Zod
- Minimalny standard projektu

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
## Publikacja wygenerowanego klienta jako paczki

- publikuj generated client jako osobny package, jeśli kilka aplikacji korzysta z tego samego API
- wersja paczki powinna być powiązana z wersją kontraktu API
- nie publikuj paczki z prywatnymi endpointami do public registry
- generated package powinien eksportować stabilny entrypoint
- aplikacje nie powinny importować z wewnętrznych ścieżek paczki bez potrzeby
- przy publikacji dodaj typecheck i test importu paczki
- nie publikuj source snapshotu specyfikacji, jeśli ujawnia wewnętrzne informacje
- zależności runtime klienta powinny być minimalne
- peer dependencies dobieraj świadomie, szczególnie dla TanStack Query, Zod i frameworków
## Przykład konfiguracji produkcyjnej dla SvelteKit + TanStack Query + Zod

```ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi/openapi.json',
  output: {
    path: 'src/lib/api/generated',
    postProcess: ['prettier'],
    source: {
      fileName: 'openapi',
      path: './source',
    },
  },
  parser: {
    transforms: {
      enums: 'root',
      propertiesRequiredByDefault: false,
    },
  },
  plugins: [
    {
      name: '@hey-api/client-fetch',
      runtimeConfigPath: './src/lib/api/hey-api-runtime.ts',
    },
    {
      name: '@hey-api/typescript',
      comments: true,
      enums: false,
    },
    'zod',
    {
      name: '@hey-api/sdk',
      operations: {
        strategy: 'flat',
      },
      validator: true,
    },
    {
      name: '@tanstack/svelte-query',
      queryKeys: {
        tags: true,
      },
    },
  ],
});
```
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
