# hey-api-openapi-contract-debugging Reference Sector: Overview

## Zawartość

- Overview
- Instalacja i wersjonowanie
- Podstawowa konfiguracja
- Input specyfikacji
- Output i wygenerowane pliki
- OpenAPI jako kontrakt
- Jakość schematów danych


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
## OpenAPI jako kontrakt

- `operationId` musi być stabilny, unikalny i czytelny
- zmiana `operationId` jest zmianą łamiącą dla wygenerowanego klienta
- każdy endpoint powinien mieć jawne response schemas dla sukcesu i błędów
- nie ograniczaj dokumentacji response tylko do `200`
- modeluj `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`, jeśli frontend ma je rozróżniać
- używaj spójnego error envelope dla API
- nie zwracaj innego kształtu błędu dla każdego endpointu bez powodu
- jawnie opisuj `required`, `nullable`, enumy, formaty dat i content types
- unikaj `additionalProperties: true` bez uzasadnienia
- unikaj pól typu `object` bez schematu, jeśli frontend ma na nich polegać
- rozróżniaj brak pola, `null` i pustą wartość
- opisuj `204 No Content` jako brak body
- opisuj paginację, sortowanie i filtry jako jawne parametry
- jeśli endpoint przyjmuje pliki, jawnie modeluj `multipart/form-data`
- jeśli endpoint zwraca pliki, jawnie modeluj content type i binary response
- jeśli endpoint wymaga idempotency key, dodaj header do specyfikacji
- jeśli endpoint wymaga tenant id, locale albo request id, dodaj je do specyfikacji
- security schemes muszą być w OpenAPI, ale realna autoryzacja musi być po stronie serwera
- tagi powinny opisywać domenę lub moduł, a nie przypadkowe grupy techniczne
- endpointy deprecated oznaczaj jako deprecated w specyfikacji
- nie usuwaj starego endpointu ze specyfikacji przed usunięciem jego użyć we frontendzie
## Jakość schematów danych

- nazwy komponentów powinny być stabilne
- wspólne typy wynoś do `components.schemas`
- enumy, które mają być importowane w frontendzie, trzymaj jako reusable components
- inline enumy utrudniają ponowne użycie w UI
- daty i czas opisuj konsekwentnie, np. `format: date-time`
- ustal, czy API zwraca offset czasowy, UTC, czy lokalny czas bez strefy
- kwoty, waluty, jednostki i identyfikatory modeluj jako konkretne typy domenowe w specyfikacji
- nie używaj `number` dla pieniędzy, jeśli backend wymaga precyzji decimal i frontend nie powinien wykonywać obliczeń floatami
- jeśli backend zwraca decimal jako string, opisz to w OpenAPI
- nie używaj jednego modelu `User` do wszystkich kontekstów, jeśli endpointy zwracają różne zakresy pól
- osobne DTO request/response są często lepsze niż jeden wspólny model
- nie ujawniaj w publicznej specyfikacji pól administracyjnych, których frontend nie ma używać
- przykłady w OpenAPI nie mogą zawierać sekretów, tokenów, prawdziwych danych osobowych ani wewnętrznych URL
