# svelte-debugging Reference Sector: Deployment i hosting

## Zawartość

- Deployment i hosting
- SPA z osobnym API
- SSR/SvelteKit server mode

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
