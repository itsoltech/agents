# itsol-requirements-review Reference Sector: Standard pracy dla MVP

## Zawartość

- Standard pracy dla MVP
- Standard pracy dla rozwijanego produktu
- Standard pracy dla produktu o wysokim ryzyku
- Checklist dla prowadzącego projekt

## Standard pracy dla MVP

W MVP liczy się tempo iteracji, ale nie powinno się pomijać podstaw bezpieczeństwa i spójności danych.

Minimalny standard MVP:

- krótka story z celem i acceptance criteria
- małe vertical slices
- prosta architektura bez nadmiarowych warstw
- ręczne QA dla głównych ścieżek
- testy automatyczne dla logiki biznesowej i miejsc wysokiego ryzyka
- podstawowe logi i obsługa błędów
- brak sekretów w kodzie
- backendowa autoryzacja
- plan migracji, jeśli zmieniamy dane

Czego unikać w MVP:

- pełnego DDD dla prostego CRUD
- wielu dokumentów dla małych zmian
- budowania abstrakcji pod przyszłość bez realnego wymagania
- dzielenia pracy na warstwy bez sprawdzalnego rezultatu
## Standard pracy dla rozwijanego produktu

Dla produktu z użytkownikami produkcyjnymi proces musi mocniej chronić regresje.

Minimalny standard:

- Definition of Ready i Done
- refinement funkcjonalny
- tech notes dla zmian ryzykownych
- PR template
- code review
- QA z planem testów
- regresja powiązanych modułów
- metryki i logi dla operacji krytycznych
- release notes wewnętrzne
- monitoring po wdrożeniu
## Standard pracy dla produktu o wysokim ryzyku

Dla systemów z danymi finansowymi, medycznymi, prawnymi, osobowymi, dużym ruchem albo wymaganiami audytu potrzebny jest cięższy proces.

Dodatkowo wymagane:

- threat modeling dla większych zmian
- testy bezpieczeństwa
- pełna matryca ról i uprawnień
- traceability: wymaganie -> story -> PR -> testy -> release
- formalna akceptacja zmian zakresu
- plan rollbacku
- test restore backupu przy zmianach danych
- audyt zmian w danych
- release approval
- post-release verification
## Checklist dla prowadzącego projekt

Przed przekazaniem zadania do developmentu:

- czy problem biznesowy jest jasny?
- czy użytkownik i rola są opisane?
- czy acceptance criteria są testowalne?
- czy są dane testowe?
- czy wiadomo, co jest poza zakresem?
- czy są pytania blokujące?
- czy zadanie wymaga tech notes?
- czy QA będzie w stanie przetestować zmianę?
- czy klient potwierdził decyzje biznesowe?
