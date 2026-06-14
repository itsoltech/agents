# svelte-review Reference Sector: Testy E2E

## Zawartość

- Testy E2E
- Dostępność w testach
- Observability i diagnostyka
- CI, lint i formatowanie
- Review zależności
- Deployment i hosting
- Checklist skrócony do code review

## Testy E2E

- używaj Playwright dla krytycznych przepływów użytkownika
- testuj logowanie, logout, odświeżenie sesji i brak uprawnień
- testuj happy path i główne ścieżki błędów
- testuj reload strony w środku procesu, jeśli stan ma się odtwarzać z URL albo backendu
- testuj deep linki do tras chronionych
- nie polegaj na stałych timeoutach; używaj web-first assertions
- seeduj dane testowe jawnie
- każdy test powinien sprzątać dane albo używać izolowanego tenant/user
- testuj aplikację po buildzie produkcyjnym, zamiast ograniczać testy do dev servera
- dla regresji UI rozważ visual snapshots tylko dla stabilnych ekranów
- E2E nie powinny zastępować testów jednostkowych walidacji i logiki
## Dostępność w testach

- sprawdzaj brak podstawowych naruszeń przez axe albo podobne narzędzie
- ręcznie testuj klawiaturę dla modali, dropdownów, menu, tabel i formularzy
- testuj focus po błędzie formularza
- testuj komunikaty `aria-live` dla async statusów
- testuj zoom, większe fonty i małe viewporty
- nie traktuj automatycznego testu a11y jako pełnego pokrycia WCAG
## Observability i diagnostyka

- usuwaj `console.log`, `debugger` i tymczasowe logi przed merge
- loguj błędy klienta przez narzędzie telemetryczne albo wspólny logger
- dodawaj release version, environment, route i user/session id w formie bezpiecznej dla prywatności
- nie wysyłaj do telemetryki tokenów, haseł, pełnych payloadów formularzy ani danych wrażliwych
- zbieraj Web Vitals dla produkcji, jeśli performance ma znaczenie biznesowe
- dodawaj trace id z API do komunikatu diagnostycznego albo logu
- przy błędach API zapisuj status, code i trace id, nie całe body
- feature flags powinny być widoczne w diagnostyce sesji
- błędy inicjalizacji runtime config powinny być łatwe do odróżnienia od błędów API
## CI, lint i formatowanie

- build musi przechodzić bez błędów TypeScript
- uruchamiaj `sv check` albo `svelte-check` w CI
- uruchamiaj ESLint z `eslint-plugin-svelte`
- uruchamiaj Prettier dla Svelte, TS, JSON, CSS i Markdown
- nie ignoruj ostrzeżeń a11y bez komentarza
- nie commituj build artifacts, jeśli nie są wymagane przez deployment
- blokuj merge przy błędach testów, lintu i typechecku
- używaj lockfile i instalacji frozen/immutable w CI
- cache zależności powinien być oparty o lockfile
- CI powinno budować produkcyjny bundle
- dla SvelteKit uruchamiaj testy po `svelte-kit sync`, jeśli typy generowane nie są gotowe
- sprawdzaj podatności zależności przez narzędzia package managera albo OSV/cargo-deny odpowiednik dla Node
- sprawdzaj licencje, jeśli projekt jest komercyjny albo dystrybuowany
- ustaw minimalną wersję Node w `package.json` albo `.nvmrc` / `.tool-versions`

Przykładowy minimalny zestaw:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm check
pnpm test
pnpm build
pnpm test:e2e
```

Przykładowe skrypty:

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "sv check",
    "lint": "prettier --check . && eslint .",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```
## Review zależności

- przed dodaniem biblioteki sprawdź rozmiar, utrzymanie, licencję, liczbę zależności i SSR compatibility
- nie dodawaj dwóch bibliotek do tego samego problemu, np. dwóch date pickerów albo dwóch systemów toastów
- unikaj paczek bez typów, jeśli będą używane głęboko w aplikacji
- sprawdzaj, czy biblioteka używa browser globals podczas importu, co psuje SSR
- dla bibliotek UI sprawdź dostępność, keyboard support i możliwość stylowania
- dla bibliotek formularzy sprawdź integrację z walidacją, nested fields i błędami serwera
- dla bibliotek wykresów sprawdź koszt bundle i możliwość lazy load
- okresowo usuwaj nieużywane dependencies i devDependencies
## Deployment i hosting

- strategia deployu musi pasować do renderingu: static adapter dla SPA/SSG, node adapter dla SSR/server logic
- przy SPA skonfiguruj fallback do `index.html` dla głębokich linków
- przy reverse proxy zachowuj nagłówki `Authorization`, `Cookie`, `Host`, `X-Forwarded-*`
- ustaw cache headers osobno dla assetów fingerprintowanych, HTML i runtime config
- HTML i runtime config nie powinny mieć długiego immutable cache
- statyczne assety z hashami mogą mieć długi cache
- sprawdź gzip/brotli na serwerze albo CDN
- healthcheck frontendu powinien wykrywać brak plików builda i błędną konfigurację
- jeśli frontend zależy od API, dodaj osobny status API w diagnostyce, nie w zwykłym healthchecku statycznych plików
- source maps w produkcji publikuj świadomie; jeśli trafiają do narzędzia błędów, ogranicz publiczny dostęp
- nie ujawniaj `.env`, map źródłowych z sekretami, manifestów z danymi wewnętrznymi ani plików testowych
## Checklist skrócony do code review

### Architektura

- czy logika domenowa nie siedzi w dużym komponencie?
- czy `routes/` tylko składa ekran i dane routingu?
- czy feature ma własne `api`, `schemas`, `model`, `components`?
- czy `shared` nie zależy od feature'ów?
- czy nie ma globalnego `utils` bez odpowiedzialności?

### Svelte

- czy `$derived` nie ma efektów ubocznych?
- czy `$effect` ma cleanup, jeśli tworzy listener, timer, observer albo subskrypcję?
- czy nie użyto `$effect` zamiast zwykłego wyliczenia?
- czy propsy są typowane?
- czy callback props zastępują `createEventDispatcher` w nowych komponentach?
- czy `$bindable` jest użyte tylko tam, gdzie dwukierunkowy przepływ jest uzasadniony?

### Dane i API

- czy dane z API są typowane albo walidowane?
- czy requesty mają timeout i obsługę anulowania tam, gdzie jest potrzebna?
- czy błędy API są rozróżniane po statusie i kodzie?
- czy retry nie dotyczy błędów walidacji i autoryzacji?
- czy nie ma N requestów w pętli, które powinny być batchem?
- czy duże listy mają paginację albo virtualizację?

### Security

- czy nie ma sekretów w kodzie klienta ani public env?
- czy `{@html}` nie renderuje niezaufanych danych?
- czy tokeny nie są zapisane w localStorage?
- czy API sprawdza permissions niezależnie od UI?
- czy cookies mają `HttpOnly`, `Secure`, `SameSite`?
- czy mutacje cookie-based mają ochronę CSRF?
- czy CORS nie jest `*` dla credentials?
- czy linki i URL-e z API są walidowane?

### Forms

- czy walidacja klienta i serwera nie rozjeżdża się?
- czy walidacja warunkowa jest jawna?
- czy hidden/disabled fields nie są traktowane jako zaufane?
- czy błędy pól trafiają przy właściwe pola?
- czy submit ma loading i ochronę przed podwójnym kliknięciem?
- czy optimistic UI ma rollback?

### Accessibility

- czy nie ma ostrzeżeń a11y bez uzasadnienia?
- czy przyciski i linki używają właściwych elementów?
- czy formularze mają labels i komunikaty błędów?
- czy modal/dropdown działa klawiaturą?
- czy focus jest widoczny i zarządzany po zmianach UI?
- czy kolor nie jest jedynym nośnikiem informacji?

### Performance

- czy główny bundle nie urósł bez powodu?
- czy ciężkie biblioteki są ładowane lazy?
- czy obrazy mają właściwe rozmiary i lazy loading?
- czy keyed each jest użyte przy zmiennych listach?
- czy nie ma kosztownych obliczeń w template?
- czy event listenery i timery są sprzątane?

### Testing i CI

- czy `pnpm check` / `sv check` przechodzi?
- czy ESLint i Prettier przechodzą?
- czy testy pokrywają logikę formularza i błędy API?
- czy E2E pokrywa główne przepływy użytkownika?
- czy build produkcyjny przechodzi w CI?
- czy lockfile jest używany w trybie frozen?
