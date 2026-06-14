# itsol-code-review-workflow Reference Sector: Code review

## Zawartość

- Code review

## Code review

Code review ma chronić jakość systemu, ale nie jest miejscem na przepisywanie kodu według osobistych preferencji. Reviewer powinien ocenić, czy zmiana poprawia system i czy nie wprowadza ryzyka większego niż wartość zmiany.

### Priorytety review

Kolejność sprawdzania:

1. zgodność z celem biznesowym i acceptance criteria
2. poprawność działania
3. bezpieczeństwo
4. spójność architektury
5. wpływ na dane i migracje
6. obsługa błędów
7. testy
8. wydajność i skalowalność
9. obserwowalność
10. czytelność i utrzymanie
11. styl kodu, jeśli nie jest już wymuszony automatycznie

### Pytania reviewera

#### Zgodność z zadaniem

- Czy PR realizuje dokładnie zakres story?
- Czy nie dodaje ukrytego zakresu?
- Czy acceptance criteria są spełnione?
- Czy coś z acceptance criteria zostało pominięte?
- Czy PR jest możliwy do przetestowania przez QA?

#### Architektura

- Czy rozwiązanie pasuje do obecnej architektury?
- Czy nie miesza warstw bez potrzeby?
- Czy odpowiedzialności są w dobrych miejscach?
- Czy kod będzie łatwy do zmiany za 3-6 miesięcy?
- Czy nie powstaje nowy globalny stan bez zasad dostępu?
- Czy refaktor jest uzasadniony?
- Czy nie wprowadzono zależności cyklicznych?

#### Dane i persistence

- Czy model danych pasuje do access patterns?
- Czy migracja jest bezpieczna dla produkcji?
- Czy dane historyczne są obsłużone?
- Czy constraints są w bazie, jeśli wymagają spójności?
- Czy query mają indeksy?
- Czy nie ma N+1 queries?
- Czy transakcje są krótkie?
- Czy operacje są idempotentne tam, gdzie mogą być ponawiane?

#### API i integracje

- Czy kontrakt API jest kompatybilny wstecznie?
- Czy błędy API są spójne?
- Czy statusy HTTP są poprawne?
- Czy requesty są walidowane?
- Czy timeouty i retry są ustawione?
- Czy integracja ma obsługę błędów systemu zewnętrznego?
- Czy logujemy wystarczająco dużo do diagnozy, ale bez sekretów?

#### Security

- Czy autoryzacja jest po stronie backendu?
- Czy użytkownik nie może odczytać lub zmienić cudzych danych?
- Czy tenant id nie jest brany bezkrytycznie z requestu?
- Czy input jest walidowany?
- Czy output nie tworzy XSS?
- Czy sekrety nie trafiają do frontendu, logów, response'ów albo repo?
- Czy uploady, webhooki, redirecty i integracje mają walidację?
- Czy nowe endpointy mają rate limiting albo inne ograniczenia, jeśli są podatne na nadużycia?

#### Frontend

- Czy UI obsługuje loading, error, empty i success state?
- Czy formularz ma walidację klienta i serwera?
- Czy cache TanStack Query jest invalidowany albo aktualizowany po mutacji?
- Czy optimistic update ma rollback?
- Czy eventy live nie powodują duplikatów?
- Czy komponent nie robi niepotrzebnych requestów?
- Czy stan lokalny nie dubluje bez potrzeby stanu serwerowego?
- Czy dostępność UI nie została pogorszona?

#### Testy

- Czy testy pokrywają zachowanie, a nie tylko implementację?
- Czy są testy negatywne?
- Czy są testy uprawnień?
- Czy testy integracyjne sprawdzają realne kontrakty?
- Czy snapshot nie ukrywa nieczytelnej zmiany?
- Czy testy są deterministyczne?
- Czy brak testu jest uzasadniony?

#### Utrzymanie

- Czy nazwy są zrozumiałe?
- Czy kod nie ukrywa zbyt dużo w magicznych helperach?
- Czy logi i metryki pozwolą znaleźć błąd po wdrożeniu?
- Czy dokumentacja została zaktualizowana?
- Czy PR jest za duży i trzeba go podzielić?

### Typy komentarzy w review

Komentarze powinny być oznaczane intencją:

- `Blocker:` problem blokujący merge
- `Should:` zmiana mocno zalecana przed merge
- `Question:` pytanie lub potrzeba wyjaśnienia
- `Suggestion:` propozycja poprawy
- `Nit:` drobnostka, która nie blokuje merge
- `Note:` komentarz edukacyjny albo kontekst

Przykład:

```markdown
Blocker: Ten endpoint sprawdza tylko rolę z requestu. Autoryzacja musi być oparta o dane z sesji/tokena po stronie backendu.

Suggestion: Można przenieść mapowanie DTO do osobnej funkcji, bo ten handler zaczyna mieszać walidację, zapis i formatowanie odpowiedzi.

Nit: Literówka w nazwie zmiennej.
```

### Czego unikać w code review

- blokowania PR przez preferencje stylistyczne, które nie są standardem zespołu
- przepisywania całego rozwiązania bez wskazania realnego ryzyka
- komentarzy typu „źle”, „brzydko”, „do poprawy” bez konkretu
- żądania perfekcji w małej zmianie, jeśli kod poprawia system
- akceptowania kodu, który pogarsza bezpieczeństwo albo spójność danych
- akceptowania PR bez sprawdzenia testów i ryzyk
- prowadzenia dyskusji architektonicznej w komentarzach, jeśli lepiej zrobić krótkie spotkanie

### Kiedy zatrzymać review i wrócić do rozmowy technicznej

- reviewer i autor nie zgadzają się co do architektury
- PR zmienia większy zakres niż story
- podczas review wychodzi, że wymaganie jest niejasne
- potrzeba decyzji product ownera albo klienta
- zmiana wymaga migracji lub rollout, którego nie opisano
- PR jest za duży, żeby rzetelnie go sprawdzić
