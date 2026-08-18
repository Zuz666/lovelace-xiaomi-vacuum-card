## Problem

The fast Node test harness executes `dist/xiaomi-vacuum-card.js` in a VM with a fake `LitElement`. Its `requestUpdate()` method is a no-op, and it does not provide real reactive properties, rendered DOM, Shadow DOM, focus, keyboard behavior, event propagation, or an accessibility tree.

This means a defect can pass all fast tests even when the card does not update in the browser. The identified stale external-entity risk is a concrete example: direct resolver tests can pass while the real Lit update lifecycle suppresses the render.

## Evidence and upstream references

- Current test harness: [`tests/helpers/card-harness.mjs`](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/blob/main/tests/helpers/card-harness.mjs)
- Current HA smoke test: [`tests/ha-smoke/xiaomi-vacuum-card.spec.mjs`](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/blob/main/tests/ha-smoke/xiaomi-vacuum-card.spec.mjs)
- Maintainer review: [`docs/maintainers/testing-strategy.md`](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/blob/main/docs/maintainers/testing-strategy.md)
- Current fork behavior: fast tests manually call card methods and inspect fake template objects; only the full HA smoke test runs in a real browser.
- Reproduction evidence: changing a referenced external entity without replacing the main vacuum state object can leave the rendered value stale.

## Scope

- Add a fast Playwright browser component-test layer separate from the full Home Assistant smoke environment.
- Load the shipped `dist/xiaomi-vacuum-card.js`, or the exact artifact produced by the future build, with a real Lit runtime and real custom elements.
- Mount the card in a real DOM and wait for Lit update completion.
- Provide a deterministic public-card-style `hass` stub with controllable states, localization, service calls, WebSocket calls, and subscriptions.
- Support replacing individual state objects and assigning updated `hass` values.
- Record render or update counts where necessary to detect unrelated updates.
- Add helpers for querying the card Shadow DOM and interacting by role, label, and accessible name.
- Add `npm run test:component` and a required CI job or step.
- Document which tests belong in the VM harness and which require the real component layer.

## Non-goals

- Starting a full Home Assistant container for component tests.
- Reimplementing private Home Assistant frontend components.
- Replacing pure configuration, formatter, payload, and error-path tests that are already effective in Node.
- Introducing a broad visual snapshot suite.
- Completing the external-entity runtime fix in this issue.

## Proposed behavior

A component test creates an actual `xiaomi-vacuum-card` element, configures it, assigns a deterministic `hass` object, appends it to a browser document, and waits for `updateComplete` or the equivalent observable render completion.

The test can then replace only a referenced external entity state, assign the next `hass` object, and assert against visible DOM text and icons. It can also verify that an unrelated entity change does not cause an unnecessary render.

The harness should use public inputs expected by a Lovelace card and remain independent from Home Assistant's private element implementations. Tests should prefer user-visible DOM and accessibility assertions over the fake template `strings` and `values` representation.

## Acceptance criteria

- [ ] `npm run test:component` runs real-browser component tests without starting Home Assistant.
- [ ] The shipped card element mounts with an actual Lit reactive lifecycle and Shadow DOM.
- [ ] Tests can assign initial and updated Home Assistant state maps deterministically.
- [ ] Tests can inspect visible text, icons, roles, labels, disabled state, and focus.
- [ ] The component harness can express the stale external-entity regression scenario; the regression test is capable of demonstrating the defect and becomes a required passing test when issue {{issue:p0-reactive-external-entities}} delivers the runtime fix.
- [ ] A regression test detects unnecessary rendering when only an unrelated entity changes.
- [ ] At least one ARIA combobox keyboard and focus scenario executes against real DOM.
- [ ] Service and WebSocket calls can be asserted without a real Home Assistant backend.
- [ ] Existing VM tests remain available for fast pure-contract coverage.
- [ ] Existing supported YAML remains compatible.
- [ ] Contributor testing documentation explains the new layer.

## Test plan

- [ ] Component harness self-test for card registration and mounting
- [ ] External entity update and unavailable transition tests
- [ ] Unrelated state update and render-count test
- [ ] ARIA combobox open, navigation, selection, escape, and focus test
- [ ] Service-call recording test
- [ ] Run existing Node tests unchanged or with only intentional helper migration
- [ ] Run the pinned Home Assistant smoke test as an independent integration check

## Compatibility and migration

- Minimum or targeted Home Assistant version: not applicable to the minimal component harness; public card input contracts should match currently supported HA versions
- Existing configuration impact: none
- Deprecations: none
- Breaking change: No

## Dependencies

- Blocked by: none
- Blocks: {{issue:p0-reactive-external-entities}}; external `select.*` controls; interaction-heavy Lovelace action work
- Related epic: {{issue:epic-testing-architecture}}

## Release impact

- Target milestone: v4.6.3 — Runtime correctness
- Changelog entry required: No, unless user-visible behavior is changed in the same pull request
- Documentation update required: Yes
- HACS or release asset impact: none; tests must continue to exercise the canonical shipped asset
