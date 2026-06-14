# mongodb-data-modeling Reference Sector: Minimalny standard dla nowej kolekcji

## Zawartość

- Minimalny standard dla nowej kolekcji

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

## Example document

## Access patterns

## Indexes

## Write/read concerns

## Migration plan

## Backup/restore notes

## Security notes
```
