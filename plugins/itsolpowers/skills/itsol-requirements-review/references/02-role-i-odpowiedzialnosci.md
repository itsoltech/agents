# itsol-requirements-review Reference Sector: Role i odpowiedzialności

## Zawartość

- Role i odpowiedzialności

## Role i odpowiedzialności

### Klient / stakeholder

Odpowiada za:

- opis problemu biznesowego
- wskazanie użytkowników i procesu
- akceptację zakresu
- priorytet biznesowy
- dostarczenie przykładów i danych testowych
- decyzje biznesowe, których zespół techniczny nie powinien zgadywać

Nie powinien narzucać szczegółowej implementacji technicznej, jeśli nie wynika ona z realnych ograniczeń.

### Product owner / osoba prowadząca projekt

Odpowiada za:

- doprecyzowanie wymagań
- ustalenie priorytetu
- przygotowanie story lub zadania
- zarządzanie zakresem
- utrzymanie backlogu
- komunikację z klientem
- pilnowanie, żeby acceptance criteria były testowalne
- zamykanie otwartych pytań przed startem implementacji

### Tech lead / architekt / senior developer

Odpowiada za:

- ocenę wpływu zmiany na architekturę
- wybór poziomu formalności procesu
- prowadzenie technicznego refinementu
- przygotowanie albo weryfikację tech notes
- identyfikację ryzyk technicznych
- decyzje o refaktorze, migracji, cache, eventach, integracjach i rollout
- wsparcie code review w trudniejszych zmianach

### Developer

Odpowiada za:

- zrozumienie story przed implementacją
- zadanie pytań przed kodowaniem, jeśli zakres jest niejasny
- implementację zgodną z acceptance criteria i tech notes
- testy automatyczne i manualne na poziomie własnej zmiany
- opis pull requesta
- reakcję na uwagi z code review
- przekazanie QA informacji, co zostało zmienione i jak testować

### Reviewer

Odpowiada za:

- sprawdzenie zgodności kodu z celem zadania
- wykrycie problemów w projekcie rozwiązania, bezpieczeństwie, testach i utrzymaniu
- ocenę wpływu zmiany na system
- oddzielenie uwag blokujących od sugestii
- pilnowanie jakości kodu bez szukania perfekcji

### QA / tester

Odpowiada za:

- przygotowanie scenariuszy testowych na podstawie story i ryzyk
- testy funkcjonalne, regresyjne, negatywne i eksploracyjne
- zgłaszanie błędów z jasnymi krokami reprodukcji
- ocenę, czy kryteria akceptacji są spełnione
- wskazanie luk w wymaganiach, jeśli testy pokazują niejednoznaczność
