# itsol-requirements-review Reference Sector: Definition of Ready

## Zawartość

- Definition of Ready
- Refinement funkcjonalny
- Dzielenie zadań
- Zarządzanie zmianą zakresu
- Praca z klientem podczas projektu

## Definition of Ready

Definition of Ready określa, kiedy zadanie może wejść do implementacji. Nie musi być identyczne dla każdego zespołu, ale powinno być jawne.

### Minimalne DoR dla story produktowej

Story jest gotowa, jeśli:

- ma opisany problem i cel
- ma właściciela biznesowego
- ma acceptance criteria
- ma opisane role i uprawnienia, jeśli dotyczy danych użytkownika
- ma przykład danych wejściowych i oczekiwanego wyniku, jeśli dotyczy przetwarzania danych
- ma wskazane makiety albo opis UI, jeśli dotyczy frontendu
- ma opis API albo kontraktu, jeśli dotyczy integracji
- ma zidentyfikowane zależności
- ma znane ograniczenia i elementy poza zakresem
- zespół potrafi oszacować pracę
- nie ma pytań blokujących start implementacji

### Minimalne DoR dla zadania technicznego

Zadanie techniczne jest gotowe, jeśli:

- opisuje problem techniczny
- opisuje oczekiwany stan po zmianie
- ma plan weryfikacji
- ma wskazane ryzyka
- ma określony wpływ na deployment, dane, monitoring i rollback
- ma tech notes, jeśli dotyczy kilku modułów albo produkcyjnego ryzyka

### Co zrobić, gdy zadanie nie spełnia DoR

Nie zaczynać implementacji w pełnym zakresie. Dopuszczalne są:

- spike techniczny
- rozmowa z klientem
- przygotowanie prototypu
- analiza danych
- przygotowanie tech notes
- doprecyzowanie acceptance criteria

Spike powinien mieć timebox i oczekiwany wynik, np. decyzję, rekomendację, PoC albo listę ryzyk.
## Refinement funkcjonalny

Refinement służy do rozbicia, doprecyzowania i przygotowania zadań do implementacji. Nie jest miejscem na finalne projektowanie każdego szczegółu technicznego, ale powinien ujawnić braki w wymaganiach i zależności.

### Wejście na refinement

- opis problemu lub pomysł
- wstępna story
- przykłady od klienta
- makiety, jeśli istnieją
- znane ograniczenia
- pytania otwarte

### Pytania na refinement

- Czy rozumiemy problem biznesowy?
- Czy wiemy, kto jest użytkownikiem?
- Czy acceptance criteria są testowalne?
- Czy story da się podzielić na mniejsze pionowe fragmenty?
- Czy wymaganie dotyka uprawnień?
- Czy wymaganie dotyka danych historycznych?
- Czy potrzebna jest migracja?
- Czy jest wpływ na API, eventy, cache albo integracje?
- Czy potrzebny jest feature flag?
- Czy QA będzie w stanie przetestować zmianę?
- Czy brakuje decyzji klienta?
- Czy brakuje danych testowych?
- Czy zakres jest większy niż jeden cykl pracy?

### Wynik refinementu

Po refinementcie zadanie powinno mieć:

- doprecyzowany opis
- acceptance criteria
- znane pytania otwarte
- wstępny rozmiar
- decyzję, czy potrzebne są tech notes
- decyzję, czy potrzebne jest spotkanie techniczne
- decyzję, czy story trzeba podzielić
## Dzielenie zadań

Zadania powinny być dzielone tak, żeby dostarczać sprawdzalny efekt, a nie tylko warstwę techniczną. Lepszy jest mały vertical slice niż osobne zadania „backend”, „frontend”, „baza”, jeśli żadne z nich nie daje samodzielnie testowalnego zachowania.

### Dobre sposoby dzielenia

- po roli użytkownika
- po typie operacji, np. tworzenie, edycja, usuwanie
- po statusie procesu
- po prostym happy path i późniejszych edge case'ach
- po jednym typie danych
- po jednej integracji
- po jednym ekranie lub jednym endpointcie
- po jednej regule biznesowej
- po migracji i późniejszym wykorzystaniu danych
- po feature flag rollout

### Słabe sposoby dzielenia

- osobne zadanie na model, osobne na endpoint, osobne na UI, bez możliwości testowania
- story zawierająca kilka niezależnych procesów
- story zależna od wielu innych story bez jasnej kolejności
- story typu „zrobić cały moduł”
- story, w której acceptance criteria są listą komponentów technicznych
## Zarządzanie zmianą zakresu

Zmiana zakresu jest normalna, ale musi być jawna.

Zmianą zakresu jest:

- nowy przypadek użycia
- nowa rola
- nowa integracja
- nowy ekran
- nowa reguła biznesowa
- zmiana acceptance criteria po rozpoczęciu implementacji
- dodanie migracji danych
- zmiana wymagań wydajnościowych lub bezpieczeństwa

Nie jest zmianą zakresu:

- doprecyzowanie nazwy pola
- wyjaśnienie istniejącego acceptance criterion
- poprawienie literówki
- uzupełnienie brakującego przykładu danych bez zmiany zachowania

Procedura:

1. Zapisz zmianę w komentarzu do story.
2. Oceń wpływ na czas, ryzyko i testy.
3. Zdecyduj, czy zmiana wchodzi do aktualnego zadania, czy do osobnej story.
4. Jeśli wpływa na implementację, zaktualizuj acceptance criteria i tech notes.
5. Jeśli wpływa na termin, poinformuj klienta albo product ownera.
## Praca z klientem podczas projektu

### Zasady komunikacji

- po każdej ważnej rozmowie zapisuj decyzje
- pytania zadawaj w formie pozwalającej podjąć decyzję, nie jako luźną dyskusję
- nie mieszaj kilku niezależnych tematów w jednym wątku
- ustal właściciela odpowiedzi dla pytań blokujących
- nie obiecuj terminu bez potwierdzenia zakresu i zależności
- jeśli klient zgłasza problem, poproś o przykład, screen, dane i krok reprodukcji
- jeśli klient proponuje rozwiązanie, wróć do problemu, który to rozwiązanie ma naprawić

### Format pytania do klienta

```markdown
Mamy do decyzji [temat].

Obecnie rozumiemy wymaganie tak:
[krótki opis]

Są możliwe warianty:

A. [wariant A]
- konsekwencja:

B. [wariant B]
- konsekwencja:

Rekomendujemy wariant [A/B], ponieważ [powód].

Prosimy o potwierdzenie, który wariant wybieramy.
```

### Gdy klient nie odpowiada

- oznacz pytanie jako blokujące lub nieblokujące
- jeśli nieblokujące, przyjmij bezpieczne założenie i zapisz je w story
- jeśli blokujące, nie rozpoczynaj implementacji części zależnej od tej decyzji
- zaproponuj wariant domyślny z konsekwencjami
- jeśli termin jest zagrożony, eskaluj przez ustalony kanał
