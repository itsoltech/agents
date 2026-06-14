# itsol-agents

Marketplace agentów dla organizacji ITSOL. Repo zawiera konfigurację marketplace dla Claude Code i Codex oraz współdzielone pluginy z komendami, skillami i agentami, które każdy w zespole może zainstalować i aktualizować.

## Claude Code

W sesji Claude Code:

```
/plugin marketplace add itsoltech/agents
```

### Pluginy

#### itsol-workflow

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

## Codex

Marketplace Codex znajduje się w:

```
.agents/plugins/marketplace.json
```

Zawiera ten sam plugin `itsol-workflow`, z manifestem:

```
plugins/itsol-workflow/.codex-plugin/plugin.json
```

Po instalacji dostępne są skille:

- `ultra-plan` — interview do utworzenia `SPEC.md` na bazie wymagań
- `create-commit` — commit w konwencji Angular
- `fix-pr-review` — fix nierozwiązanych komentarzy review na PR i resolve wątków

## Kontrybucje

1. Zrób fork / branch
2. Zmień pliki w `plugins/<plugin-name>/`
3. Bump `version` w `plugins/<plugin-name>/.claude-plugin/plugin.json` oraz `plugins/<plugin-name>/.codex-plugin/plugin.json` (SemVer: patch dla fixów, minor dla nowych komend/skilli, major dla breaking changes)
4. Otwórz PR

### Dodawanie nowego pluginu

1. `mkdir -p plugins/<nazwa>/.claude-plugin plugins/<nazwa>/commands`
2. Utwórz `plugins/<nazwa>/.claude-plugin/plugin.json` z polami `name`, `description`, `version`, `author`
3. `mkdir -p plugins/<nazwa>/.codex-plugin plugins/<nazwa>/skills`
4. Utwórz `plugins/<nazwa>/.codex-plugin/plugin.json` z polami wymaganymi przez Codex
5. Dodaj wpisy do `plugins` w `.claude-plugin/marketplace.json` i `.agents/plugins/marketplace.json`
6. PR

### Lokalna walidacja

```
claude --plugin-dir ./plugins/<nazwa>
```

Sprawdź `/help` — komendy powinny być widoczne pod namespace `<nazwa>:`.

## Licencja

MIT.
