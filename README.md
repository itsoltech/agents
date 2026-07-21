# itsol-agents

Marketplace agentów dla organizacji ITSOL. Repo zawiera konfigurację marketplace dla Claude Code i Codex oraz współdzielone pluginy dla Claude Code, Codex, OpenCode i Pi z komendami, skillami i agentami, które każdy w zespole może zainstalować i aktualizować.

## Claude Code

W sesji Claude Code można zainstalować marketplace przez slash command:

```
/plugin marketplace add itsoltech/agents
```

Następnie zainstaluj rekomendowany plugin:

```
/plugin install itsolpowers@itsoltech-agents
```

Alternatywnie można użyć CLI:

```
claude plugin marketplace add itsoltech/agents
claude plugin install itsolpowers@itsoltech-agents
claude plugin list
```

Po instalacji rozpocznij nową sesję Claude Code albo użyj `/reload-plugins`, żeby załadować skille, hook `SessionStart` i sub-agentów.

### Ważne: `superpowers` i `itsolpowers`

`superpowers` i `itsolpowers` wpływają na ten sam obszar pracy agenta: routing zadań, planowanie, użycie skilli, pracę sub-agentami, implementację i review. Mogą więc dawać agentowi konkurujące instrukcje.

Rekomendacja: przy korzystaniu z `itsolpowers` wyłącz `superpowers`, żeby nie mieszać agentowi workflow i nie pogarszać jakości routingu.

### Pluginy

#### itsolpowers

Rekomendowany plugin ITSOL. Zawiera skille ITSOL do routingu zadań, konfigurowalnych workflow modes, repo memory `.itsol.md`, aktualnego kontekstu technologii i dokumentacji, UI/UX frontendu, migracji technologii aplikacji, SQL Server/.NET data access, planowania funkcjonalnego, pracy sub-agentami, TDD, implementacji, debugowania, self-review, security review i infrastruktury.

```
/plugin install itsolpowers@itsoltech-agents
```

### Tryby pracy `itsol-workflow-mode`

Centralny skill `itsol-workflow-mode` rozstrzyga poziom ceremonii przed planowaniem lub implementacją:

| Tryb | Zachowanie | Stan artefaktu |
| --- | --- | --- |
| `governed` | Pełne Discovery i Decision Gates, proporcjonalny self-review, opcjonalny lub wymagany polityką review oraz jawna akceptacja każdego konkretnego planu. | `Draft`, potem `Approved` po akceptacji użytkownika |
| `autonomous-planned` | Agent tworzy i proporcjonalnie sprawdza plany, sam decyduje o wartości izolowanego review, wybiera rekomendację i kontynuuje bez pauz na akceptację. | `Draft`, potem `Ready for execution` |
| `direct` | Bez trwałych Business, Technical i Technical Fix Planów oraz ich bramek; nadal obowiązują evidence, TDD lub replacement verification i self-review. | `not-required` |

Commit-only, `git status`, pokazanie diffu/logu oraz staging już wykonanego spójnego slice'a korzystają z **Administrative Fast Path**. Nie tworzą nowego workflow state, planów, subagentów ani rund review. Agent sprawdza dokładny scope, reuse'uje wcześniejsze verification evidence, stage'uje tylko właściwe pliki, tworzy lokalny commit Angular bez amend i raportuje hash/status. Jeśli scope jest niejednoznaczny lub hook zawiedzie, pyta albo raportuje tylko ten konkretny problem. Push, tag, release i deploy pozostają osobno autoryzowane.

Wspólne skille i definicje agentów opisują plan review neutralnie względem harnessu. Claude Code może użyć natywnego Agent/Task, Codex read-only forked context, OpenCode Task/@agent, a Pi pracuje inline albo korzysta z narzędzia subagentowego dostarczonego przez osobno zainstalowaną extension. Adapter ITSOL dla Pi nie udostępnia własnej delegacji, osobnego plan-review orchestratora ani automatycznych reviewerów. Tylko konkretne problemy wpływające na zakres, acceptance, poprawność, bezpieczeństwo danych, wykonalność, rollout lub weryfikację powinny blokować plan.

Tryb jest domyślnie ograniczony do bieżącego zadania. Kolejność rozstrzygania to: reguły platformy, `allowed_modes` i pasujące restrykcje repozytorium, jawny wybór użytkownika dla zadania, dozwolony default `.itsol.md`, a na końcu `governed`. Jawny wybór zadania może nadpisać default repo, ale nie zakaz dla ścieżki lub operacji.

Zmiana trybu dotyczy tylko pozostałej pracy i nie usuwa istniejących planów. Przejście do `governed` zatrzymuje dalszą implementację na brakujących bramkach; przejście z `governed` do trybu autonomicznego zachowuje przejrzane artefakty i usuwa tylko przyszłe pauzy akceptacyjne. `Ready for execution` nie oznacza akceptacji użytkownika — `Approved` jest zarezerwowane dla konkretnego planu, który użytkownik zobaczył i zaakceptował.

Przykładowe polecenia:

```text
Use the full governed workflow and ask me to approve each plan.

Prepare and Rubber Duck-review the plans, make the recommended decisions yourself, and continue without approval pauses until the goal is reached.

Work directly without Business, Technical, or Fix Plans; still test, verify, and review the change.
```

Samo `continue`, `do it`, milczenie albo `accept everything` bez jawnego odniesienia do bramek bieżącego zadania nie wybiera trybu autonomicznego i nie deleguje decyzji.

Opcjonalny default i ograniczenia można utrwalić w root `.itsol.md` lub najbardziej szczegółowej sekcji projektu:

```yaml
workflow:
  default_mode: governed
  allowed_modes:
    - governed
    - autonomous-planned
    - direct
  restrictions:
    - match:
        path: infra/production
      allowed_modes:
        - governed
    - match:
        operation: production-deploy
      allowed_modes:
        - governed
```

Autonomia workflow nie rozszerza zakresu zadania. Destrukcyjne operacje na danych, niezlecony deploy lub publish na produkcję, sekrety poza zakresem, zewnętrzne wiadomości lub zakupy oraz osłabienie security pozostają osobnymi pytaniami o authority. Zwykłe edycje, testy, buildy i odwracalne działania w zakresie nie tworzą nowej approval pause.

### Initiative Delivery Workflow

Dla dużego dokumentu biznesowego opisującego cały moduł, aplikację, migrację albo wielofazową funkcję użyj `itsol-initiative-delivery`. Jest to osobna oś skali pracy (`delivery_scope: initiative`), zwykle połączona z `workflow_mode: autonomous-planned`, a nie czwarty tryb authority.

Agent analizuje pełny dokument, nadaje wymaganiom stabilne `REQ-NNN`, przypisuje każde wymaganie do outcome-oriented faz, proporcjonalnie self-reviewuje roadmapę, uruchamia panel tylko gdy wymaga tego polityka lub materialne ryzyko, i prowadzi kolejne fazy przez planowanie, implementację, adekwatne review, integrację oraz QA. Nie może wybrać jednego wycinka i uznać całej inicjatywy za zakończoną. Oryginalny dokument jest zachowany jako immutable snapshot, a living intent, traceability, roadmapa, architektura, decyzje, progress i phase evidence trafiają do:

```text
.itsol/initiatives/<initiative-id>/
```

W Pi initiative delivery pozostaje instrukcją współdzielonych skilli i artefaktów repozytorium. Extension nie rejestruje initiative state, automatycznego panelu review ani narzędzi QA; agent prowadzi taki workflow wyłącznie w zakresie wynikającym z bieżącej rozmowy i jawnie wybranych narzędzi.

Po implementacji i code review każda faza otrzymuje application-aware QA matrix. Web UI używa agent-browser, Electron wspieranego CDP/browser path, CLI testów interaktywnych, API kontraktów/integracji/security, mobile runtime/device checks, data integrity/migration/rollback, a infrastruktura readiness/observability/rollback. Werdykt QA jest związany z fingerprintem implementacji. `FAIL` lub `BLOCKED` wymaga routingu `implementation-fix`, `plan-revision` albo `user-decision`, po czym workflow ponawia odpowiednie plan/code review i świeże QA. Po fazach wymagany jest aktualny final system QA PASS.

Wspólne skille mogą wymagać evidence lub QA zależnie od wybranego workflow, ale adapter Pi nie posiada extension-managed completion gate i nie może blokować zakończenia taska ani automatycznie ponawiać pracy.

```yaml
qa:
  profile: automatic # off | evidence | automatic | strict
  max_cycles: 10
  application_types: [web-ui, api]
  commands:
    - npm run test:integration
  targets:
    - http://localhost:3000
  restrictions:
    - match:
        path: legacy/hard-to-run
      profile: off
    - match:
        path: packages/cli
      profile: evidence
      application_types: [cli]
      commands:
        - npm run test:cli
```

`off` usuwa phase/system QA gate, `evidence` wymaga skonfigurowanych lub dostarczonych dowodów bez automatycznych agentów interaktywnych, `automatic` dobiera QA do aplikacji, a `strict` traktuje także low-severity findings jako blokujące. Agent wraca do użytkownika tylko dla materialnej decyzji biznesowej/produktowej/scope/data/security/architecture, protected action, jawnej pauzy albo rzeczywistego blockera; po odpowiedzi aktualizuje zależne dokumenty, ponownie reviewuje zmienioną roadmapę i automatycznie wznawia wykonanie.

### Polityka kosztu `itsol-execution-policy`

`itsol-execution-policy` działa obok `itsol-workflow-mode`. Workflow określa, kto podejmuje decyzje i jakie bramki obowiązują; execution policy ogranicza model/reasoning, delegację, równoległość, review i etap zatrzymania. Preset nigdy nie zmienia trybu workflow.

| Preset | Profil | Reasoning | Typy agentów / instancje równoległe | Review | Domyślny stop |
| --- | --- | --- | --- | --- | --- |
| `economy` | economy | low | 0 / 0 | 1 cykl inline | wynik żądany przez użytkownika |
| `standard` | balanced | medium | unlimited / 3 | 2 cykle | `implementation-reviewed` |
| `deep` | frontier | high | unlimited / 3 | 2 cykle | `integration-validated` |

`max_subagents` ogranicza liczbę różnych typów/tożsamości agentów, nie liczbę ich uruchomień. Ten sam typ może równolegle realizować kilka niezależnych packetów oznaczonych stabilnym `work_item_id`; każdy proces liczy się osobno tylko do `max_parallel`. Równoległe writery nadal muszą mieć rozłączne scope. Numeryczny limit typów powstaje wyłącznie z jawnej instrukcji użytkownika, `economy` albo restrykcji repozytorium.

ITSOL Powers celowo nie ustawia `maxTurns`. Zakończenie pętli agenta nie oznacza wykonania zadania. Każdy worker zwraca status `completed`, `partial`, `blocked` albo `failed`, weryfikację i braki; orchestrator akceptuje `completed` dopiero po sprawdzeniu `done_when` i dowodów. Claude plugin używa jednego deterministycznego retry dla brakującego envelope, bez nieskończonej pętli.

Modele i reasoning są provider-neutral intent. Claude workers mają overrideable balanced default `sonnet`/`medium`; Codex bez skonfigurowanych ról i OpenCode raportują profil jako advisory. Codex może dostać zarządzane role przez `$itsol-codex-setup`, a ich strukturę sprawdza `$itsol-codex-doctor`. Żaden delegowany agent nie ma prawa uruchamiać kolejnych agentów.

Przykłady:

```text
Use ITSOL standard execution policy and stop after implementation-reviewed.

Use economy, agents off, and stop after analysis.

Use deep reasoning, at most one worker, and stop after integration validation.

Use standard with at most two agents. Delegate only independent read-only investigation and one independent implementation review.

Prepare and review the plans, then stop after technical-plan. Do not implement.

Create the PR, handle only the first review batch, then stop. Do not continue further review rounds.
```

#### itsol-workflow deprecated

`itsol-workflow` jest starym pluginem i jest deprecated. Jego główne workflow zostały przeniesione i rozbudowane w `itsolpowers`.

Nie instaluj `itsol-workflow` w nowych setupach. Używaj `itsolpowers`, który zawiera nowsze workflow planowania, code review, commitów, sub-agentów i repo memory.

Stare komendy `itsol-workflow` pozostają w repo tylko dla kompatybilności z istniejącymi instalacjami:

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
/plugin update itsolpowers@itsoltech-agents
```

Aktualizacje `itsolpowers` wymagają zgodnego pola `version` w rootowym adapterze Pi `package.json`, `plugins/itsolpowers/package.json`, `plugins/itsolpowers/.claude-plugin/plugin.json` i `plugins/itsolpowers/.codex-plugin/plugin.json`. Przy wydaniu przez marketplace zaktualizuj również jego wersję w `.claude-plugin/marketplace.json`. Bez wymaganych bumpów klient może nie pobrać nowej wersji.

`itsol-workflow` jest deprecated, więc aktualizuj go tylko wtedy, gdy utrzymujesz starą instalację, która jeszcze go wymaga.

### Diagnostyka Claude Code

Jeśli Claude Code nie korzysta z routingu `itsolpowers`, sprawdź:

```
/plugin list
/plugin details itsolpowers@itsoltech-agents
/reload-plugins
```

W terminalu można też uruchomić:

```
claude --debug
claude plugin validate ./plugins/itsolpowers
```

W `details` plugin powinien pokazywać skille, agentów i hook `SessionStart`. Po aktualizacji pluginu rozpocznij nową sesję albo użyj `/reload-plugins`, bo zmiany w hookach i agentach nie muszą wejść do już działającej sesji.

## OpenCode

`itsolpowers` ma osobny plugin OpenCode w:

```
plugins/itsolpowers/.opencode/plugins/itsolpowers.js
```

OpenCode ładuje pluginy na dwa sposoby: lokalne pliki JS/TS z `.opencode/plugins/` lub `~/.config/opencode/plugins/`, albo paczki npm wpisane w `plugin` w `opencode.json`.

Po publikacji paczki można dodać ją do globalnego albo projektowego `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["itsolpowers"]
}
```

Do lokalnego developmentu utwórz wrapper w `.opencode/plugins/itsolpowers.js` albo `~/.config/opencode/plugins/itsolpowers.js`:

```js
export {
  ItsolPowersPlugin,
  ItsolPowersPlugin as default,
} from "file://<path-to-repo>/plugins/itsolpowers/.opencode/plugins/itsolpowers.js";
```

Po restarcie OpenCode plugin rejestruje katalog `plugins/itsolpowers/skills` i wstrzykuje router `using-itsolpowers` jako bootstrap kontekstu. Szczegóły instalacji są w:

```
plugins/itsolpowers/.opencode/INSTALL.md
```

## Pi

`itsolpowers` jest pakietem Pi zawierającym wszystkie skille oraz extension z bootstrapem, diagnostyką i izolowaną delegacją do agentów ITSOL.

Instalacja z lokalnego checkoutu:

```bash
pi install ./plugins/itsolpowers
```

Instalacja tylko dla bieżącego projektu:

```bash
pi install -l ./plugins/itsolpowers
```

Instalacja bez npm, bezpośrednio z repozytorium Git przez HTTPS:

```bash
pi install https://github.com/itsoltech/agents
```

Rekomendowana instalacja przypiętego release:

```bash
pi install https://github.com/itsoltech/agents@v0.22.0
```

Dla prywatnego repozytorium można użyć SSH:

```bash
pi install git:git@github.com:itsoltech/agents@v0.22.0
```

Rootowy `package.json` jest adapterem Pi wskazującym extension i skille z `plugins/itsolpowers/`. URL musi wskazywać repozytorium Git; adres GitHub `tree/.../plugins/itsolpowers` nie jest obsługiwanym źródłem pakietu.

Do jednorazowego testu bez zapisywania ustawień:

```bash
pi -e ./plugins/itsolpowers
```

Pi ładuje skille bez namespace pluginu. Główny router jest dostępny jako:

```text
/skill:using-itsolpowers
```

Extension Pi używa minimalnego modelu opartego na wersji `0.18`: bootstrap routuje pracę przez skille ITSOL Powers, a `itsol_task_state` opcjonalnie przechowuje informacyjny workflow/execution context. Extension ITSOL samodzielnie nie uruchamia modeli ani agentów potomnych i nie posiada własnej delegacji, automatycznych review, QA, initiative loops, corrective turns ani completion gate.

Przed każdą turą extension sprawdza wyłącznie, czy w root repozytorium istnieje `.itsol.md`, i wstrzykuje krótką informację `EXISTS` albo `DOES NOT EXIST`. Nie czyta, nie parsuje, nie waliduje i nie egzekwuje zawartości tego pliku. Agent nie powinien ponownie używać `find`, `ls` ani `test -f` tylko po to, aby sprawdzić jego obecność. Gdy plik istnieje, jego treść obsługuje skill `itsol-repo-memory`.

Bez dodatkowej extension Pi wykonuje pracę inline. Adapter ITSOL nie rejestruje narzędzia delegacji, nie uruchamia procesów dzieci i nie konfiguruje modeli subagentów. Jeżeli bieżąca sesja udostępnia `Agent`, `Task` albo równoważne narzędzie z innej extension, agent może użyć pracy wieloagentowej zgodnie z ITSOL workflow/execution policy i rzeczywistym kontraktem tego narzędzia. Przykładem jest [`@tintinweb/pi-subagents`](https://pi.dev/packages/@tintinweb/pi-subagents), instalowany opcjonalnie przez:

```bash
pi install npm:@tintinweb/pi-subagents
```

Ta extension udostępnia między innymi narzędzie `Agent`, agentów foreground/background oraz pracę równoległą. Nie jest zależnością ITSOL Powers i nie jest instalowana automatycznie.

Task state nie kontroluje zakończenia głównego zadania. Jedynym narzędziem własnym adaptera jest `itsol_task_state`; nie istnieje `itsol_delegate` ani narzędzia Pi `itsol_complete`, `itsol_plan_review`, `itsol_review_plan`, `itsol_review_verdict`, `itsol_initiative_state`, `itsol_qa_plan` i `itsol_qa_verdict`.

Podstawowe komendy:

```text
/itsol status
/itsol activate <task-id>
/itsol mode governed|autonomous-planned|direct
/itsol preset economy|standard|deep
/itsol reset [task-id]
```

Adapter nie zarządza wyborem modelu ani reasoningiem Pi. Pola model/reasoning w informacyjnym task state pozostają częścią wspólnego kontraktu execution policy, ale extension ich nie egzekwuje.

Diagnostyka:

```text
/itsolpowers-doctor
```

Komenda pokazuje liczbę załadowanych skilli i agentów, brakujące skille bazowe, kolizje nazw oraz możliwy konflikt z `superpowers`. Po zmianie extension lub skilli użyj `/reload`.

## Codex

Instalacja w Codex:

```
/plugins
```

1. Wybierz `Add Marketplace`.
2. Dodaj marketplace:

```
itsoltech/agents
```

3. Wybierz plugin `itsolpowers`.
4. Włącz plugin i rozpocznij nową sesję, żeby załadować skille i hooki.

Jeśli masz włączony `superpowers`, wyłącz go przed użyciem `itsolpowers`.

Marketplace Codex znajduje się w:

```
.agents/plugins/marketplace.json
```

Plugin `itsolpowers` ma manifest:

```
plugins/itsolpowers/.codex-plugin/plugin.json
```

Domyślna konfiguracja ról Codex:

```text
$itsol-codex-setup skonfiguruj profil balanced globalnie
$itsol-codex-doctor sprawdź konfigurację globalną
```

Setup najpierw pokazuje dry-run, zarządza wyłącznie rolami `itsol_*`, ustawia `max_depth = 1`, nie używa `maxTurns` i nie wykonuje płatnych wywołań do sprawdzania entitlementu modelu. Project scope jest dostępny na jawne żądanie użytkownika.

Po instalacji `itsolpowers` dostępne są skille:

- `using-itsolpowers` — routing zadań do właściwych skillów ITSOL
- `itsol-workflow-mode` — centralny kontrakt trybów `governed`, `autonomous-planned` i `direct`, precedence, stanów artefaktów, delegowania decyzji i ograniczeń repo
- `itsol-execution-policy` — niezależny kontrakt kosztu, modeli/reasoningu, delegacji, review, `done_when`, stop pointów i completion evidence bez `maxTurns`
- `itsol-codex-setup` — jawny dry-run i instalacja czterech zarządzanych ról Codex w profilu `economy`, `balanced` albo `quality`, globalnie lub projektowo
- `itsol-codex-doctor` — read-only diagnostyka wersji Codex, ról, managed state, limitów i driftu bez płatnego sprawdzania dostępności modeli
- `itsol-task-intake`, `itsol-repo-memory`, `itsol-current-tech-context`, `application-technology-migration`, `itsol-requirements-review`, `itsol-functional-planning`, `itsol-subagent-workflow`, `itsol-feature-implementation`, `itsol-bug-debugging`, `itsol-tdd-workflow`, `itsol-technical-planning`, `itsol-code-review-workflow`, `itsol-self-review`, `itsol-qa-handoff` — procesowe workflow pracy od wymagań, repo policy `.itsol.md`, aktualnej dokumentacji i migracji technologii, przez zależne od trybu plany lub bezpośrednią realizację, podział pracy na sub-agentów, red-green-refactor albo repo-policy replacement verification, do QA
- `security-*` — rozdrobnione skille security dla threat modelingu, auth, authz, API, frontendu, sekretów, supply chain, QA i obsługi podatności
- `infra-*` — rozdrobnione skille infrastrukturalne dla deploymentu, kontenerów, Nomada, routingu, edge protection, sekretów, obserwowalności, backupów, capacity i incidentów
- `ui-*` — framework-agnostic UI/UX frontendu: workflow, design system, architektura komponentów, stany i formularze, responsywność, Tailwind/tokeny, accessibility/motion, performance/stability, testy/QA i code review UI
- `svelte-*`, `tanstack-query-svelte-*`, `hey-api-openapi-*` — frontend, server state i klient API generowany z OpenAPI
- `dotnet-web-api-*`, `effect-typescript-*`, `rust-*`, `rust-ml-llm-*` — backend, typed TypeScript, Rust oraz aplikacje ML/LLM z Rig i Candle
- `postgres-*`, `mongodb-*`, `mssql-*` — projektowanie, review i debugowanie operacyjne baz danych

`itsol-workflow` jest dostępny w marketplace tylko jako deprecated compatibility plugin:

```
plugins/itsol-workflow/.codex-plugin/plugin.json
```

## Kontrybucje

1. Zrób fork / branch
2. Zmień pliki w `plugins/<plugin-name>/`
3. Dla `itsolpowers` zachowaj identyczne `version` w rootowym `package.json`, `plugins/itsolpowers/package.json`, `plugins/itsolpowers/.claude-plugin/plugin.json` i `plugins/itsolpowers/.codex-plugin/plugin.json` (SemVer: patch dla fixów, minor dla nowych komend/skilli, major dla breaking changes)
4. Jeśli zmiana jest wydawana przez marketplace, zaktualizuj także `version` w `.claude-plugin/marketplace.json`
5. Otwórz PR

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
