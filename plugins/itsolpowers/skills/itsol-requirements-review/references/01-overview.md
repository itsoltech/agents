# itsol-requirements-review Reference Sector: Overview

## Zawartość

- Overview
- Cel dokumentu
- Zakres
- Zasady ogólne
- Poziomy formalności procesu
- Przepływ pracy od pomysłu do wdrożenia


## Cel dokumentu

Dokument opisuje sposób prowadzenia pracy nad zadaniami w projekcie IT od pierwszej rozmowy z klientem do wdrożenia i weryfikacji przez QA. Ma pomóc zespołowi zbierać informacje, opisywać zadania, prowadzić spotkania techniczne, przygotowywać tech notes, implementować zmiany, wykonywać code review i testować rezultat.

Celem nie jest wprowadzenie ciężkiego procesu dla każdego zadania. Proces ma dobrać poziom formalności do ryzyka, rozmiaru zadania, liczby osób zaangażowanych i wpływu zmiany na produkcję.
## Zakres

Dokument dotyczy pracy nad aplikacjami webowymi, API, aplikacjami frontendowymi, usługami backendowymi, integracjami, jobami, migracjami danych, infrastrukturą i modułami ML/LLM. Jest niezależny od technologii. Może być używany w projektach opartych o Rust, .NET, TypeScript, Svelte, React, PostgreSQL, MongoDB, Nomad, Docker i inne technologie.

Dokument opisuje:

- zbieranie informacji od klienta i interesariuszy
- przygotowanie dobrej user story albo zadania technicznego
- kryteria gotowości zadania do implementacji
- spotkanie techniczne zespołu przed implementacją
- tworzenie tech notes
- pracę developera przed pull requestem
- code review z perspektywy osoby sprawdzającej kod
- testy QA i projektowanie scenariuszy testowych
- statusy, handoffy, metryki i procedury wewnętrzne
- szablony do użycia w issue trackerze, PR i QA
## Zasady ogólne

- najpierw ustal problem biznesowy, potem proponuj rozwiązanie techniczne
- nie zaczynaj implementacji, jeśli nie wiadomo, jaki efekt ma być zaakceptowany
- każda story powinna mieć jasny zakres, kryteria akceptacji i właściciela decyzji
- decyzje techniczne zapisuj tam, gdzie zespół będzie ich później szukał
- proces powinien zmniejszać liczbę nieporozumień, a nie tworzyć dokumenty dla samego dokumentowania
- ryzykowne zmiany wymagają tech notes, planu testów, planu wdrożenia i planu rollbacku
- code review ma chronić jakość systemu, ale nie powinno blokować pracy przez subiektywne preferencje
- QA nie sprawdza tylko, czy „działa”; QA szuka błędów w zachowaniu, edge case'ach, uprawnieniach, danych, integracjach i regresjach
- Definition of Done jest standardem zespołu, a acceptance criteria są warunkami dla konkretnej story
- wątpliwości, założenia i decyzje zapisuj przed implementacją, nie po fakcie
## Poziomy formalności procesu

Nie każde zadanie wymaga pełnego procesu. Poziom formalności powinien wynikać z ryzyka.

### Poziom 1 - mała zmiana

Przykłady:

- drobna poprawka UI
- literówka
- mały bug bez wpływu na dane
- zmiana copy
- mała zmiana walidacji po stronie frontendu

Wymagane minimum:

- krótki opis problemu
- expected vs actual behavior
- screenshot albo przykład, jeśli dotyczy UI
- jednoznaczne kryterium akceptacji
- self-test developera
- code review, jeśli zmiana trafia do głównej gałęzi

Tech notes zwykle nie są potrzebne.

### Poziom 2 - standardowa story produktowa

Przykłady:

- nowy endpoint
- nowy widok
- zmiana formularza
- integracja z istniejącym API
- zmiana przepływu użytkownika
- nowa reguła biznesowa

Wymagane minimum:

- user story albo opis zadania
- kryteria akceptacji
- przypadki brzegowe
- informacja o rolach i uprawnieniach
- opis wpływu na API, dane i UI
- plan testów QA
- pull request z opisem zmian

Tech notes są potrzebne, jeśli zmiana dotyka kilku modułów, cache, eventów, bazy, infrastruktury albo bezpieczeństwa.

### Poziom 3 - zmiana ryzykowna

Przykłady:

- migracja danych
- zmiana modelu uprawnień
- zmiana schematu bazy
- zmiana procesu płatności
- zmiana autoryzacji albo uwierzytelniania
- integracja z zewnętrznym systemem
- zmiana wpływająca na wiele tenantów
- refaktor modułu produkcyjnego
- zmiana eventów live albo invalidacji cache
- zmiana w infrastrukturze

Wymagane minimum:

- user story albo dokument wymagania
- tech notes
- lista ryzyk
- plan wdrożenia
- plan rollbacku
- plan testów QA
- testy automatyczne tam, gdzie to możliwe
- code review przez osobę znającą obszar
- walidacja na środowisku testowym lub staging
- decyzja release ownera przed wdrożeniem

### Poziom 4 - inicjatywa / większy epik

Przykłady:

- nowy moduł systemu
- przebudowa procesu biznesowego
- nowa aplikacja
- zmiana architektury
- duży refaktor
- integracja wymagająca kilku etapów

Wymagane minimum:

- opis celu biznesowego
- zakres MVP
- zakres poza MVP
- mapa interesariuszy
- lista procesów biznesowych
- lista ryzyk
- decomposition na epiki i story
- architektura lub ADR / tech notes
- plan rollout etapami
- metryki sukcesu
- plan QA i regresji
- plan komunikacji z klientem
## Przepływ pracy od pomysłu do wdrożenia

Standardowy przepływ:

1. Klient lub product owner zgłasza potrzebę, problem albo pomysł.
2. Osoba odpowiedzialna za wymagania zbiera kontekst, przykłady i oczekiwany rezultat.
3. Powstaje user story, bug report albo zadanie techniczne.
4. Zespół wykonuje refinement i ocenia, czy zadanie jest gotowe.
5. Przy zadaniach technicznych lub ryzykownych odbywa się spotkanie implementacyjne.
6. Powstają tech notes, jeśli zadanie tego wymaga.
7. Developer implementuje zmianę i wykonuje self-review.
8. Developer tworzy pull request z opisem zmian, testów i ryzyk.
9. Reviewer sprawdza kod, architekturę, bezpieczeństwo, testowalność i wpływ na system.
10. QA wykonuje testy funkcjonalne, regresyjne, negatywne i edge case'y.
11. Zmiana trafia do release'u zgodnie z planem wdrożenia.
12. Po wdrożeniu zespół obserwuje metryki, logi, błędy i feedback użytkowników.
