# itsol-technical-planning Reference Sector: Tech notes

## Zawartość

- Tech notes
- Planowanie techniczne i estymacja
- Spike techniczny

## Tech notes

Tech notes opisują uzgodnione podejście techniczne do zadania. Nie muszą być długie. Mają pozwolić developerowi, reviewerowi i QA zrozumieć, co zmieniamy, dlaczego i jak to bezpiecznie sprawdzić.

### Kiedy wymagane są tech notes

Tech notes są wymagane, gdy zmiana:

- dotyka kilku modułów
- zmienia model danych
- wymaga migracji
- zmienia kontrakt API
- zmienia autoryzację
- wpływa na cache, eventy, kolejki, joby albo integracje
- wymaga rollout etapami
- wymaga nowej biblioteki
- ma wpływ na wydajność
- jest trudna do odwrócenia
- będzie rozwijana przez więcej niż jedną osobę

### Szablon tech notes

```markdown
# Tech notes - [tytuł zadania]

## Linki

- Story:
- Makiety:
- Dokumentacja API:
- Powiązane PR:

## Cel

Jaki problem techniczny rozwiązujemy.

## Obecny stan

Jak system działa dzisiaj.

## Proponowane rozwiązanie

Opis wybranego podejścia.

## Alternatywy

- Wariant A - dlaczego odrzucony
- Wariant B - dlaczego odrzucony

## Zakres zmian

- frontend
- backend
- baza danych
- eventy / cache
- infrastruktura
- integracje

## Kontrakt API

Endpointy, payloady, błędy, kompatybilność wsteczna.

## Dane i migracje

Zmiany schematu, migracje, dane historyczne, rollback.

## Bezpieczeństwo

Role, uprawnienia, tenanty, walidacja wejścia, dane wrażliwe.

## Wydajność

Potencjalne koszty, indeksy, cache, batch processing, limity.

## Testy

Testy unit, integration, E2E, manual QA, dane testowe.

## Rollout

Feature flag, etapowanie, monitoring po wdrożeniu.

## Rollback

Jak wyłączyć albo cofnąć zmianę.

## Ryzyka

Lista ryzyk i decyzje.

## Otwarte pytania

- pytanie - właściciel - termin
```

### Zasady pisania tech notes

- pisz decyzje, nie stenogram spotkania
- zapisuj powód wyboru, nie tylko wybrany wariant
- nie opisuj każdej klasy i każdej funkcji
- opisz granice modułów, kontrakty, dane, ryzyka i testy
- oddziel fakty od założeń
- każdemu otwartemu pytaniu przypisz właściciela
- aktualizuj tech notes, jeśli implementacja zmieniła kierunek
## Planowanie techniczne i estymacja

Estymacja powinna uwzględniać więcej niż samo pisanie kodu.

Uwzględnij:

- analizę obecnego kodu
- doprecyzowanie wymagań
- implementację
- testy automatyczne
- testy manualne developera
- code review
- poprawki po review
- QA
- poprawki po QA
- migracje danych
- dokumentację
- deployment
- monitoring po wdrożeniu

### Kiedy estymacja jest niewiarygodna

- brak danych testowych
- brak decyzji klienta
- nieznana integracja
- nieznany legacy kod
- brak dostępu do środowiska
- nieznany wolumen danych
- zmiana wymaga migracji bez próbki danych
- brak jasnej definicji akceptacji

W takich przypadkach zamiast estymować pełną implementację, zrób spike.
## Spike techniczny

Spike jest krótkim zadaniem badawczym, które ma zmniejszyć niepewność.

Dobry spike ma:

- pytanie, na które odpowiada
- timebox
- oczekiwany output
- kryterium zakończenia

Przykład:

```markdown
# Spike - sprawdzenie migracji danych ofert

## Pytanie

Czy istniejące dane ofert można zmigrować do nowego modelu bez ręcznej korekty?

## Timebox

1 dzień.

## Output

- liczba rekordów poprawnych
- liczba rekordów problematycznych
- lista typów problemów
- rekomendacja migracji

## Nie robimy

- pełnej migracji produkcyjnej
- finalnej implementacji endpointów
```
