# svelte-implementation Reference Sector: CI, lint i formatowanie

## Zawartość

- CI, lint i formatowanie
- Review zależności
- Deployment i hosting
- SPA z osobnym API
- SSR/SvelteKit server mode

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
## SPA z osobnym API

- przy SPA cały kod autoryzacji klienta traktuj jako UX, nie security boundary
- API musi wymuszać auth, permissions, tenant isolation i walidację
- konfigurację API base URL pobieraj z runtime config albo ustawiaj przez reverse proxy
- jeśli różne środowiska używają tego samego obrazu kontenera, nie bake'uj API URL do bundle
- fallback route musi działać dla deep linków, np. `/app/orders/123`
- 404 aplikacyjne obsługuj w routerze, a 404 plików statycznych w hostingu
- przy deployu przez CDN/proxy sprawdź cache HTML po wdrożeniu nowej wersji
- po logout wyczyść dane klienta, bo SPA nie resetuje procesu JS automatycznie
- odświeżenie strony powinno odtworzyć stan z URL, API albo storage, nie z pamięci poprzedniego flow
## SSR/SvelteKit server mode

- nie trzymaj per-request/per-user danych w module scope
- dane użytkownika trzymaj w `event.locals`, cookies, `load` albo zależnościach tworzonych per request
- nie importuj sekretów do kodu klienta
- `+server.ts` może pełnić rolę BFF/proxy, jeśli chcesz ukryć backend albo uprościć cookies/CORS
- BFF nie zwalnia backendu z auth, jeśli backend jest dostępny także inną drogą
- server load może używać prywatnych env i cookies
- uniwersalny load może wykonać się po stronie serwera i klienta, więc nie wkładaj tam sekretów
- unikaj globalnych cache'y z danymi użytkownika
- cache po stronie serwera musi mieć key z tenant/user/permissions, jeśli dane są zależne od użytkownika
- przy streaming SSR sprawdzaj, czy błędy późnych danych są obsłużone w UI
