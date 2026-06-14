# mongodb-review Reference Sector: Checklist do code review

## Zawartość

- Checklist do code review
- Minimalny standard dla nowej kolekcji

## Checklist do code review

### Model danych

- czy kolekcja ma opis access patterns?
- czy dane odczytywane razem są przechowywane razem?
- czy tablice mają ograniczony wzrost?
- czy dokument nie może przekroczyć rozsądnego rozmiaru?
- czy dane mają lifecycle i retencję?
- czy schemaVersion jest potrzebny?
- czy schema validation powinna chronić tę kolekcję?
- czy embedding/reference jest uzasadniony?

### Zapytania i indeksy

- czy każde nowe zapytanie ma znany indeks?
- czy wykonano `explain("executionStats")` dla krytycznych zapytań?
- czy zapytania listujące mają limit?
- czy sortowanie jest wspierane przez indeks?
- czy projection ogranicza pobierane pola?
- czy nie ma głębokiego `skip`?
- czy nie ma regexa bez kontroli?
- czy indeks nie duplikuje istniejącego indeksu?
- czy indeks ma nazwę opisującą cel?

### Zapisy i spójność

- czy operacja jest idempotentna?
- czy upsert opiera się na unique index?
- czy duplicate key jest obsługiwany jako błąd domenowy?
- czy write concern pasuje do klasy danych?
- czy optimistic concurrency jest potrzebne?
- czy transakcja jest naprawdę potrzebna?
- czy transakcja jest krótka?

### Multi-tenancy

- czy wszystkie zapytania mają `tenantId`?
- czy unique indexes są scoped per tenant?
- czy test pokrywa cross-tenant access?
- czy dane administracyjne są jawnie oddzielone od tenantowych?
- czy eksport/restore per tenant jest możliwy, jeśli wymagany?

### Bezpieczeństwo

- czy aplikacja używa konta z minimalnymi uprawnieniami?
- czy connection string jest sekretem?
- czy logi nie zawierają pełnych dokumentów ani sekretów?
- czy dane wejściowe nie są przekładane na surowe query MongoDB?
- czy pola sort/filter są whitelisted?
- czy dane wrażliwe są minimalizowane?

### Operacje i utrzymanie

- czy nowa kolekcja ma strategię backup/restore?
- czy duża migracja działa batchami?
- czy migracja jest idempotentna?
- czy dodanie indeksu jest bezpieczne dla dużej kolekcji?
- czy monitoring obejmuje nowe query path?
- czy alerty są potrzebne dla nowej funkcji?
- czy dokumentacja runbook została zaktualizowana?
## Minimalny standard dla nowej kolekcji

Nowa kolekcja nie powinna zostać dodana bez:

- opisu celu
- przykładowego dokumentu
- listy access patterns
- listy indeksów
- opisu retencji
- opisu danych wrażliwych
- decyzji o schema validation
- decyzji o tenant isolation
- decyzji o backup/restore
- testów repository
- testu `explain()` dla głównych zapytań
- planu migracji, jeśli kolekcja zastępuje stare dane

Szablon:

```md
# Collection: <name>

Owner:
Purpose:
Data classification:
Retention:
Expected growth:
Shard candidate: yes/no
Schema validation: yes/no
Schema version field: yes/no
