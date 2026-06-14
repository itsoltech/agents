# hey-api-openapi-review Reference Sector: Overview

## Zawartość

- Overview
- Założenia
- Instalacja i wersjonowanie
- Struktura katalogów
- Podstawowa konfiguracja
- Input specyfikacji
- Output i wygenerowane pliki


## Założenia

- używamy aktualnego `@hey-api/openapi-ts`
- zależność jest pinowana do dokładnej wersji
- konfiguracja generatora jest trzymana w repozytorium
- wygenerowany kod nie jest edytowany ręcznie
- frontend korzysta z TypeScript w trybie strict
- specyfikacja OpenAPI jest sprawdzana w CI
- zmiana kontraktu API i wygenerowanego klienta trafia do tego samego PR, jeśli dotyczy frontendowego użycia
## Instalacja i wersjonowanie

- instaluj `@hey-api/openapi-ts` jako dev dependency
- pinuj dokładną wersję pakietu
- nie używaj luźnych zakresów wersji dla generatora, np. `^`, jeśli projekt ma mieć powtarzalne buildy
- aktualizację generatora rób osobnym PR albo osobnym commitem w PR
- przy aktualizacji generatora sprawdzaj migration notes
- po aktualizacji generatora regeneruj cały output i uruchamiaj typecheck
- nie mieszaj aktualizacji generatora, zmiany specyfikacji i dużego refactoru UI w jednym nieczytelnym diffie
- jeśli generator jest używany w kilku pakietach monorepo, trzymaj wersję centralnie
- Node.js używany w CI musi spełniać wymagania generatora

Przykład instalacji:

```bash
pnpm add @hey-api/openapi-ts -D -E
```

Przykład skryptów:

```json
{
  "scripts": {
    "openapi:generate": "openapi-ts",
    "openapi:check": "openapi-ts && git diff --exit-code src/lib/api/generated"
  }
}
```
## Struktura katalogów

- trzymaj wygenerowany kod w jednym izolowanym katalogu
- nie mieszaj wygenerowanego kodu z ręcznie pisanymi wrapperami
- importy aplikacyjne powinny przechodzić przez cienką warstwę `api`, jeśli potrzebujesz wspólnego error handlingu, auth albo mapowania domenowego
- nie importuj wygenerowanych typów z losowych głębokich ścieżek, jeśli projekt ma ustalony publiczny entrypoint
- nie wkładaj customowych plików do katalogu output, jeśli `clean` pozostaje domyślnie włączone
- jeśli musisz trzymać customowy plik obok outputu, przeanalizuj skutki `clean: false`
- nie wyłączaj czyszczenia outputu bez powodu, bo stare pliki mogą zostać w projekcie po zmianie specyfikacji

Przykład struktury dla Svelte/SvelteKit:

```text
src/
  lib/
    api/
      generated/
        client/
        core/
        client.gen.ts
        sdk.gen.ts
        types.gen.ts
        index.ts
      api-client.ts
      api-errors.ts
      api-config.ts
      queries.ts
```
## Podstawowa konfiguracja

- trzymaj konfigurację w `openapi-ts.config.ts`
- używaj `defineConfig`, jeśli chcesz mieć lepsze typowanie konfiguracji
- konfiguracja powinna być deterministyczna i możliwa do uruchomienia w CI
- nie pobieraj specyfikacji z niestabilnego adresu bez wersji, brancha albo snapshotu
- nie hardcoduj sekretów w konfiguracji
- ścieżka output powinna być jawna
- pluginy powinny być jawnie wybrane, zamiast polegać wyłącznie na domyślnym zestawie

Przykład konfiguracji bazowej:

```ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi/openapi.json',
  output: {
    path: 'src/lib/api/generated',
    postProcess: ['prettier'],
    source: true,
  },
  plugins: [
    '@hey-api/client-fetch',
    '@hey-api/typescript',
    {
      name: '@hey-api/sdk',
      operations: {
        strategy: 'flat',
      },
    },
  ],
});
```
## Input specyfikacji

- preferuj lokalny snapshot specyfikacji w repo, jeśli frontend musi budować się niezależnie od backendu
- preferuj URL albo registry, jeśli organizacja ma centralne zarządzanie kontraktami i stabilne wersjonowanie
- jeśli input jest z URL, w CI pinuj branch, tag, commit, wersję API albo środowisko
- nie generuj klienta z lokalnie zmodyfikowanej specyfikacji bez widocznego diffu w PR
- jeśli specyfikacja jest chroniona auth, token pobieraj z env w CI
- nie zapisuj tokenów do `openapi-ts.config.ts`
- nie ustawiaj `NODE_TLS_REJECT_UNAUTHORIZED=0` poza lokalnym developmentem
- dla self-signed cert w dev dodaj osobną instrukcję lokalną, a nie globalne ustawienie w repo
- watch mode traktuj jako narzędzie developerskie, nie jako mechanizm kontroli kontraktu
- watch mode wspierający tylko remote URL nie zastępuje CI checka

Przykład inputu z lokalnego pliku:

```ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi/openapi.json',
  output: 'src/lib/api/generated',
});
```

Przykład inputu z URL i nagłówkiem z env:

```ts
import { defineConfig } from '@hey-api/openapi-ts';

const token = process.env.OPENAPI_SPEC_TOKEN;

if (!token) {
  throw new Error('OPENAPI_SPEC_TOKEN is required to generate API client');
}

export default defineConfig({
  input: {
    path: 'https://api.example.com/openapi.json',
    fetch: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  },
  output: 'src/lib/api/generated',
});
```
## Output i wygenerowane pliki

- traktuj output jako dependency, nie jako kod aplikacyjny
- nie edytuj wygenerowanych plików ręcznie
- nie dopisuj wrapperów do katalogu output
- zostaw suffix `.gen`, jeśli pomaga zespołowi rozpoznawać wygenerowany kod
- nie wyłączaj nagłówka informującego, że plik jest generowany, jeśli w projekcie często dochodzi do ręcznych edycji outputu
- `source: true` pomaga utrzymać snapshot specyfikacji użytej do generacji
- nie commituj snapshotu specyfikacji do publicznego repo, jeśli ujawnia prywatne endpointy, przykłady danych albo nazwy systemów wewnętrznych
- używaj `postProcess` do formatowania albo lintowania wygenerowanego kodu
- nie wymuszaj ręcznego formatowania wygenerowanych plików poza procesem generacji
- jeśli generated output jest bardzo duży, rozważ wyłączenie lintowania stylistycznego dla tego katalogu, ale zostaw typecheck
- ustaw `tsConfigPath`, jeśli generator nie wykrywa właściwego tsconfig w monorepo
- nie ustawiaj `clean: false`, jeśli nie masz testu wykrywającego stare wygenerowane pliki

Przykład outputu z formatowaniem:

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
});
```
