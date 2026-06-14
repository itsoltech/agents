# itsol-bug-debugging Reference Sector: Debugowanie krok po kroku

## Zawartość

- Debugowanie krok po kroku
- Checklista dla bugfixa
- Proces myślowy - przykład bugfixa

## Debugowanie krok po kroku

### 1. Zbierz fakty

```text
Co się stało?
Kiedy?
Na jakim środowisku?
Dla jakiego użytkownika?
Na jakich danych?
Po jakiej akcji?
Jaki był request ID?
Jaka wersja aplikacji działała?
```

### 2. Odtwórz albo zbuduj model problemu

```text
Czy mogę powtórzyć problem lokalnie?
Czy mogę powtórzyć problem przez test?
Czy mogę powtórzyć problem przez API?
Czy potrzebuję snapshotu danych?
```

### 3. Podziel przepływ

```text
Wejście -> walidacja -> logika -> zapis -> cache/event -> odczyt -> UI
```

Na każdym kroku pytaj:

```text
Czy tutaj dane są jeszcze poprawne?
```

### 4. Postaw hipotezę

```text
Problem wynika z...
Sprawdzę to przez...
```

### 5. Odrzuć albo potwierdź hipotezę

Nie przywiązuj się do pierwszego pomysłu. Jeśli dowody nie pasują, hipoteza jest błędna.

### 6. Zrób najmniejszą zmianę

Popraw tylko fragment odpowiedzialny za błąd.

### 7. Dodaj test regresji

Test ma paść przed fixem i przejść po fixie.

### 8. Sprawdź skutki uboczne

```text
Czy poprawka wpływa na stare dane?
Czy poprawka wpływa na cache?
Czy poprawka wpływa na uprawnienia?
Czy poprawka wpływa na inne moduły?
Czy poprawka wymaga migracji danych?
```
## Checklista dla bugfixa

### Przed poprawką

```text
[ ] Rozumiem oczekiwane zachowanie.
[ ] Rozumiem faktyczne zachowanie.
[ ] Mam kroki reprodukcji albo inne dowody.
[ ] Wiem, na jakim środowisku występuje problem.
[ ] Wiem, jakich danych dotyczy problem.
[ ] Wiem, czy problem dotyczy jednego użytkownika czy wielu.
[ ] Sprawdziłem, czy problem dotyczy bezpieczeństwa albo danych.
[ ] Mam hipotezę i sposób jej sprawdzenia.
```

### W trakcie debugowania

```text
[ ] Odtworzyłem problem.
[ ] Podzieliłem przepływ na etapy.
[ ] Sprawdziłem request i response.
[ ] Sprawdziłem dane w bazie albo źródle prawdy.
[ ] Sprawdziłem cache/live eventy, jeśli występują.
[ ] Sprawdziłem ostatnie deploye albo zmiany.
[ ] Odrzuciłem błędne hipotezy.
[ ] Znalazłem przyczynę, nie tylko objaw.
```

### Przed PR

```text
[ ] Fix jest możliwie mały.
[ ] Dodałem test regresji.
[ ] Test padałby przed poprawką.
[ ] Sprawdziłem podobne miejsca.
[ ] Sprawdziłem, czy potrzebny jest data fix.
[ ] Opisałem przyczynę w PR.
[ ] Opisałem sposób reprodukcji.
[ ] Opisałem sposób testowania.
[ ] Sprawdziłem, czy bug nie wraca po reloadzie/reconnect/cache refresh.
```
## Proces myślowy - przykład bugfixa

Zgłoszenie:

```text
Po oznaczeniu zamówienia jako gotowe, ekran kuchni czasem dalej pokazuje status „in progress”.
```

Myślenie dewelopera:

```text
1. Czy status zmienia się w bazie?
Sprawdzić response API i rekord w DB.

2. Czy problem jest natychmiastowy czy po chwili?
Jeśli po chwili, podejrzany jest live event albo cache.

3. Czy problem dotyczy tylko jednego ekranu?
Sprawdzić listę i szczegóły zamówienia.

4. Czy request kończy się sukcesem?
Sprawdzić network tab/logi.

5. Czy frontend invaliduje właściwe query?
Sprawdzić query keys.

6. Czy live event przychodzi?
Sprawdzić websocket messages.

7. Czy event ma starszą wersję statusu?
Sprawdzić payload i revision.

8. Czy problem występuje przy wolnej sieci?
Sprawdzić race między optimistic update, response i eventem.
```

Hipoteza:

```text
Mutacja ustawia status lokalnie, ale później przychodzi stary event z websocketu i nadpisuje cache.
```

Dowód:

```text
W devtools widać, że response API ma `ready_for_pickup`, ale event po 200 ms ma `in_progress` z niższą revision.
```

Fix:

```text
Frontend ignoruje eventy ze starszą revision, a backend wysyła revision w każdym `order.status_changed`.
```

Test regresji:

```text
Symulacja: cache ma order revision 10, przychodzi event revision 9. UI nie zmienia statusu.
```
