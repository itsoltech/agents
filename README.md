# itsol-agents

Marketplace Claude Code dla organizacji ITSOL. Zawiera współdzielone pluginy z komendami, skillami i agentami, które każdy w zespole może zainstalować jednym poleceniem i automatycznie aktualizować.

## Instalacja marketplace

W sesji Claude Code:

```
/plugin marketplace add itsoltech/agents
```

## Pluginy

### itsol-workflow

Komendy do pracy z PR-ami, commitami i specyfikacjami.

```
/plugin install itsol-workflow@itsoltech-agents
```

Po instalacji dostępne komendy:

- `/itsol-workflow:ultra-plan` — interview do utworzenia `SPEC.md` na bazie wymagań
- `/itsol-workflow:create-commit` — commit w konwencji Angular
- `/itsol-workflow:fix-pr-review` — fix nierozwiązanych komentarzy review na PR i resolve wątków

## Aktualizacje

```
/plugin marketplace update itsoltech-agents
/plugin update itsol-workflow@itsoltech-agents
```

Aktualizacje są wydawane przez bump pola `version` w `plugin.json` (i w `marketplace.json`). Bez bumpa Claude Code nie pobiera nowej wersji.

## Kontrybucje

1. Zrób fork / branch
2. Zmień pliki w `plugins/<plugin-name>/`
3. Bump `version` w `plugins/<plugin-name>/.claude-plugin/plugin.json` (SemVer: patch dla fixów, minor dla nowych komend, major dla breaking changes)
4. Otwórz PR

### Dodawanie nowego pluginu

1. `mkdir -p plugins/<nazwa>/.claude-plugin plugins/<nazwa>/commands`
2. Utwórz `plugins/<nazwa>/.claude-plugin/plugin.json` z polami `name`, `description`, `version`, `author`
3. Dodaj wpis do `plugins` w `.claude-plugin/marketplace.json`
4. PR

### Lokalna walidacja

```
claude --plugin-dir ./plugins/<nazwa>
```

Sprawdź `/help` — komendy powinny być widoczne pod namespace `<nazwa>:`.

## Licencja

MIT.
