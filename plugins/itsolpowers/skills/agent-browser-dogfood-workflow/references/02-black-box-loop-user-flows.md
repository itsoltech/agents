# Black Box Loop User Flows

## Work Model

### Black-Box Phase

Act like a user:

- use the UI
- read visible screen content
- observe loading, error, and success states
- do not inspect source code
- do not justify behavior from implementation knowledge
- do not change storage or DOM to force a result

This keeps the report grounded in actual user experience.

### Diagnostic Phase

After a problem is observed, use diagnostics to locate the likely layer:

- console output
- page errors
- requests and responses
- HAR
- trace
- profiler
- Core Web Vitals
- storage
- cookies without revealing values
- framework devtools when the session supports them

Diagnostics support the finding. They do not replace UI reproduction.

### Code Analysis Phase

Inspect implementation only after black-box evidence is saved. Keep code-analysis notes separate from the user-facing behavior report. Do not redefine expected behavior based on current implementation.

## Core Loop

For every operation:

1. Observe: capture snapshot, URL, and current state.
2. State expectation: write what should happen.
3. Act: use an interaction that matches user behavior.
4. Wait for condition: text, URL, element, loader disappearance, or expected state.
5. Verify result: UI, data, URL, button state, toast, list, or detail.
6. Check diagnostics when the action uses API or asynchronous behavior.
7. Record coverage as pass, fail, blocked, observation, or not tested.
8. Capture a fresh snapshot before the next interaction when the page changes.

Pattern:

```bash
agent-browser --session "${SESSION}" snapshot -i --json
agent-browser --session "${SESSION}" click @e7
agent-browser --session "${SESSION}" wait --text "Saved"
agent-browser --session "${SESSION}" snapshot
agent-browser --session "${SESSION}" network requests --type xhr,fetch --method POST
agent-browser --session "${SESSION}" errors
```

## Phase 1: Initialization

Open the target, wait only as much as needed, and record metadata. Do not wait unconditionally for network idle when the app has continuous traffic.

Pattern:

```bash
agent-browser --version > "${OUT}/agent-browser-version.txt"
agent-browser --session "${SESSION}" open "${TARGET_URL}"
agent-browser --session "${SESSION}" wait --load domcontentloaded
agent-browser --session "${SESSION}" get url
agent-browser --session "${SESSION}" get title
```

Metadata should include date and time, URL, environment, app version, tool version, operating system, browser executable, role, viewport, feature flags, session name, and scope.

## Phase 2: Login

Log in and verify the destination route and role. Do not assume redirect alone proves correct authentication.

Check:

- UI shows the expected user
- role is correct
- expected modules are visible
- forbidden modules are hidden or blocked
- refresh preserves the session
- logout clears access and client data

Pattern:

```bash
agent-browser --session "${SESSION}" state save "${OUT}/auth-state.json"
```

## Phase 3: App Orientation

Capture the initial state and map the application before deep testing:

```bash
agent-browser --session "${SESSION}" screenshot --annotate "${OUT}/screenshots/initial.png"
agent-browser --session "${SESSION}" snapshot
agent-browser --session "${SESSION}" snapshot -i --urls
agent-browser --session "${SESSION}" console
agent-browser --session "${SESSION}" errors
```

Map top-level navigation, core modules, key flows, global controls, user settings, role limits, required data, destructive actions, and external dependencies. Choose priority flows before clicking through features.

## Phase 4: Smoke Test

Smoke test decides whether the environment is valid for full dogfood.

Check:

- app loads
- no global crash appears
- login works
- main navigation works
- critical endpoints do not repeatedly return 5xx
- core screen has data or a correct empty state
- no blocking JavaScript error exists
- primary business action is available
- deployment matches the expected version

If smoke fails, stop full dogfood and record blocker evidence plus untested scope.

## Phase 5: User Flows

Test end-to-end flows, not isolated buttons.

For each feature, cover:

- entry point
- data preparation
- validation
- submit
- loading state
- success result
- error result
- page refresh
- back and forward navigation
- direct deep link
- re-entry into the data
- list and detail consistency
- logout and login again when relevant

Flow patterns:

```text
create: list -> open form -> validation -> save -> toast -> list item ->
detail -> reload -> list -> cache and filters

update: detail -> edit -> change data -> save -> detail -> list ->
second tab -> reload -> persistence check

delete: detail -> delete action -> confirmation -> cancel ->
delete again -> confirm -> list -> deep link to deleted item
```

## Phase 6: Negative Scenarios And Edge Cases

Choose scenarios by risk, complexity, and the changed feature. Ask:

- What happens for empty, single, many, minimum, and maximum values?
- What happens for long text, Unicode, whitespace-only input, and duplicates?
- What happens after double click, submit plus immediate navigation, or reload during a request?
- What happens when the network drops, the session expires, or the backend returns an error?
- What happens when data is incomplete or changed by another user?
- What happens when a live event arrives before mutation response or is delivered twice?
- What happens for list empty, loading, error, and overflow states?
- What happens in two tabs, after role or tenant change, around time-zone boundaries, and with longer locale strings?
- Can the user complete the flow with the keyboard instead of the mouse?
