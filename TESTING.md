# Testing

This project ships a direct browser resource for Home Assistant. Prefer the
fastest check that proves the change, then run the full local check before a
pull request.

The current system and the required improvements before major runtime work are
reviewed in [docs/maintainers/testing-strategy.md](docs/maintainers/testing-strategy.md).
That document is the source of truth for test-layer responsibilities and quality
gates; this file describes the commands available in the current repository.

## Quick Syntax Check

Run this after editing the distributed card file:

```sh
node --check dist/xiaomi-vacuum-card.js
```

This catches JavaScript syntax errors without starting Home Assistant.

## Full Local Check

Install dependencies once per checkout:

```sh
npm ci
```

Run the complete local validation suite:

```sh
npm run check
```

`npm run check` runs syntax validation, version checks, ESLint, Prettier format
checking, and the Node test suite.

## Unit And Source VM Tests

Run the unit/source harness directly with:

```sh
npm test
```

The Node tests load `dist/xiaomi-vacuum-card.js` through a VM-based Home
Assistant/Lit harness. Use these tests for card metadata, configuration,
source precedence, formatting helpers, service-call payloads, template handling,
and other contracts that do not require a real browser.

The VM harness is intentionally not a real Lit or DOM implementation. It does
not prove reactive updates, Shadow DOM output, focus, keyboard behavior, event
propagation, accessibility roles, or user-visible interaction state. Do not add
more fake browser behavior to make a lifecycle-sensitive test pass. Use the real
browser component layer (`npm run test:component`) for lifecycle and DOM
assertions, while full Home Assistant smoke coverage (`npm run test:ha-smoke`)
verifies integration, resource loading, and container-level boundaries.

## Browser Component Tests

Install the Chromium browser once:

```sh
npx playwright install chromium
```

Run the real-browser component test layer with:

```sh
npm run test:component
```

The component harness loads the shipped card (`dist/xiaomi-vacuum-card.js`) into a
Chromium browser page with an actual LitElement runtime, real Shadow DOM, and
deterministic Home Assistant object stubs, without starting a full Home Assistant
container.

Use this layer for:

- reactive `hass` and entity-state updates;
- visible Shadow DOM output and DOM assertions;
- focus, keyboard navigation, and ARIA accessibility roles;
- unavailable and disabled states;
- service and WebSocket action dispatches;
- render-count and lifecycle regressions.

## Home Assistant Smoke Test

Use the smoke test for browser loading, Home Assistant resource wiring, editor or
registry integration, service and WebSocket boundaries, and integration checks
that a deterministic component harness cannot cover.

The setup copies `tests/ha-smoke/home-assistant/configuration.yaml`,
`tests/ha-smoke/home-assistant/ui-lovelace.yaml`, and
`dist/xiaomi-vacuum-card.js` into `.ha-smoke` and its Home Assistant
`www/community/lovelace-xiaomi-vacuum-card` resource directory.

PowerShell example for the pinned baseline setup (Home Assistant 2026.6.1):

```powershell
Remove-Item -Recurse -Force ".ha-smoke" -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path ".ha-smoke\www\community\lovelace-xiaomi-vacuum-card"
Copy-Item -Recurse "tests\ha-smoke\home-assistant\*" ".ha-smoke\"
Copy-Item "dist\xiaomi-vacuum-card.js" ".ha-smoke\www\community\lovelace-xiaomi-vacuum-card\xiaomi-vacuum-card.js"
$smokeExitCode = 0
try {
  docker run -d --name xiaomi-vacuum-card-ha-smoke -p 8123:8123 -v "${PWD}\.ha-smoke:/config" ghcr.io/home-assistant/home-assistant@sha256:59aa8824955c9db491b75d2eebe42bd68494f80c2ec69ec0d66d9dae37d37514
  if ($LASTEXITCODE -ne 0) { throw "Failed to start Home Assistant container" }
  npx playwright install chromium
  if ($LASTEXITCODE -ne 0) { throw "Failed to install Playwright browser binaries" }
  npm run test:ha-smoke
  $smokeExitCode = $LASTEXITCODE
} finally {
  docker rm -f xiaomi-vacuum-card-ha-smoke
  if ($smokeExitCode -ne 0) { exit $smokeExitCode }
}
```

The Playwright spec waits for Home Assistant readiness, completes onboarding when
needed, opens the smoke dashboard, and verifies the card with the demo vacuum
entity `vacuum.demo_vacuum_0_ground_floor`.

### Interim smoke rule

Before the reproducible-smoke backlog item was complete, the required CI smoke
check ran against the moving `:stable` tag and pull requests recorded the resolved
image identifier.

### Target smoke rule

The required CI smoke check enforces the immutable digest baseline:

```text
ghcr.io/home-assistant/home-assistant@sha256:<digest>
```

The current baseline uses Home Assistant 2026.6.1 (`@sha256:59aa8824955c9db491b75d2eebe42bd68494f80c2ec69ec0d66d9dae37d37514`).
Repository validation rejects tag-only references for the required smoke job,
and moving channels (`stable`, `beta`, `dev`) run separately as scheduled or
manual non-blocking canaries in `.github/workflows/ha-canary.yml`.

## Test Data And Compatibility Fixtures

Current tests contain several inline state maps. New integration-shaped test data
should not proliferate as unrelated one-off mocks.

A shared sanitized fixture schema is planned for vacuum state, related entities,
feature flags, registry metadata, expected presentation, and service contracts.
The schema will include an explicit integer `schema_version`; loaders will reject
unknown future versions before passing fixture data to Node, browser, or Home
Assistant consumers.

Until that schema is merged:

- keep synthetic data minimal and clearly named;
- distinguish verified integration evidence from assumptions;
- remove credentials, tokens, coordinates, serial numbers, and private images;
- link compatibility behavior to the relevant backlog issue;
- avoid claiming support for a whole vendor from one model-shaped mock.

## Optional MCP DevTools Manual Check

For manual browser validation with MCP DevTools:

- Start the Home Assistant smoke container or another disposable Home Assistant
  instance using the card resource.
- Open the smoke dashboard and verify `xiaomi-vacuum-card` is registered and
  visible.
- Check the browser console for uncaught errors, failed module loads, and missing
  custom element dependencies.
- Exercise UI-sensitive paths such as fan speed selection, card editor form
  fields, visibility toggles, and image/media-source configuration.
- Confirm the card uses the expected demo vacuum entity or a known test vacuum
  entity before recording findings.

Manual verification supplements automated evidence and does not replace a
regression test at the layer capable of observing the changed behavior.
