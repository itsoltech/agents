# itsol-requirements-review Reference Sector: User story

## Zawartość

- User story

## User story

User story opisuje wartość dla użytkownika lub interesariusza. Nie powinna być tylko technicznym poleceniem typu „dodać endpoint” albo „zmienić tabelę”. Czasem zadanie techniczne jest poprawnym formatem, ale wtedy trzeba jasno opisać cel techniczny, ryzyko i sposób weryfikacji.

### Minimalna struktura story

```markdown
# [Obszar] Krótki tytuł

## Cel

Jako [rola / typ użytkownika]
chcę [możliwość / działanie]
aby [wartość / powód biznesowy].

## Kontekst

Dlaczego robimy tę zmianę, jak działa obecny proces i czego dotyczy zmiana.

## Zakres

Co ma zostać zrobione.

## Poza zakresem

Co nie jest częścią tej story.

## Kryteria akceptacji

- warunek 1
- warunek 2
- warunek 3

## Role i uprawnienia

Kto może wykonać operację i jakie dane może zobaczyć.

## Dane

Pola, walidacje, przykłady, dane historyczne, migracje.

## UI / API

Zmiany w interfejsie, endpointach, eventach, powiadomieniach albo integracjach.

## Edge case'y

Lista znanych przypadków brzegowych.

## Testy

Jak QA i developer mają zweryfikować zmianę.

## Linki

Makiety, dokumentacja, przykłady, poprzednie ustalenia.
```

### Kryteria dobrej story

Dobra story powinna być:

- niezależna na tyle, żeby można ją było planować i dostarczyć bez dużego ukrytego zakresu
- negocjowalna, czyli zostawia miejsce na rozmowę o sposobie realizacji
- wartościowa dla użytkownika, klienta, supportu, operacji albo utrzymania systemu
- możliwa do oszacowania
- mała na tyle, żeby mieściła się w przewidywalnym cyklu pracy
- testowalna przez acceptance criteria

Jeśli story nie jest testowalna, to zwykle nie jest jeszcze gotowa do implementacji.

### Acceptance criteria

Acceptance criteria opisują warunki akceptacji konkretnej story. Nie zastępują Definition of Done. Story może mieć spełnione acceptance criteria, ale nadal nie być „done”, jeśli brakuje testów, review, migracji, dokumentacji albo poprawnego deploymentu.

Dobre acceptance criteria:

- opisują zachowanie systemu, nie implementację
- są jednoznaczne
- są możliwe do sprawdzenia przez QA, product ownera albo automatyczny test
- obejmują sukces, błędy i brak uprawnień
- nie są ogólnym opisem typu „system działa poprawnie”
- nie zmieniają się po implementacji bez świadomej zmiany zakresu

Przykład słaby:

```markdown
- Użytkownik może zarządzać ofertami.
```

Przykład lepszy:

```markdown
- Użytkownik z rolą `Manager` może utworzyć ofertę z nazwą, klientem, terminem ważności i co najmniej jedną pozycją.
- System odrzuca utworzenie oferty bez pozycji i pokazuje komunikat walidacyjny.
- Użytkownik bez roli `Manager` nie widzi przycisku tworzenia oferty i dostaje odpowiedź 403 przy bezpośrednim wywołaniu API.
- Po utworzeniu oferty system zapisuje zdarzenie audytowe z identyfikatorem użytkownika.
```

### Format Given / When / Then

Format Given / When / Then jest dobry dla scenariuszy, które mają jasny stan początkowy, akcję i oczekiwany rezultat.

```gherkin
Given użytkownik ma rolę Manager
And istnieje aktywny klient ACME
When użytkownik tworzy ofertę z jedną pozycją
Then oferta zostaje zapisana ze statusem Draft
And w historii audytu pojawia się zdarzenie OfferCreated
```

Nie każda story musi być pisana w Gherkinie. Ważniejsze jest to, żeby scenariusze były sprawdzalne.

### Zadanie techniczne zamiast user story

Zadanie techniczne jest właściwe, gdy praca nie dostarcza bezpośredniej funkcji użytkownikowi, ale poprawia system.

Przykłady:

- refaktor modułu
- migracja biblioteki
- aktualizacja frameworka
- poprawa indeksów w bazie
- zmiana pipeline CI
- migracja infrastruktury
- dodanie metryk

Szablon zadania technicznego:

```markdown
# [Tech] Krótki tytuł

## Problem techniczny

Co jest problemem i dlaczego wymaga zmiany.

## Cel

Jaki stan techniczny chcemy osiągnąć.

## Zakres

Co zostanie zmienione.

## Poza zakresem

Czego nie zmieniamy.

## Ryzyko

Ryzyka produkcyjne, migracyjne, wydajnościowe, bezpieczeństwa.

## Plan weryfikacji

Jak sprawdzimy, że zmiana jest bezpieczna.

## Plan rollbacku

Jak wrócić do poprzedniego stanu.
```
