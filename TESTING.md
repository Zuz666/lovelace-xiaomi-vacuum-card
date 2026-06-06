# Testing

This project ships a direct browser resource for Home Assistant. Prefer the
fastest check that proves the change, then run the full local check before a
pull request.

## Quick Syntax Check

Run this after editing the distributed card file:

```sh
node --check dist/xiaomi-vacuum-card.js
```

This catches JavaScript syntax errors without starting Home Assistant.

## Full Local Check

Install dependencies once per checkout:

```sh
npm install
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
service-call, and source-level behavior that does not require a real browser.

## Home Assistant Smoke Test

Use the smoke test for UI-sensitive changes, browser loading, Home Assistant
resource wiring, and integration checks that the VM harness cannot cover.

The setup copies config/ui-lovelace/dist into `.ha-smoke`: the smoke Home
Assistant config, the Lovelace dashboard, and the built card resource.

PowerShell example:

```powershell
Remove-Item -Recurse -Force ".ha-smoke" -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path ".ha-smoke\www\community\lovelace-xiaomi-vacuum-card"
Copy-Item -Recurse "tests\ha-smoke\home-assistant\*" ".ha-smoke\"
Copy-Item "dist\xiaomi-vacuum-card.js" ".ha-smoke\www\community\lovelace-xiaomi-vacuum-card\xiaomi-vacuum-card.js"
docker run --rm -d --name xiaomi-vacuum-card-ha-smoke -p 8123:8123 -v "${PWD}\.ha-smoke:/config" ghcr.io/home-assistant/home-assistant:stable
npm run test:ha-smoke
docker stop xiaomi-vacuum-card-ha-smoke
```

The Playwright spec waits for Home Assistant readiness, completes onboarding when
needed, opens the smoke dashboard, and verifies the card with the demo vacuum
entity `vacuum.demo_vacuum_0_ground_floor`.

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
