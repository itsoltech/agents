# dotnet-web-api-review Reference Sector: Przykładowy szablon PR

## Zawartość

- Przykładowy szablon PR

## Przykładowy szablon PR

```markdown

## Zakres

Krótki opis zmiany.

## Typ zmiany

- [ ] endpoint/API
- [ ] logika domenowa
- [ ] baza/migracja
- [ ] integracja zewnętrzna
- [ ] auth/security
- [ ] background job
- [ ] refactor
- [ ] performance

## Architektura

- [ ] zmiana pasuje do aktualnego układu modułów
- [ ] nie dodano zbędnej abstrakcji
- [ ] logika biznesowa jest testowalna poza HTTP

## Security

- [ ] auth/authz sprawdzone
- [ ] tenant isolation sprawdzone
- [ ] brak sekretów w kodzie/logach
- [ ] walidacja danych wejściowych
- [ ] rate limiting/limity rozmiaru, jeśli endpoint jest kosztowny

## Dane

- [ ] migracja bezpieczna dla produkcji
- [ ] query sprawdzone pod N+1 i pagination
- [ ] transakcje krótkie
- [ ] constraints/indeksy dopasowane

## Testy

- [ ] unit
- [ ] integration
- [ ] auth/security scenario
- [ ] migration test
- [ ] performance smoke, jeśli dotyczy

## Ryzyka

Opis ryzyk i plan rollback.
```
