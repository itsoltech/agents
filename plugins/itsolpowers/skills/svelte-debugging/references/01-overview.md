# svelte-debugging Reference Sector: Overview

## Zawartość

- Overview
- Svelte 5 reactivity
- Props, events, bind i snippets
- State management
- SvelteKit routing i rendering
- `load` i pobieranie danych
- Komunikacja z API
- Runtime config i zmienne środowiskowe


## Svelte 5 reactivity

- używaj `$state` dla lokalnego, mutowalnego stanu komponentu albo klasy pomocniczej
- używaj `$derived` dla wartości wyliczanych ze stanu
- `$derived` powinien być czysty, bez requestów, logowania, mutacji i efektów ubocznych
- używaj `$effect` do synchronizacji z DOM, browser API, zewnętrzną biblioteką albo subskrypcją
- nie używaj `$effect` do przepisywania danych, które można policzyć przez `$derived`
- każdy `$effect`, który tworzy subskrypcję, timer, observer albo listener, powinien zwracać cleanup
- nie zakładaj, że wartości przeczytane po `await`, w `setTimeout` albo callbacku zostaną automatycznie śledzone przez `$effect`
- pamiętaj, że `$effect` nie uruchamia się podczas SSR
- do kodu uruchamianego raz po zamontowaniu używaj `onMount`, jeśli nie potrzebujesz reaktywnego efektu
- nie rób requestów w `$effect`, jeśli dane są potrzebne przez routing i mogą być pobrane w `load`
- nie twórz cykli: effect zmienia stan, który uruchamia ten sam effect bez warunku końca
- jeśli stan jest przekazywany poza komponent, opisz ownership i miejsce mutacji
- unikaj mieszania legacy `$:` i runes w nowych plikach
- przy migracji ze Svelte 4 ogranicz zakres zmiany i nie mieszaj refaktoru reactivity z dużą zmianą biznesową
## Props, events, bind i snippets

- typuj propsy przez `$props()`
- ustawiaj domyślne wartości propsów tylko tam, gdzie default ma sens biznesowy albo UI
- nie mutuj propsów, jeśli komponent nie dostał do tego jawnego kontraktu
- używaj callback props zamiast `createEventDispatcher` w nowych komponentach Svelte 5
- nazwy callbacków zapisuj jako akcje, np. `onSave`, `onCancel`, `onSelectedChange`
- przekazuj w callbacku dane potrzebne rodzicowi, ale nie cały stan komponentu bez potrzeby
- używaj `$bindable` oszczędnie; dwukierunkowy przepływ danych utrudnia debugowanie większych ekranów
- `bind:` stosuj głównie w inputach, prostych wrapperach inputów i kontrolowanych komponentach formularzy
- do wielokrotnego użycia fragmentu markup w obrębie komponentu używaj snippetów
- do wielokrotnego użycia zachowania, lifecycle albo kontraktu API używaj komponentu
- unikaj przekazywania dużych obiektów przez rest props bez kontroli
- nie mieszaj wielu sposobów komunikacji w jednym komponencie: propsy, context, store i events naraz
## State management

- domyślnie trzymaj stan jak najbliżej miejsca użycia
- stan formularza trzymaj przy formularzu
- stan filtrów, sortowania i paginacji zapisuj w URL, jeśli ma być linkowalny albo odtwarzalny po odświeżeniu
- dane pobrane przez routing trzymaj w `data` z `load`, nie duplikuj ich w globalnym store bez powodu
- używaj context dla stanu ograniczonego do poddrzewa komponentów, np. tabela, wizard, formularz wieloetapowy
- używaj stores albo modułów `.svelte.ts` dla współdzielonego stanu klienta
- nie przechowuj per-user/per-request state w module scope po stronie serwera SvelteKit
- w SSR per-request state trzymaj w `event.locals`, `load`, `data` albo context tworzonym per request
- w SPA globalny client store jest dopuszczalny, ale nadal powinien mieć jasny właściciel, reset i lifecycle
- po logout wyczyść stores, cache API i dane użytkownika w pamięci
- nie zapisuj w store danych, które można jednoznacznie wyliczyć przez `$derived`
- nie używaj globalnego store jako event busa dla losowych zdarzeń
- dla złożonych przepływów rozważ maszynę stanów albo jawny reducer
## SvelteKit routing i rendering

- wybierz rendering per route: SSR, CSR, prerender albo SPA fallback
- nie wyłączaj SSR globalnie, jeśli część aplikacji korzysta z SEO, szybkiego pierwszego HTML albo danych serwerowych
- dla czystej aplikacji panelowej SPA użyj `adapter-static` z fallbackiem albo świadomie ustaw `ssr = false`
- przy `ssr = false` kod komponentów działa tylko w przeglądarce, ale nadal sprawdzaj importy modułów używanych przez SvelteKit
- nie używaj `window`, `document`, `localStorage`, `ResizeObserver` poza kodem klienta
- browser API wywołuj w `onMount`, `$effect` albo po sprawdzeniu `browser` z `$app/environment`
- `+layout.ts` używaj do danych wspólnych dla grupy tras
- nie pobieraj tych samych danych w wielu sąsiadujących page loadach, jeśli można pobrać je w layoucie
- używaj route groups do rozdzielenia public, auth, app, admin
- trasy chronione sprawdzaj po stronie serwera, jeśli aplikacja działa SSR/server mode
- w czystym SPA route guard w kliencie poprawia UX, ale nie zabezpiecza API
- `+error.svelte` projektuj jako część UX, nie jako debug page
- nie ujawniaj stack trace i szczegółów infrastruktury w błędach dla użytkownika
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
