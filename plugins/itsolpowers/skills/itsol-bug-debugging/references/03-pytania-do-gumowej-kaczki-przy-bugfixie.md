# itsol-bug-debugging Reference Sector: Pytania do gumowej kaczki przy bugfixie

## Zawartość

- Pytania do gumowej kaczki przy bugfixie
- Antywzorce przy bugfixach

## Pytania do gumowej kaczki przy bugfixie

Deweloper może opowiedzieć problem tak:

```text
Objaw jest taki...
Oczekiwane zachowanie to...
Problem występuje, gdy...
Nie występuje, gdy...
Dane wejściowe są...
Pierwsze miejsce, gdzie warto sprawdzić prawdę, to...
Moja hipoteza jest taka...
Dowód, który ją potwierdzi albo obali, to...
```

Lista pytań:

```text
Czy potrafię odtworzyć błąd?
Czy wiem, jaki jest oczekiwany wynik?
Czy mam konkretny przykład danych?
Czy problem dotyczy UI, API, bazy, cache, joba czy integracji?
Czy problem pojawił się po deployu?
Czy problem dotyczy wszystkich użytkowników?
Czy jest różnica między staging i production?
Czy request jest poprawny?
Czy response jest poprawny?
Czy baza zawiera poprawne dane?
Czy logi pokazują błąd?
Czy cache może trzymać stary stan?
Czy live event może nadpisywać dane?
Czy problem jest deterministyczny?
Czy problem zależy od czasu, kolejności działań albo race condition?
Czy mój fix naprawia przyczynę?
Czy test regresji padałby przed poprawką?
Czy ten sam błąd może wystąpić w innym miejscu?
Czy potrzebny jest data fix?
Czy trzeba poinformować QA o konkretnym scenariuszu?
```
## Antywzorce przy bugfixach

### Naprawa bez reprodukcji

Objaw:

```text
Deweloper czyta kod, znajduje podejrzany fragment i zmienia go bez odtworzenia problemu.
```

Skutek:

```text
Problem może wrócić, bo prawdziwa przyczyna była gdzie indziej.
```

Lepsze zachowanie:

```text
Odtworzyć błąd albo zebrać dowód z logów, requestów, danych lub testu.
```

### Leczenie objawu

Objaw:

```text
Deweloper dodaje fallback, który ukrywa błąd danych.
```

Skutek:

```text
System działa „ciszej”, ale dane nadal są błędne.
```

Lepsze zachowanie:

```text
Ustalić, czy problem wymaga poprawki kodu, data fixu, migracji albo alertu.
```

### Za szeroki fix

Objaw:

```text
Bug dotyczy jednej mutacji, a PR przebudowuje cały moduł.
```

Skutek:

```text
Rośnie ryzyko regresji i trudność review.
```

Lepsze zachowanie:

```text
Naprawić błąd małą zmianą, a większy refaktor opisać jako osobne zadanie.
```

### Brak testu regresji

Objaw:

```text
Błąd został naprawiony ręcznie, ale nie ma testu.
```

Skutek:

```text
Błąd może wrócić przy kolejnym refaktorze.
```

Lepsze zachowanie:

```text
Dodać test, który odtwarza dokładny warunek błędu.
```
