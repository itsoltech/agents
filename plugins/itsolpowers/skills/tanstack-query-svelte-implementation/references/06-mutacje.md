# tanstack-query-svelte-implementation Reference Sector: Mutacje

## Zawartość

- Mutacje
- Statusy mutacji w v5
- Invalidacje po mutacjach
- Aktualizacja cache przez `setQueryData`
- Optimistic updates

## Mutacje

Mutacje służą do operacji, które zmieniają stan po stronie serwera albo wywołują efekt uboczny: create, update, delete, upload, assign, confirm, cancel.

```svelte
<script lang="ts">
  import { createMutation, useQueryClient } from '@tanstack/svelte-query'
  import { createUser } from '$lib/api/users'
  import { usersKeys } from '$lib/queries/users.keys'

  const queryClient = useQueryClient()

  const createUserMutation = createMutation(() => ({
    mutationKey: ['users', 'create'],
    mutationFn: createUser,
    onSuccess: async (createdUser) => {
      queryClient.setQueryData(usersKeys.detail(createdUser.id), createdUser)
      await queryClient.invalidateQueries({ queryKey: usersKeys.lists() })
    },
  }))
</script>

<button
  disabled={createUserMutation.isPending}
  onclick={() => createUserMutation.mutate({ name: 'Adam', email: 'adam@example.com' })}
>
  Dodaj użytkownika
</button>
```

Zasady:

- do zapisu używaj `createMutation`, nie `createQuery`
- używaj `mutationKey`, jeśli chcesz obserwować mutacje globalnie albo grupować je w devtools
- po mutacji zaktualizuj cache przez `setQueryData` albo invaliduj odpowiednie queries
- nie invaliduj całego cache, jeśli można invalidować konkretny zakres
- po mutacji listy invaliduj listy, które mogły się zmienić
- po mutacji szczegółu zaktualizuj szczegół przez `setQueryData`, jeśli masz świeżą odpowiedź z backendu
- `mutationFn` powinna zwracać dane potrzebne do aktualizacji cache
- dla akcji typu delete zdecyduj, czy usuwasz element z cache ręcznie, czy invalidujesz listę
- nie wykonuj nawigacji, toastów i globalnych side effectów w wielu miejscach naraz
- jeśli `onSuccess` wykonuje invalidację i UI ma pozostać pending do końca refetchu, zwróć Promise z `invalidateQueries`
## Statusy mutacji w v5

W v5 mutacje używają statusu `pending`.

Najczęściej używane pola:

- `isIdle`
- `isPending`
- `isError`
- `isSuccess`
- `data`
- `error`
- `variables`

Zasady UI:

- przycisk submit blokuj przez `mutation.isPending`
- nie używaj `mutation.isLoading` w kodzie v5
- pokazuj błąd z `mutation.error`, ale mapuj go na bezpieczny komunikat
- nie resetuj formularza przed sukcesem mutacji
- obsługuj double submit
- dla destructive actions wymagaj potwierdzenia po stronie UI
## Invalidacje po mutacjach

Invalidacja oznacza oznaczenie query jako stale i uruchomienie refetchu, jeśli query jest aktywne.

Przykłady:

```ts
await queryClient.invalidateQueries({
  queryKey: usersKeys.lists(),
})
```

```ts
await queryClient.invalidateQueries({
  queryKey: usersKeys.detail(userId),
})
```

```ts
await queryClient.invalidateQueries({
  predicate: (query) => {
    return query.queryKey[0] === 'users'
  },
})
```

Zasady:

- invaliduj tylko zakres danych, który mógł się zmienić
- dla create zwykle invaliduj listy i ewentualnie ustaw detail w cache
- dla update zwykle ustaw detail i invaliduj listy zależne od filtrów
- dla delete usuń detail albo invaliduj detail, a listy invaliduj
- po zmianie uprawnień invaliduj dane zależne od permissions
- po zmianie tenanta wyczyść albo odseparuj cache
- po logout usuń dane użytkownika przez `queryClient.clear()` albo precyzyjne `removeQueries`
- nie używaj `refetch` w losowych komponentach jako zamiennika dla invalidacji po mutacji
## Aktualizacja cache przez `setQueryData`

`setQueryData` aktualizuje cache bez requestu. Używaj go, gdy masz kompletne, wiarygodne dane po mutacji.

```ts
queryClient.setQueryData(usersKeys.detail(updatedUser.id), updatedUser)
```

Aktualizacja listy:

```ts
queryClient.setQueryData<User[]>(usersKeys.list(), (previous) => {
  if (!previous) return previous

  return previous.map((user) => {
    if (user.id !== updatedUser.id) return user
    return updatedUser
  })
})
```

Zasady:

- nigdy nie mutuj danych z cache in-place
- updater powinien zwracać nową referencję, jeśli dane się zmieniły
- nie zakładaj, że `previous` istnieje
- nie aktualizuj ręcznie wszystkich możliwych list, jeśli filtry są złożone; invalidacja może być bezpieczniejsza
- po ręcznym update cache nadal rozważ invalidację w tle, jeśli backend może zmienić dodatkowe pola
- nie zapisuj do cache danych w innym kształcie niż zwraca `queryFn`
## Optimistic updates

Optimistic update pokazuje zmianę w UI przed odpowiedzią serwera. Stosuj go tam, gdzie operacja jest szybka, przewidywalna i łatwa do cofnięcia.

Przykład:

```ts
const updateUserMutation = createMutation(() => ({
  mutationKey: ['users', 'update'],
  mutationFn: updateUser,

  onMutate: async (variables, context) => {
    await context.client.cancelQueries({ queryKey: usersKeys.detail(variables.id) })

    const previousUser = context.client.getQueryData<User>(usersKeys.detail(variables.id))

    context.client.setQueryData<User>(usersKeys.detail(variables.id), (current) => {
      if (!current) return current

      return {
        ...current,
        ...variables.patch,
      }
    })

    return { previousUser }
  },

  onError: (_error, variables, rollback, context) => {
    if (rollback?.previousUser) {
      context.client.setQueryData(usersKeys.detail(variables.id), rollback.previousUser)
    }
  },

  onSettled: async (_data, _error, variables, _rollback, context) => {
    await context.client.invalidateQueries({ queryKey: usersKeys.detail(variables.id) })
    await context.client.invalidateQueries({ queryKey: usersKeys.lists() })
  },
}))
```

Zasady:

- przed optimistic update anuluj wychodzące query dla danego key
- zapisz snapshot poprzednich danych
- rollback musi przywracać poprzedni stan
- `onSettled` powinien invalidować dane, żeby wyrównać cache z backendem
- nie stosuj optimistic update dla operacji o złożonych skutkach ubocznych, jeśli nie umiesz wiarygodnie odtworzyć wyniku
- dla wielu równoległych mutacji używaj `submittedAt` albo innych identyfikatorów, jeśli UI musi rozróżnić pending items
- nie aktualizuj optymistycznie danych, których użytkownik nie ma prawa zobaczyć po stronie backendu
