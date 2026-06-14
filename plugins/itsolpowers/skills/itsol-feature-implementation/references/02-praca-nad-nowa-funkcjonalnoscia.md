# itsol-feature-implementation Reference Sector: Praca nad nową funkcjonalnością

## Zawartość

- Praca nad nową funkcjonalnością

## Praca nad nową funkcjonalnością

### Sposób myślenia

Przy nowej funkcjonalności deweloper powinien myśleć w kategoriach przepływu użytkownika i konsekwencji technicznych.

Główne pytanie:

```text
Jakie nowe zachowanie ma zobaczyć użytkownik i co musi się wydarzyć w systemie, żeby to zachowanie było poprawne?
```

Nowa funkcjonalność rzadko oznacza tylko dodanie komponentu albo endpointu. Zwykle wymaga decyzji o danych, błędach, uprawnieniach, cache, testach i utrzymaniu.

### Zrozumienie wartości

Pytania:

```text
Kto jest użytkownikiem tej funkcji?
Co użytkownik próbuje osiągnąć?
Co dzisiaj robi ręcznie albo przez obejście?
Po czym poznamy, że funkcja działa?
Jakie zachowanie jest akceptowalne w pierwszej wersji?
Co może poczekać na kolejną iterację?
```

Dobre zachowanie:

```text
Deweloper potrafi jednym zdaniem powiedzieć, po co funkcja istnieje.
```

Przykład:

```text
Dodajemy historię zmian ceny, żeby manager mógł sprawdzić źródło różnic w raportach i audytować zmiany wykonane przez pracowników.
```

### Granice zakresu

Zakres trzeba chronić. Nowa funkcjonalność łatwo rośnie, jeśli każde „przy okazji” trafia do tego samego zadania.

Pytania:

```text
Czy to jest wymagane przez acceptance criteria?
Czy bez tego funkcja nie działa?
Czy to jest edge case, który musi być obsłużony teraz?
Czy to jest refaktor potrzebny do wdrożenia, czy osobna poprawa?
Czy to można wydzielić do kolejnego zadania?
```

Przykład overengineeringu:

```text
Zadanie wymaga dodać prostą historię zmian ceny, a deweloper buduje generyczny silnik audytu dla całego systemu.
```

Lepsze podejście:

```text
Zbudować historię zmian ceny w sposób, który nie blokuje późniejszego rozszerzenia na inne encje.
```

### Projektowanie przepływu end-to-end

Deweloper powinien przejść funkcję od wejścia do wyjścia:

```text
UI -> walidacja -> API -> autoryzacja -> logika -> baza -> event/cache -> odpowiedź -> UI update
```

Pytania:

```text
Czy użytkownik widzi natychmiastowy feedback?
Czy operacja jest idempotentna?
Czy można ją wykonać dwa razy?
Czy można ją cofnąć?
Czy odpowiedź API zawiera wszystko, czego potrzebuje UI?
Czy po mutacji trzeba invalidować cache?
Czy live event powinien zaktualizować inne otwarte sesje?
Czy jest konflikt, gdy dwóch użytkowników edytuje te same dane?
Czy trzeba obsłużyć optimistic update?
```

### Dane i model

Pytania:

```text
Czy dane już istnieją, czy trzeba dodać nową strukturę?
Czy nowe pole może być nullable?
Czy stare rekordy będą miały wartość?
Czy trzeba dodać migrację?
Czy trzeba wypełnić dane historyczne?
Czy nowa relacja wymaga indeksu?
Czy usunięcie encji ma wpływ na nowe dane?
Czy potrzebny jest audit trail?
```

Typowe błędy:

- dodanie nullable pola bez decyzji, jak UI ma je interpretować
- brak migracji dla istniejących danych
- brak indeksu dla nowego filtra
- założenie, że wszystkie stare dane są poprawne
- brak obsługi usuniętych albo zarchiwizowanych rekordów
- brak wersjonowania kontraktu, gdy API jest używane przez wiele klientów

### API i kontrakt

Pytania:

```text
Czy endpoint powinien być nowy, czy istniejący powinien zostać rozszerzony?
Czy zmiana jest kompatybilna wstecznie?
Czy kontrakt API ma jasne typy?
Czy błędy mają spójny format?
Czy statusy HTTP są poprawne?
Czy API waliduje dane niezależnie od frontendu?
Czy użytkownik ma permission do tej operacji?
Czy tenant ID jest brany z kontekstu auth, a nie z niezaufanego inputu?
```

Dobre zachowanie:

```text
Deweloper sprawdza wygenerowany klient API albo OpenAPI diff, jeśli projekt korzysta z kontraktu OpenAPI.
```

Złe zachowanie:

```text
Frontend zakłada kształt odpowiedzi, którego backend formalnie nie gwarantuje.
```

### Frontend i UX stany techniczne

Każda funkcjonalność frontendowa powinna mieć obsłużone stany:

- loading
- error
- empty
- partial data
- disabled
- optimistic state
- success feedback
- validation errors
- permission denied
- stale data
- offline albo reconnect, jeśli aplikacja tego wymaga

Pytania:

```text
Co użytkownik widzi przed załadowaniem danych?
Co użytkownik widzi, gdy lista jest pusta?
Co użytkownik widzi, gdy API zwróci 403?
Co użytkownik widzi, gdy API zwróci 500?
Czy przycisk można kliknąć kilka razy?
Czy formularz blokuje submit podczas zapisu?
Czy błąd walidacji jest przypisany do konkretnego pola?
Czy po zapisie użytkownik widzi aktualne dane?
```

### Cache i live eventy

Przy aplikacji korzystającej z TanStack Query, live eventów, WebSocketów albo SSE, każda nowa funkcjonalność powinna mieć zaplanowaną strategię spójności danych.

Pytania:

```text
Jakie query keys zależą od tej zmiany?
Czy po mutacji wystarczy invalidateQueries?
Czy lepsze będzie setQueryData?
Czy event live powinien zaktualizować konkretny rekord?
Czy event ma revision/cursor do deduplikacji?
Czy użytkownik, który wykonał mutację, dostanie echo eventu?
Czy echo eventu może nadpisać optimistic update?
Czy lista i szczegóły tej samej encji pozostaną spójne?
Czy po reconnect trzeba wykonać resync?
```

Typowe problemy:

- invalidacja za szeroka i powoduje lawinę requestów
- invalidacja za wąska i część UI pokazuje stare dane
- live event aktualizuje listę, ale nie szczegóły
- optimistic update jest nadpisywany przez stary event
- event nie ma tenant ID albo resource ID
- event nie ma wersji schematu
- reconnect nie pobiera zmian utraconych podczas przerwy

### Bezpieczeństwo

Pytania:

```text
Czy funkcja wymaga nowego permission?
Czy backend sprawdza uprawnienia niezależnie od UI?
Czy dane są filtrowane per tenant?
Czy endpoint nie ujawnia danych przez IDOR?
Czy input jest walidowany?
Czy upload ma limit rozmiaru i typu?
Czy nowe logi nie zawierają sekretów ani danych wrażliwych?
Czy tokeny, hasła i klucze nie trafiają do localStorage bez decyzji architektonicznej?
Czy błędy nie ujawniają szczegółów infrastruktury?
```

Zasada:

```text
Ukrycie elementu w UI nie jest zabezpieczeniem. Backend musi wymuszać reguły.
```

### Testy dla funkcjonalności

Minimalny zestaw:

```text
happy path
walidacja inputu
brak uprawnień
brak danych
błąd API
stare dane
odświeżenie widoku po mutacji
cache invalidation
podstawowa dostępność UI
```

Pytania:

```text
Czy test sprawdza zachowanie widoczne dla użytkownika?
Czy test przetrwa refaktor implementacji?
Czy test obejmuje błąd z API?
Czy test obejmuje brak permission?
Czy test obejmuje stare dane?
Czy test obejmuje ponowne wykonanie operacji?
```
