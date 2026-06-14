# tanstack-query-svelte-review Reference Sector: API client i `fetch`

## Zawartość

- API client i `fetch`
- Cancellation
- Transformacja danych przez `select`

## API client i `fetch`

`fetch` nie rzuca błędu dla odpowiedzi HTTP 4xx i 5xx. `queryFn` musi rzucić błąd samodzielnie, bo TanStack Query rozpoznaje błąd po odrzuconym Promise.

```ts
// src/lib/api/api-error.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
```

```ts
// src/lib/api/api-fetch.ts
import { browser } from '$app/environment'
import { PUBLIC_API_URL } from '$env/static/public'
import { ApiError } from './api-error'

type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | object | null
  fetch?: typeof fetch
}

const isBodyInit = (body: unknown): body is BodyInit => {
  return (
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    typeof body === 'string'
  )
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const requestFetch = options.fetch ?? fetch
  const headers = new Headers(options.headers)
  const url = browser ? `${PUBLIC_API_URL}${path}` : `${PUBLIC_API_URL}${path}`

  headers.set('Accept', 'application/json')

  let body: BodyInit | null | undefined

  if (options.body === undefined || options.body === null) {
    body = options.body
  } else if (isBodyInit(options.body)) {
    body = options.body
  } else {
    body = JSON.stringify(options.body)
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
  }

  const response = await requestFetch(url, {
    ...options,
    body,
    headers,
    credentials: options.credentials ?? 'include',
  })

  const contentType = response.headers.get('content-type') ?? ''
  const responseBody = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null)

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status, responseBody)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return responseBody as T
}
```

Zasady API clienta:

- każdy request powinien mieć timeout albo możliwość anulowania przez `AbortSignal`
- przekazuj `signal` z `queryFn` do `fetch`
- nie ignoruj statusów 4xx i 5xx
- typuj odpowiedzi API na granicy klienta
- waliduj odpowiedzi runtime, jeśli backend albo zewnętrzne API nie jest w pełni kontrolowane
- nie buduj URL przez sklejanie surowych wartości użytkownika bez `encodeURIComponent` albo `URLSearchParams`
- nie loguj tokenów, cookies, pełnych headerów ani pełnych payloadów z danymi wrażliwymi
- w SvelteKit `load` używaj `fetch` przekazanego w argumentach `load`
- nie wkładaj `fetch` do query key
- nie przechowuj access tokenów w query data

Przykład query z `signal`:

```ts
// src/lib/api/users.ts
import { apiFetch } from './api-fetch'

export type User = {
  id: string
  name: string
  email: string
}

export const getUser = (id: string, options: { signal?: AbortSignal; fetch?: typeof fetch } = {}) => {
  return apiFetch<User>(`/users/${encodeURIComponent(id)}`, {
    signal: options.signal,
    fetch: options.fetch,
  })
}
```

```svelte
<script lang="ts">
  const userQuery = createQuery(() => ({
    queryKey: usersKeys.detail(userId),
    queryFn: ({ signal }) => getUser(userId, { signal }),
  }))
</script>
```
## Cancellation

TanStack Query przekazuje `AbortSignal` do `queryFn`. Jeżeli `signal` zostanie użyty przez `fetch`, request może zostać anulowany, gdy query stanie się nieaktualne albo nieaktywne.

Zasady:

- przekazuj `signal` do każdego `fetch` w `queryFn`
- jeżeli `queryFn` wykonuje kilka requestów, przekaż ten sam `signal` do każdego z nich
- nie łap `AbortError` i nie zamieniaj go bezmyślnie na zwykły błąd UI
- nie używaj cancellation jako zamiennika dla debounce przy polach wyszukiwania
- przy dynamicznym search łącz debounce z query key zależnym od znormalizowanego search term
- długie operacje po stronie backendu powinny mieć własny mechanizm anulowania albo job status, jeśli samo przerwanie HTTP nie wystarcza
## Transformacja danych przez `select`

`select` służy do wyboru fragmentu danych albo lekkiej transformacji wyniku query.

```svelte
<script lang="ts">
  const activeUsersQuery = createQuery(() => ({
    queryKey: usersKeys.list({ status: 'active' }),
    queryFn: ({ signal }) => getUsers({ filters: { status: 'active' }, signal }),
    select: (users) => users.map((user) => ({
      id: user.id,
      label: user.name,
    })),
  }))
</script>
```

Zasady:

- używaj `select`, gdy komponent potrzebuje mniejszego albo prostszego kształtu danych
- nie wykonuj ciężkich obliczeń w `select` bez pomiaru
- nie mutuj danych wejściowych w `select`
- nie sortuj in-place danych z cache; twórz kopię przed sortowaniem
- jeżeli transformacja jest domenowa i powtarzalna, przenieś ją do funkcji poza komponentem
- jeśli backend może zwrócić gotowy format, nie dubluj kosztownej transformacji po stronie klienta
