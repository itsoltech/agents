# svelte-implementation Reference Sector: `load` i pobieranie danych

## Zawartość

- `load` i pobieranie danych
- Komunikacja z API
- Runtime config i zmienne środowiskowe
- Autoryzacja i sesja
- Formularze, Superforms i Zod

## `load` i pobieranie danych

- używaj `load` dla danych potrzebnych route'owi przy wejściu na stronę
- używaj `+page.server.ts` / `+layout.server.ts`, gdy potrzebujesz prywatnych zmiennych środowiskowych, cookies, headers, locals, DB albo sekretów
- używaj `+page.ts` / `+layout.ts`, gdy dane mogą być pobrane po stronie klienta i nie wymagają sekretów
- nie wykonuj efektów ubocznych w `load`; `load` może zostać uruchomiony ponownie
- nie zapisuj danych w globalnym stanie z poziomu `load`, jeśli można zwrócić je przez `data`
- używaj `fetch` przekazanego do `load`, a nie globalnego wrappera bez dostępu do kontekstu requestu
- dla danych zależnych od parametrów route używaj typowanych `params` z `./$types`
- używaj `depends` i `invalidate` świadomie, jeśli dane mają być odświeżane po akcji
- unikaj waterfalli: pobieraj niezależne dane równolegle przez `Promise.all`
- nie pobieraj dużych list bez paginacji
- nie przesyłaj do klienta danych, których UI nie potrzebuje
- rozważ streamowanie/deferred data tam, gdzie dane pomocnicze nie blokują pierwszego renderu
- dla danych często zmiennych rozważ polling, SSE albo WebSocket zamiast ręcznego odświeżania całej strony
## Komunikacja z API

- trzymaj klienta API w jednym module albo w modułach per feature
- nie rozsiewaj `fetch('/api/...')` po komponentach bez wrappera, jeśli projekt ma więcej niż kilka endpointów
- buduj URL przez `URL` i `URLSearchParams`, nie przez ręczne sklejanie stringów
- waliduj odpowiedzi z API na granicy, szczególnie gdy backend nie generuje typów dla frontendu
- stosuj wspólny format błędów API, np. `code`, `message`, `details`, `traceId`
- błędy walidacyjne mapuj do pól formularza, a nie wyłącznie do toastu
- rozróżniaj błędy sieci, timeout, 401, 403, 404, 409, 422 i 5xx
- dodawaj timeouty do requestów
- używaj `AbortController` albo `AbortSignal.timeout()` tam, gdzie środowisko docelowe to wspiera
- anuluj request przy zmianie filtrów, zamknięciu modala albo opuszczeniu ekranu, jeśli wynik nie jest już potrzebny
- nie uruchamiaj nieograniczonej liczby requestów równolegle
- dla autouzupełniania stosuj debounce i anulowanie poprzedniego requestu
- retry stosuj tylko dla błędów chwilowych i metod bezpiecznych albo idempotentnych
- dla mutacji z retry stosuj idempotency key po stronie API
- nie retryuj błędów walidacji i autoryzacji
- nie wysyłaj całego modelu, jeśli endpoint potrzebuje tylko części pól
- nie ufaj danym ukrytym w UI; backend musi sprawdzać ownership, permissions i stan rekordu
- przy osobnym backendzie ustal jedną strategię auth: cookies same-site, token w pamięci, BFF albo reverse proxy
- jeśli używasz cookies, ustaw `credentials: 'include'` tylko tam, gdzie jest potrzebne
- CORS konfiguruj po stronie API jako białą listę originów, nie jako `*` dla endpointów z credentials
- CORS nie zastępuje autoryzacji

Przykładowy minimalny wrapper:

```ts
export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
  traceId?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: ApiErrorBody | null,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  fetchFn: typeof fetch,
  input: string | URL,
  init: RequestInit & { timeoutMs?: number } = {},
  parse: (value: unknown) => T,
): Promise<T> {
  const { timeoutMs = 15_000, ...requestInit } = init;
  const signal = requestInit.signal ?? AbortSignal.timeout(timeoutMs);

  const response = await fetchFn(input, {
    ...requestInit,
    signal,
    headers: {
      accept: 'application/json',
      ...requestInit.headers,
    },
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(
      body?.message ?? `Request failed with status ${response.status}`,
      response.status,
      body,
    );
  }

  return parse(body);
}
```
## Runtime config i zmienne środowiskowe

- zmienne bez prefiksu publicznego traktuj jako prywatne
- wartości dostępne w bundle przeglądarkowym nie są sekretami
- w SvelteKit używaj public/private env zgodnie z miejscem wykonania kodu
- nie importuj prywatnych env w kodzie, który może trafić do przeglądarki
- dla kontenerów budowanych raz i uruchamianych w wielu środowiskach preferuj runtime config zamiast bake'owania env do bundle
- runtime config pobieraj raz przy starcie aplikacji albo w root layoucie
- waliduj runtime config przez Zod/Valibot przed użyciem
- nie zapisuj w runtime config sekretów, tylko publiczne adresy API, feature flags i ustawienia UI
- wersjonuj kształt configu, jeśli kilka wersji frontendu może działać równolegle
- dodaj fallback UX dla braku configu, np. ekran błędu konfiguracji zamiast pustej aplikacji

Przykład schematu configu:

```ts
import { z } from 'zod';

export const runtimeConfigSchema = z.object({
  apiBaseUrl: z.string().url(),
  environment: z.enum(['local', 'dev', 'staging', 'production']),
  appVersion: z.string().min(1),
  features: z.record(z.string(), z.boolean()).default({}),
});

export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;
```
## Autoryzacja i sesja

- UI może ukrywać akcje, ale API musi sprawdzić uprawnienia dla każdej mutacji i każdego odczytu
- nie traktuj route guarda w SPA jako zabezpieczenia danych
- preferuj sesję w cookie `HttpOnly`, `Secure`, `SameSite=Lax` albo `Strict`, jeśli architektura na to pozwala
- nie zapisuj długowiecznych access tokenów w `localStorage`
- jeśli token musi być po stronie klienta, trzymaj go możliwie krótko w pamięci i ogranicz jego zakres oraz czas życia
- refresh token nie powinien być dostępny dla JavaScript
- po logout wyczyść client state, query cache, localStorage związany z użytkownikiem i dane formularzy
- odświeżanie sesji powinno mieć limit i obsługę błędów
- nie pokazuj przez chwilę danych poprzedniego użytkownika po zmianie konta
- nie opieraj permissions tylko na rolach z client state; po stronie API sprawdzaj także ownership i tenant
- przy wielu tenantach tenant id z URL albo UI traktuj jako niezaufane wejście
- w odpowiedziach API nie wysyłaj pól, których użytkownik nie powinien widzieć
## Formularze, Superforms i Zod

- używaj natywnych formularzy i progressive enhancement, jeśli aplikacja korzysta z SvelteKit server actions
- w czystym SPA formularz może wysyłać dane przez API client, ale walidacja serwerowa nadal jest obowiązkowa
- Zod/Superforms traktuj jako wspólny kontrakt walidacji UI i requestu
- nie utrzymuj osobnych, rozjeżdżających się definicji walidacji dla klienta i serwera
- walidację warunkową zapisuj jawnie przez `refine`, `superRefine` albo uniony wariantów formularza
- jeśli pole jest ukryte warunkowo, ustal czy ma być czyszczone, zachowane czy ignorowane przy submit
- nie ufaj polom hidden, disabled ani wartościom pochodzącym z DOM
- pamiętaj, że disabled input nie jest wysyłany w natywnym submit formularza
- błędy pól pokazuj przy polu, a błędy globalne formularza w miejscu widocznym dla użytkownika
- nie wysyłaj requestu, jeśli lokalna walidacja wykrywa oczywisty błąd
- nie blokuj możliwości submit tylko przez disabled button bez komunikatu błędu
- przy długim submit pokazuj stan loading i blokuj podwójne kliknięcie
- dla mutacji ryzykownych dodaj confirmation flow albo undo, jeśli pasuje do produktu
- optimistic UI stosuj tylko z rollbackiem
- przy uploadach pokazuj rozmiar, typ pliku, postęp i obsługę anulowania
- formularz wieloetapowy powinien mieć jawny model stanu, nie luźny zestaw zmiennych w kilku komponentach

Przykład walidacji warunkowej:

```ts
import { z } from 'zod';

export const userFormSchema = z
  .object({
    isCompany: z.boolean(),
    companyName: z.string().trim().optional(),
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
  })
  .superRefine((value, ctx) => {
    if (value.isCompany && !value.companyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyName'],
        message: 'Nazwa firmy jest wymagana',
      });
    }
  });
```
