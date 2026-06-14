# hey-api-openapi-review Reference Sector: Svelte i SvelteKit

## Zawartość

- Svelte i SvelteKit
- Multi API, monorepo i wiele outputów
- Bezpieczeństwo generowanego klienta
- Error handling
- Caching i invalidation
- Wydajność i bundle size
- Review wygenerowanego kodu
- Testy

## Svelte i SvelteKit

- trzymaj generated output w `src/lib/api/generated`
- konfigurację runtime trzymaj poza katalogiem generated
- publiczny `baseUrl` pobieraj z `$env/static/public` albo `$env/dynamic/public`
- prywatne sekrety pobieraj tylko po stronie server, np. w `+server.ts`, `+page.server.ts`, `hooks.server.ts`
- nie importuj `$env/static/private` do kodu, który może trafić do klienta
- w `load` po stronie SvelteKit korzystaj z frameworkowego `fetch`, jeśli request ma używać cookies SSR
- dla server-only API wrapperów trzymaj pliki z sufiksem `.server.ts`
- dla browser-only kodu nie importuj modułów server-only
- nie konfiguruj globalnego klienta w komponencie Svelte
- konfiguracja klienta powinna odbywać się na starcie aplikacji, w runtime config albo w wrapperze
- jeśli SSR i browser mają różny sposób auth, rozdziel klient server i client
- nie przenoś tokenów server-side do browser przez `load`, jeśli nie muszą być publiczne
- jeśli korzystasz z TanStack Query w SvelteKit, ustal zasady prefetch, hydration i invalidation
- nie wykonuj tego samego requestu równolegle w `load` i w komponencie bez uzasadnienia

Przykład wrappera dla requestów server-side:

```ts
// src/lib/api/server-api.server.ts
import { PRIVATE_API_BASE_URL, PRIVATE_API_TOKEN } from '$env/static/private';
import { createClient } from './generated/client/client';

export const serverApiClient = createClient({
  auth: () => PRIVATE_API_TOKEN,
  baseUrl: PRIVATE_API_BASE_URL,
});
```
## Multi API, monorepo i wiele outputów

- dla wielu API używaj wielu jobów albo job matrix
- osobne API powinny zwykle mieć osobne katalogi output
- merge kilku inputów do jednego outputu stosuj tylko wtedy, gdy nazwy operacji i schemas są kontrolowane
- przy merge inputów wymuszaj unikalne `operationId`
- konflikty nazw w generated code traktuj jako problem kontraktu, nie tylko problem generatora
- jeśli generator dodaje suffix numeryczny do konfliktu, rozwiąż przyczynę w specyfikacji
- w monorepo trzymaj generated client blisko aplikacji, która go używa, albo publikuj go jako osobny pakiet
- jeśli client jest osobnym pakietem, wersjonuj go zgodnie z wersją API
- nie pozwalaj kilku aplikacjom modyfikować tego samego katalogu generated output
- jeśli API jest współdzielone, przygotuj osobny package, np. `@company/api-client`

Przykład wielu jobów:

```ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig([
  {
    input: './openapi/billing.json',
    output: 'src/lib/api/billing/generated',
    plugins: ['@hey-api/client-fetch', '@hey-api/typescript', '@hey-api/sdk'],
  },
  {
    input: './openapi/identity.json',
    output: 'src/lib/api/identity/generated',
    plugins: ['@hey-api/client-fetch', '@hey-api/typescript', '@hey-api/sdk'],
  },
]);
```
## Bezpieczeństwo generowanego klienta

- wygenerowany klient nie zastępuje kontroli dostępu po stronie backendu
- nie generuj publicznego klienta z wewnętrznej administracyjnej specyfikacji, jeśli bundle może trafić do użytkownika
- nie eksportuj z frontendu endpointów, których użytkownik nie powinien znać
- nie zakładaj, że ukrycie przycisku w UI blokuje operację
- nie przechowuj sekretów w generated output
- nie commituj specyfikacji z przykładami prawdziwych tokenów, haseł, kluczy API albo danych osobowych
- nie wysyłaj tokenów w query stringach
- nie loguj pełnych requestów i response, jeśli mogą zawierać dane użytkownika
- nie pokazuj użytkownikowi surowych błędów backendu z stack trace albo nazwami tabel
- response validation nie jest kontrolą bezpieczeństwa, ale może wcześnie wykryć drift kontraktu
- mass assignment i nadmiarowe pola muszą być blokowane na backendzie, nie w generated client
- każdy endpoint operujący na ID obiektu musi mieć server-side authorization
- rate limiting, quotas i abuse protection są po stronie backendu
- CORS nie jest mechanizmem autoryzacji
- CSRF dotyczy głównie cookie-based auth i musi być obsłużone po stronie backendu
- jeśli generated source zawiera pełną specyfikację, traktuj go jako dokument mogący ujawniać strukturę API
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
## Caching i invalidation

- generated client sam nie rozwiązuje cache; użyj TanStack Query albo innej warstwy cache świadomie
- query key musi opisywać wszystkie parametry wpływające na wynik
- nie mieszaj ręcznych query keys z generated query keys dla tych samych endpointów
- po mutacji invaliduj tylko zależne query
- dla list i szczegółów obiektu ustal zasady invalidation
- jeśli mutacja tworzy obiekt, zaktualizuj listę albo invaliduj listę
- jeśli mutacja aktualizuje obiekt, zaktualizuj szczegół albo invaliduj szczegół
- jeśli endpoint zależy od uprawnień użytkownika, wyczyść cache po logout
- nie współdziel cache między użytkownikami po stronie server
- w SSR nie twórz globalnego query clienta dla wszystkich requestów
- przy multi-tenant aplikacji query key musi rozróżniać tenant albo cache musi być czyszczony przy zmianie tenanta
## Wydajność i bundle size

- preferuj flat SDK dla tree-shaking
- importuj konkretne funkcje zamiast całego entrypointu, jeśli bundler nie usuwa nieużywanego kodu
- używaj `import type` dla typów
- nie generuj runtime enumów, zod schemas, query helpers i SDK klas, jeśli projekt ich nie używa
- walidacja Zod response ma koszt runtime
- generated output może zwiększyć czas typechecku; filtruj specyfikację, jeśli aplikacja używa tylko części API
- unikaj ogromnych wspólnych schema z setkami pól, jeśli frontend używa kilku małych DTO
- nie pobieraj wielkich list bez paginacji
- nie rób requestu w każdym komponencie, jeśli dane mogą być pobrane raz wyżej
- nie twórz nowej instancji klienta przy każdym renderze komponentu
- nie rejestruj interceptorów przy każdym renderze komponentu
- nie generuj klienta podczas każdego lokalnego uruchomienia, jeśli specyfikacja nie zmienia się często
- w CI cache'uj dependencies, ale nie cache'uj generated output zamiast sprawdzać deterministyczną generację
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
