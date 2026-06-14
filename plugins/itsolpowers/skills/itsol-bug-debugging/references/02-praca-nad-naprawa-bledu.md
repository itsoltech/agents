# itsol-bug-debugging Reference Sector: Praca nad naprawą błędu

## Zawartość

- Praca nad naprawą błędu

## Praca nad naprawą błędu

### Sposób myślenia

Przy bugfixie deweloper powinien być bardziej diagnostą niż autorem nowego kodu. Główne pytanie brzmi:

```text
Jaki dowód pokazuje, że znalazłem prawdziwą przyczynę?
```

Nie wystarczy zobaczyć podejrzany fragment kodu. Trzeba połączyć objaw, dane wejściowe, ścieżkę wykonania i zmianę, która naprawia problem.

### Triage błędu

Na początku trzeba ustalić:

- zakres wpływu
- powtarzalność
- środowisko
- priorytet
- severity
- ryzyko danych
- ryzyko bezpieczeństwa
- czy potrzebny jest hotfix

Pytania:

```text
Czy błąd występuje na produkcji?
Czy dotyczy jednego użytkownika, jednego tenant'a czy wszystkich?
Czy błąd uszkadza dane?
Czy błąd blokuje pracę?
Czy jest obejście?
Czy dotyczy bezpieczeństwa albo uprawnień?
Czy błąd pojawił się po ostatnim deployu?
Czy trzeba zatrzymać rollout?
```

Severity to wpływ techniczny lub biznesowy. Priority to kolejność pracy.

Przykład:

```text
Literówka w labelu może mieć niską severity, ale wysoki priority przed demo.
Błąd w naliczaniu płatności ma wysoką severity i wysoki priority.
```

### Dobry opis błędu

Bug report powinien zawierać:

- tytuł opisujący objaw i warunek
- środowisko
- wersję aplikacji albo commit/deploy
- użytkownika/rolę/test tenant
- kroki reprodukcji
- oczekiwane zachowanie
- faktyczne zachowanie
- załączniki, screeny, logi albo request ID
- częstotliwość
- wpływ na dane
- informację, czy istnieje workaround

Dobry tytuł:

```text
Estimate total is recalculated incorrectly after changing material unit from EACH to CUBIC
```

Słaby tytuł:

```text
Estimate broken
```

### Odtworzenie problemu

Deweloper powinien najpierw spróbować odtworzyć problem.

Pytania:

```text
Czy mam dokładne kroki?
Czy mam te same dane wejściowe?
Czy mam tę samą rolę użytkownika?
Czy mam tę samą wersję aplikacji?
Czy problem występuje lokalnie?
Czy problem występuje na staging?
Czy problem występuje tylko na production?
Czy mogę odtworzyć problem przez API bez UI?
Czy mogę odtworzyć problem testem automatycznym?
```

Jeśli nie da się odtworzyć problemu, trzeba zebrać inne dowody:

- logi
- request ID
- trace
- snapshot danych
- payload requestu
- odpowiedź API
- deploy history
- feature flags
- wersja klienta
- informacje o przeglądarce albo urządzeniu
- dane z monitoringu
- różnice między środowiskami

### Zawężanie problemu

Zamiast czytać cały system, trzeba zawężać obszar.

Pytania:

```text
Czy błąd jest w UI czy API?
Czy request wychodzi poprawny?
Czy backend zwraca poprawne dane?
Czy baza zawiera poprawne dane?
Czy cache pokazuje stare dane?
Czy live event nadpisuje świeży stan?
Czy worker asynchroniczny zmienia dane po czasie?
Czy migracja zmieniła kształt danych?
Czy błąd występuje tylko dla konkretnego typu danych?
Czy błąd występuje tylko po konkretnej kolejności działań?
```

Technika:

```text
Podziel przepływ na odcinki i sprawdź każdy odcinek osobno.
```

Przykład:

```text
UI pokazuje złą cenę.
1. Sprawdź payload z API.
2. Jeśli API zwraca złą cenę, sprawdź logikę backendu.
3. Jeśli API zwraca dobrą cenę, sprawdź mapowanie frontendu.
4. Jeśli frontend początkowo pokazuje dobrą cenę, ale później złą, sprawdź cache/live event.
```

### Hipotezy i dowody

Bugfix powinien być prowadzony przez hipotezy.

Szablon:

```text
Hipoteza:
Problem występuje, ponieważ...

Dowód:
Sprawdziłem..., wynik...

Wniosek:
Hipoteza potwierdzona / odrzucona.
```

Przykład:

```text
Hipoteza:
Frontend używa starej wartości z cache po zmianie jednostki.

Dowód:
Response z API po mutacji zawiera poprawną wartość, ale TanStack Query nie invaliduje query `estimateDetails(id)`.

Wniosek:
Problem jest po stronie cache invalidation, nie po stronie przeliczeń backendu.
```

Zachowanie dobre:

```text
Deweloper zapisuje w PR krótką informację, jaka była przyczyna.
```

Zachowanie złe:

```text
Deweloper zmienia kilka losowych miejsc, aż problem zniknie lokalnie.
```

### Minimalna poprawka vs refaktor

Bugfix powinien usuwać przyczynę przy możliwie małym ryzyku. Nie każdy bug jest dobrym momentem na przebudowę dużej części systemu.

Pytania:

```text
Czy poprawka dotyka tylko miejsca przyczyny?
Czy refaktor jest potrzebny do bezpiecznej naprawy?
Czy refaktor można wydzielić do osobnego PR?
Czy obecna poprawka jest hotfixem?
Czy brak refaktoru zwiększa ryzyko powrotu błędu?
Czy poprawka nie maskuje problemu w danych?
```

Przykład dobrej decyzji:

```text
Hotfix:
Dodać brakującą invalidację cache po mutacji.

Osobne zadanie:
Ujednolicić query keys dla całego modułu estimate.
```

### Test regresji

Bug powinien zostawić po sobie test. Test regresji powinien odtwarzać warunek, który wcześniej powodował błąd.

Pytania:

```text
Czy test padałby przed poprawką?
Czy test przechodzi po poprawce?
Czy test sprawdza zachowanie, a nie szczegóły implementacji?
Czy test zawiera dane podobne do zgłoszenia?
Czy dodałem test w najniższej warstwie, w której da się wiarygodnie sprawdzić problem?
```

Przykład:

```text
Błąd:
Cena po zmianie jednostki CUBIC liczy się niepoprawnie.

Dobry test:
Dane wejściowe mają unit EACH, potem unit CUBIC, a test sprawdza wynik przeliczenia dla konkretnej ilości.

Słaby test:
Test sprawdza, że funkcja została wywołana, ale nie sprawdza wyniku biznesowego.
```

### Sprawdzenie podobnych miejsc

Po znalezieniu błędu trzeba sprawdzić, czy nie istnieją analogiczne miejsca.

Pytania:

```text
Czy ten sam helper jest używany w innych modułach?
Czy podobna mutacja też nie invaliduje cache?
Czy inne jednostki przechodzą przez ten sam kod?
Czy inne role mogą trafić na ten sam błąd?
Czy import, eksport albo worker używa tej samej logiki?
Czy frontend i backend mają zduplikowaną regułę?
```

Zachowanie dobre:

```text
Deweloper sprawdza klasę błędu, nie tylko jeden przypadek z ticketu.
```

Zachowanie złe:

```text
Deweloper dodaje warunek tylko pod konkretny rekord z produkcji.
```
