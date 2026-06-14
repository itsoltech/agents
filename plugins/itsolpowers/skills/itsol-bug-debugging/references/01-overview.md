# itsol-bug-debugging Reference Sector: Overview

## Zawartość

- Overview
- Zasada ogólna
- Dwa tryby pracy


## Zasada ogólna

Deweloper nie powinien zaczynać od pisania kodu. Pierwszym krokiem jest zrozumienie problemu, zakresu zmiany, oczekiwanego zachowania i ryzyk.

Dobre pytanie przed startem:

```text
Czy wiem, co ma się zmienić z perspektywy użytkownika, systemu i danych?
```

Jeśli odpowiedź brzmi „nie”, zadanie wymaga doprecyzowania albo własnej analizy przed implementacją.
## Dwa tryby pracy

### Nowa funkcjonalność

Nowa funkcjonalność zaczyna się od intencji biznesowej albo produktowej. Deweloper musi przełożyć ją na działający fragment systemu.

Celem jest:

- zrozumieć, kto korzysta z funkcji
- zrozumieć, jaki problem rozwiązuje funkcja
- zrozumieć, jakie zachowanie jest oczekiwane
- wybrać najmniejszy sensowny zakres implementacji
- nie nadbudować architektury ponad aktualną potrzebę
- zostawić kod w stanie, który da się rozwijać

Przykładowe zadanie:

```text
Jako manager restauracji chcę widzieć historię zmian ceny produktu, aby sprawdzić, kto i kiedy zmienił cenę.
```

Deweloper powinien myśleć o przepływie:

```text
Kto otwiera widok?
Jakie dane widzi?
Skąd dane pochodzą?
Kiedy dane się zmieniają?
Jak wygląda brak danych?
Jak wygląda błąd API?
Jakie uprawnienia są wymagane?
Jak to przetestować?
```

### Naprawa błędu

Bugfix zaczyna się od niezgodności między oczekiwanym a faktycznym zachowaniem. Deweloper nie powinien zgadywać poprawki bez odtworzenia problemu albo bez mocnych dowodów z logów, danych, testów lub analizy kodu.

Celem jest:

- ustalić fakty
- odtworzyć problem
- zawęzić obszar awarii
- znaleźć przyczynę, a nie tylko objaw
- naprawić najmniejszy bezpieczny fragment
- dodać test regresji
- sprawdzić, czy błąd nie występuje w innych podobnych miejscach

Przykładowy błąd:

```text
Po zmianie jednostki materiału z EACH na CUBIC cena w estymacie jest liczona niepoprawnie.
```

Deweloper powinien myśleć o ścieżce:

```text
Czy problem dotyczy UI, API, danych, cache, modelu, migracji czy integracji?
Czy potrafię go odtworzyć?
Jakie dane wejściowe są potrzebne?
Jaki wynik jest oczekiwany?
Od kiedy problem występuje?
Czy istnieje commit, migracja albo deploy, po którym pojawił się błąd?
Czy poprawka naprawia przyczynę, czy tylko maskuje objaw?
```
