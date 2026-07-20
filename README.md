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

Commit-only, `git status`, pokazanie diffu/logu oraz staging już wykonanego spójnego slice'a korzystają z **Administrative Fast Path**. Nie tworzą nowego workflow state, planów, subagentów, rund review ani completion gate. Agent sprawdza dokładny scope, reuse'uje wcześniejsze verification evidence, stage'uje tylko właściwe pliki, tworzy lokalny commit Angular bez amend i raportuje hash/status. Jeśli scope jest niejednoznaczny lub hook zawiedzie, pyta albo raportuje tylko ten konkretny problem. Push, tag, release i deploy pozostają osobno autoryzowane. Adapter Pi dodatkowo wyłącza narzędzia workflow na wykryty commit-only turn, więc agent nie może rozpocząć planowania samego commita.

Wspólne skille i definicje agentów opisują izolowane plan review neutralnie względem harnessu. Adapter Pi mapuje je na `itsol_plan_review`; Claude Code używa natywnego Agent/Task z `itsol-self-review`, Codex read-only forked context, a OpenCode Task/@agent. Domyślny profil `balanced` ma `trigger: adaptive`: po proporcjonalnym self-review agent sam ocenia, czy osobny reviewer wniesie wartość względem skali, niepewności, nowości, blast radius i jakości weryfikacji. Małe, konwencjonalne plany pomijają tę ceremonię; duże lub materialnie ryzykowne mogą użyć izolowanego review bez dodatkowej zgody użytkownika. Tylko konkretne problemy wpływające na zakres, acceptance, poprawność, bezpieczeństwo danych, wykonalność, rollout lub weryfikację blokują plan. Styl, wording, opcjonalne detale i spekulacyjne edge case'y są sugestiami i nie uruchamiają kolejnej rundy. Domyślny limit to 2 próby na artefakt; `strict` lub jawny `trigger: final` nadal mogą wymusić aktualny werdykt.

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

Pi udostępnia `itsol_initiative_state`, `itsol_qa_plan`, `itsol_qa_verdict` oraz `/itsol-initiative status|activate|resume|pause`. Stan jest przenośny między sesjami i harnessami dzięki artefaktom repozytorium. Initiative Roadmap przechodzi panel review obejmujący requirements/product, architecture, QA, self-review oraz warunkowo security/data. Panel działa batchami według `max_parallel` i plan przechodzi dalej dopiero bez material blockers.

Po implementacji i code review każda faza otrzymuje application-aware QA matrix. Web UI używa agent-browser, Electron wspieranego CDP/browser path, CLI testów interaktywnych, API kontraktów/integracji/security, mobile runtime/device checks, data integrity/migration/rollback, a infrastruktura readiness/observability/rollback. Werdykt QA jest związany z fingerprintem implementacji. `FAIL` lub `BLOCKED` wymaga routingu `implementation-fix`, `plan-revision` albo `user-decision`, po czym workflow ponawia odpowiednie plan/code review i świeże QA. Po fazach wymagany jest aktualny final system QA PASS.

Completion gate blokuje zakończenie taska, dopóki wszystkie fazy i wymagania nie mają jawnego disposition, każda faza nie ma QA PASS, final system QA nie jest aktualny albo istnieją pending decisions. QA można jawnie zmienić lub wyłączyć w `.itsol.md`; skip jest raportowany jako policy skip, nigdy jako PASS.

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

Extension automatycznie dodaje krótki bootstrap dla zadań engineeringowych, mapuje współdzielone pojęcia narzędzi na Pi i rejestruje `itsol_task_state`, `itsol_initiative_state` oraz `itsol_delegate`. Stan workflow, execution policy, `done_when`, użyci agenci i koszty są zapisywane w sesji Pi i odtwarzane po `/reload`, resume oraz compaction. Po zapisaniu stanu kolejne delegacje mogą przekazywać tylko `task_id` i właściwy task packet. Footer pokazuje wersję pluginu, aktywny tryb, preset, wykorzystanie agentów, aktywne delegacje i łączny koszt głównego modelu oraz dzieci.

Delegowane agenty działają jako osobne procesy Pi z `--no-extensions`, jawną listą narzędzi, limitami z `itsol-execution-policy`, kontrolą stanu workflow i walidacją końcowego envelope. W trakcie pracy TUI pokazuje krótkie angielskie opisy bieżących akcji, np. `reading README.md`, `searching “workflow” in skills` lub `running: npm test`, aktywny model, źródło routingu, poziom thinking oraz czas w formacie `5s`, `2min 6s` albo `1h 2min`.

#### Asynchroniczne agenty ITSOL w Pi

`itsol_delegate` domyślnie uruchamia zadania **w tle** i natychmiast zwraca identyfikator delegacji, liczbę uruchomionych/oczekujących work itemów oraz wyraźną informację, że acknowledgement nie jest dowodem ukończenia. Główny agent może w tym czasie wykonywać niezależną pracę. Nie powinien odpytywać statusu ani używać `sleep`; po zakończeniu dostaje automatyczny `followUp` zawierający zweryfikowane statusy, output/evidence, czas, usage, model i reasoning wraz ze źródłami routingu oraz ścieżkę pełnego wyniku, jeśli output został obcięty.

Gdy kolejny krok naprawdę zależy od wyniku, można jawnie użyć:

```text
run_in_background: false
```

Ta opcja czeka na ten sam scheduler i zachowuje dotychczasowy wynik inline. Nie uruchamia osobnego, słabiej walidowanego mechanizmu.

W interaktywnym TUI nad edytorem pojawia się widget `Agents` z agentem, `work_item_id`, opisem, czasem, modelem/reasoningiem i bieżącą aktywnością. Nadmiar zadań trafia do kolejki FIFO; `max_parallel` ogranicza tylko liczbę jednoczesnych procesów. Widget jest ograniczony do 12 linii, bezpiecznie skraca szerokie dane i usuwa sekwencje sterujące terminala. W trybach RPC/JSON/print scheduler, accounting i wyniki nadal działają, ale komponent TUI nie jest renderowany.

Ochrona i backpressure:

- maksymalnie 32 oczekujące/uruchomione work itemy i 16 niepotwierdzonych grup wyników na sesję;
- budżet utrwalonych raportów tła wynosi 8 MiB; pojedynczy raport nadal ma limit 50 KB/2000 linii;
- `max_parallel: 0` blokuje delegację, a batch większy od limitu jest kolejkowany, nie odrzucany;
- nowe delegacje oraz bezpośrednie `edit`/`write` rezerwują zakres już w preflight, więc konflikt jest blokowany także wtedy, gdy oba narzędzia wystąpią w jednym batchu;
- arbitralnych zapisów ukrytych w `bash` nie da się niezawodnie sklasyfikować — procesy nie są sandboxem OS, dlatego nadal obowiązują task packet, write scope i odpowiedzialność głównego agenta;
- task state, limity, review/reset oraz completion pozostają zablokowane, dopóki aktywna praca, accounting albo dostarczenie wyniku nie zostaną domknięte.

Dostarczenie jest potwierdzane dopiero po zapisaniu wiadomości w aktywnej gałęzi sesji. Jeżeli automatyczny wynik pozostaje niepotwierdzony, model może awaryjnie użyć `itsol_delegate_result` z `task_id` i `delegation_id`; nie jest to narzędzie do pollingu. Także ten fallback czyści blocker dopiero po trwałym zapisaniu jego tool resultu, więc równoległe `itsol_complete` nie może przedwcześnie zakończyć zadania.

`/tree` jest blokowane, gdy istnieje uruchomiony/zakolejkowany agent, rezerwacja zapisu, błąd accountingu albo niepotwierdzony wynik. Operator powinien poczekać na zakończenie i automatyczny follow-up albo jawnie odebrać wskazany wynik przez `itsol_delegate_result`; po usunięciu zobowiązań nawigacja jest ponownie dostępna, a extension odtwarza stan wybranej gałęzi.

Przy `/reload`, `/new`, `/resume`, `/fork` lub wyjściu procesy dzieci są kończone i **nie są wznawiane**. W starej sesji zostaje ograniczony raport `failed/interrupted`, który można odebrać po ponownym otwarciu. Extension nie wysyła go ponownie automatycznie, żeby uniknąć duplikatów. Pi przechowuje wpisy sesji append-only, więc wcześniejsze ograniczone snapshoty pozostają lokalnie do czasu rotacji/usunięcia sesji; prywatne pliki w katalogu tymczasowym mają żywotność zależną od systemu. Implementacja jest testowana z Pi `0.80.10`.

Cost-aware model router używa kolejno jawnego `task.model`, mapowania `model_profile` i roli, modelu głównej sesji, a na końcu domyślnego modelu Pi. Mapowania można zdefiniować globalnie w `~/.pi/agent/itsolpowers.json` i nadpisać w zaufanym projekcie przez `.pi/itsolpowers.json`:

```json
{
  "modelProfiles": {
    "economy": {
      "default": {
        "model": "provider/cheap-model",
        "thinking": "low"
      }
    },
    "balanced": {
      "explore": {
        "model": "provider/cheap-model",
        "thinking": "low"
      },
      "plan": {
        "model": "provider/standard-model",
        "thinking": "medium"
      },
      "implement": {
        "model": "provider/standard-model",
        "thinking": "medium"
      },
      "review": {
        "model": "provider/strong-model",
        "thinking": "medium"
      }
    },
    "frontier": {
      "default": {
        "model": "provider/frontier-model",
        "thinking": "high"
      }
    }
  }
}
```

Role to `explore`, `plan`, `implement` i `review`. Można przekazać ją jawnie jako `task.role`; w przeciwnym razie extension klasyfikuje rolę z definicji agenta. Agenci posiadający narzędzia zapisu są zawsze klasyfikowani jako `implement`. Jawny `task.model` ma pierwszeństwo. Przy `model_control: enforced` każdy model musi odpowiadać skonfigurowanemu mapowaniu profilu i roli. Stary skrócony format `"explore": "provider/model"` pozostaje obsługiwany.

`/itsol-models configure` uruchamia interaktywny wizard wyboru scope i profilu. W ramach jednej sesji konfiguratora można ustawić wiele ról; dla każdej wybiera się model lub dziedziczenie oraz poziom reasoning. Po każdej roli można przejść do następnej, zapisać wszystkie zmiany w jednym kroku albo anulować bez zapisu. Lista poziomów reasoning w wizardzie jest pobierana dynamicznie z wybranego modelu przez natywne metadane Pi (`getSupportedThinkingLevels`), więc może obejmować np. `off`, `minimal`, `low`, `medium`, `high`, `xhigh` lub `max` zależnie od modelu. Extension zawsze dopasowuje poziom do faktycznych możliwości modelu (`model-clamp`). Mapping profile+role — również `xhigh` lub `max` — wygrywa z advisory reasoning presetu. `policy-clamp` pojawia się wyłącznie wtedy, gdy użytkownik albo `.itsol.md` jawnie ustawi `reasoning_control: enforced`; domyślne presety używają advisory fallback i nie obcinają skonfigurowanych ról. Przykładowy twardy limit repo:

```yaml
execution:
  restrictions:
    - match:
        path: cost-sensitive
      reasoning_profile: medium
      reasoning_control: enforced
```

Dla istniejącego task state utworzonego przez starszą wersję można zdjąć dawny domyślny clamp bez zmiany modelu/presetu:

```text
/itsol reasoning advisory
```

Komendy stanu, inicjatyw i modeli:

```text
/itsol-init
/itsol-init guided
/itsol initiative start <business-document-path>
/itsol initiative status
/itsol initiative activate <initiative-id>
/itsol initiative resume [initiative-id]
/itsol initiative pause
# equivalent dedicated command:
/itsol-initiative start <business-document-path>
/itsol-initiative status
/itsol-initiative activate <initiative-id>
/itsol-initiative resume [initiative-id]
/itsol-initiative pause
/itsol status
/itsol activate <task-id>
/itsol mode governed|autonomous-planned|direct
/itsol preset economy|standard|deep
/itsol reasoning advisory
/itsol reasoning enforced <low|medium|high>
/itsol agents unlimited|0..64
/itsol parallel 0..10
/itsol reset [task-id]
/itsol-models status
/itsol-models reload
/itsol-models configure
/itsol-policy status
/itsol-policy reload
/itsol-review status
/itsol-review profile off|poc|balanced|strict|default
/itsol-review off
/itsol-review rerun
```

`/itsol-init` natychmiast tworzy bezpieczny root `.itsol.md`, bez nadpisywania istniejącego pliku. Scaffold używa `governed`, `standard`, `balanced` review i `automatic` QA, a nieznane fakty projektu oznacza jako `unknown`. `/itsol-init guided` uruchamia bounded repo-memory discovery: agent inspekuje lekkie manifesty, proponuje mapę projektów, TDD/verification/review/QA policy i pyta tylko o materialne braki. Nie tworzy task state ani planów, nie uruchamia delegowanego code review/QA i nie przepuszcza całego worktree przez review; po zapisie waliduje `.itsol.md` parserem oraz jednym inline self-review i kończy.

`standard` i `deep` domyślnie używają `max_subagents: unlimited` oraz `max_parallel: 3`: workflow może dobrać dowolną liczbę typów specjalistów, ponownie używać ten sam typ dla różnych work itemów i wykonywać je batchami do trzech procesów. Numeryczny limit typów agentów pojawia się wyłącznie po jawnym `/itsol agents N`, restrykcji `.itsol.md` albo wyborze restrykcyjnego `economy`. `max_parallel` ogranicza tylko jednoczesne procesy, nie całkowite pokrycie workflow.

### Automatyczna polityka `.itsol.md`

Extension samodzielnie znajduje root repozytorium, czyta root `.itsol.md` oraz najbardziej szczegółowe lokalne override'y, parsuje bloki YAML i normalizuje workflow, execution i review restrictions, Monorepo Map, TDD mode, verification commands, agent workflow notes i known constraints. Znormalizowana polityka jest wstrzykiwana do system promptu; agent nie powinien ponownie czytać ani parsować `.itsol.md`, chyba że użytkownik prosi o utworzenie, edycję, inspekcję lub audyt tego pliku.

`itsol_task_state` i `itsol_delegate` są walidowane względem dopasowanych `allowed_modes`, ograniczeń ścieżek i operacji, `max_subagents`, `max_parallel`, `max_review_rounds` oraz `stop_after`. Task state może przekazać `policy_context.paths` i `policy_context.operations`, a delegowane taski mogą wskazać `operations`. Błędny YAML jest raportowany i blokuje użycie polityki zamiast cichego fallbacku.

### Review orchestrator

Review jest sterowane niezależną polityką projektu. Profile `off`, `poc`, `balanced` i `strict` określają trigger, delegowanie, automatyczny re-review oraz limit rund. Domyślny `balanced` używa `adaptive`: agent sam decyduje, czy formalne review ma sens oraz czy wykonać je inline czy przez specjalistów. `manual` działa wyłącznie na żądanie, a `final` wymusza jedną rundę przed completion. Execution policy pozostaje twardym sufitem zasobów.

```yaml
workflow:
  default_mode: direct
execution:
  default_preset: economy
review:
  default_profile: poc
  trigger: final
  delegation: never
  auto_rereview: never
  max_rounds: 1
  plan_max_rounds: 2
  allowed_profiles: [off, poc, balanced, strict]
```

Dla profilu `off` completion nie wymaga planu ani verdictu. Przy `adaptive` agent najpierw ocenia koszt i wartość review; mała, konwencjonalna, dobrze zweryfikowana zmiana może zakończyć się bez formalnej rundy. Jeśli review jest wymagane albo wybrane, `itsol_review_plan` analizuje diff i przyjmuje strategię `inline`, `specialists` lub `adaptive` wraz z uzasadnieniem. `strict` może nadpisać zbyt wąski wybór.

Specjaliści są dobierani tylko wtedy, gdy niezależna wiedza realnie zwiększa pewność — np. przy materialnym ryzyku security/data/infra, szerokim cross-cutting scope lub diffie zbyt dużym na jeden kontekst. Sama liczba plików, słowo w komentarzu albo luźne dopasowanie kategorii nie wystarcza. Klasyfikacja treści pomija komentarze, a reviewer konkretnego silnika bazy jest wybierany wyłącznie przy śladzie tego silnika w zmienionych ścieżkach; nieznany silnik używa review neutralnego technologicznie. Plan respektuje limity wykonania; obowiązkowe review z profilu `strict`, które się w nich nie mieści, pozostaje jawnie `blocked`.

Po inline lub multi-agent review `itsol_review_verdict` deduplikuje findings i odrzuca niematerialne blokady. `changes-requested` wymaga `Blocker` albo konkretnego findingu `critical/high` z wiarygodną ścieżką awarii. Sugestie, nity, preferencje stylistyczne, opcjonalne refaktory, spekulacyjne edge case'y i unrelated legacy debt nie blokują ani nie uzasadniają re-review. Pełne coverage gaps są twarde w `strict`; w `balanced` blokują tylko brak wybranego/wymaganego reviewera.

Każdy plan zapisuje fingerprint diffu. Zmiana kodu po verdictcie unieważnia wcześniejsze `approve`. Automatyczny re-review jest sygnalizowany tylko po `changes-requested`, gdy fingerprint faktycznie się zmienił i pozostała dostępna runda. `after-fixes` uruchamia pojedynczą kolejną rundę, `until-approved` działa do zatwierdzenia lub twardego limitu, a `never` wyłącza automatyzację.

### Completion gate

Każde zarządzane zadanie kończy się przez `itsol_complete`. Narzędzie sprawdza dokładne pokrycie `done_when` dowodami, aktywnych agentów, najnowsze statusy delegacji, review evidence, artifact state i osiągnięty `stop_after`. Pierwsze odrzucenie daje jeden automatyczny corrective turn; kolejne odrzucenie przechodzi do końcowego podsumowania jako wynik niekompletny. Uczciwe `partial`, `blocked` i `failed` są akceptowane tylko z jawnymi `unverified` gaps. Po zaakceptowanym lub finalnie odrzuconym gate extension tymczasowo wyłącza narzędzia i wymusza jedną końcową turę tekstową z podsumowaniem rezultatu, osiągnięć, kluczowych ustaleń, weryfikacji i pozostałych luk, po czym przywraca wcześniejszy zestaw narzędzi. Zaakceptowany wynik jest utrwalany w task state i widoczny w footerze.

Procesy nie są sandboxem systemu operacyjnego; write scopes są walidowane w task packetach, ale komendy shell nadal działają z uprawnieniami użytkownika.

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
