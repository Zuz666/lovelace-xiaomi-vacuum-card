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
more fake browser behavior to make a lifecycle-sensitive test pass. Until the
real browser component layer is implemented, use the Home Assistant smoke test
for such changes and record the missing component regression in the issue.

## Browser Component Tests

A fast real-browser component layer is planned in the canonical backlog. It will
load the shipped card with an actual Lit lifecycle and deterministic Home
Assistant stubs, without starting a full HA container.

After it is implemented, use it for:

- reactive `hass` and entity-state updates;
- visible Shadow DOM output;
- focus and keyboard behavior;
- ARIA roles and accessible names;
- unavailable and disabled states;
- interaction and service dispatch;
- render-count regressions.

The planned command is `npm run test:component`; do not document it as available
in pull-request test evidence until the corresponding backlog issue is merged.

## Home Assistant Smoke Test

Use the smoke test for browser loading, Home Assistant resource wiring, editor or
registry integration, service and WebSocket boundaries, and integration checks
that a deterministic component harness cannot cover.

The setup copies `tests/ha-smoke/home-assistant/configuration.yaml`,
`tests/ha-smoke/home-assistant/ui-lovelace.yaml`, and
`dist/xiaomi-vacuum-card.js` into `.ha-smoke` and its Home Assistant
`www/community/lovelace-xiaomi-vacuum-card` resource directory.

PowerShell example:

```powershell
Remove-Item -Recurse -Force ".ha-smoke" -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path ".ha-smoke\www\community\lovelace-xiaomi-vacuum-card"
Copy-Item -Recurse "tests\ha-smoke\home-assistant\*" ".ha-smoke\"
Copy-Item "dist\xiaomi-vacuum-card.js" ".ha-smoke\www\community\lovelace-xiaomi-vacuum-card\xiaomi-vacuum-card.js"
docker run --rm -d --name xiaomi-vacuum-card-ha-smoke -p 8123:8123 -v "${PWD}\.ha-smoke:/config" ghcr.io/home-assistant/home-assistant:stable
npx playwright install chromium
npm run test:ha-smoke
docker stop xiaomi-vacuum-card-ha-smoke
```

The Playwright spec waits for Home Assistant readiness, completes onboarding when
needed, opens the smoke dashboard, and verifies the card with the demo vacuum
entity `vacuum.demo_vacuum_0_ground_floor`.

The current local example and CI use the moving `stable` image. The testing
backlog will replace the required CI baseline with an explicit reviewed HA
version and move changing channels to scheduled or manually dispatched canaries.
Until then, always record the exact image version reported by a failed run.

## Test Data And Compatibility Fixtures

Current tests contain several inline state maps. New integration-shaped test data
should not proliferate as unrelated one-off mocks.

A shared sanitized fixture schema is planned for vacuum state, related entities,
feature flags, registry metadata, expected presentation, and service contracts.
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
