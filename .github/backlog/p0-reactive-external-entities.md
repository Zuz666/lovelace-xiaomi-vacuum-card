<!-- markdownlint-disable MD034 -->

## Problem

The card can read explicitly configured external entities and auto-discovered battery sensors, but the render lifecycle is primarily driven by the main `vacuum.*` state object. When a referenced `sensor.*`, `binary_sensor.*`, image entity, or future `select.*` changes without changing the vacuum entity object, the displayed value can remain stale.

The current implementation declares `_hass` as a reactive property but `shouldUpdate()` does not treat `_hass` as a reason to render. Assigning the same `stateObj` reference therefore does not guarantee an update for external dependencies.

The existing VM harness cannot prove the browser behavior because it uses a fake `LitElement` whose `requestUpdate()` method is a no-op. This issue therefore depends on the real Lit browser component-test layer.

## Evidence and upstream references

- Upstream issue(s): https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/118, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/124
- Upstream pull request(s): https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/126
- Home Assistant change or documentation: https://developers.home-assistant.io/blog/2025/07/02/vacuum-battery-properties-deprecated/
- Current fork behavior: `resolveAttributeSource()` reads external entities, while `shouldUpdate()` does not track those entity dependencies.
- Reproduction, fixture, or diagnostic evidence: configure a row with `entity: sensor.external_value`, change only that sensor, and observe whether the rendered row updates without a vacuum state change.

## Scope

- Introduce explicit dependency tracking for every Home Assistant entity referenced by the rendered card configuration.
- Include explicit row entities, auto-discovered battery and charging entities, and image entities.
- Re-render when a tracked entity state object changes.
- Avoid re-rendering for unrelated Home Assistant state changes.
- Reproduce and verify the behavior in the real browser component harness.
- Add a targeted Home Assistant smoke scenario only where it proves integration behavior not covered by the component layer.

## Non-goals

- Designing the complete future entity-aware row configuration model.
- Adding external `select.*` controls.
- Adding vendor-specific entity discovery beyond dependencies already resolved by the card.
- Replacing Lit or introducing a framework-level state manager.
- Expanding the fake VM harness to emulate Lit lifecycle behavior.

## Proposed behavior

The card maintains a deterministic set of entity IDs used by the current configuration. On each `hass` assignment, it compares the previous and next state objects for those dependencies and requests an update only when a dependency was added, removed, or changed.

Changing an unrelated entity must not re-render the card. Changing a referenced entity must update the card even when the main vacuum object is unchanged.

## Acceptance criteria

- [x] A row backed by an explicit external `sensor.*` updates without a vacuum state change.
- [x] A row backed by an explicit `binary_sensor.*` updates without a vacuum state change.
- [x] An auto-discovered battery entity update refreshes the battery value and icon.
- [x] A referenced image entity update refreshes the image URL when applicable.
- [x] Removing or making a referenced entity unavailable refreshes the displayed unavailable state.
- [x] Unrelated Home Assistant entity changes do not trigger a card render.
- [x] The regression is asserted against visible real-browser DOM, not only direct method results.
- [x] Existing supported YAML remains compatible.

## Test plan

- [x] Real browser component test reproducing the stale external sensor before the fix
- [x] Component test for explicit `binary_sensor.*` updates
- [x] Component test for auto-discovered dependency changes
- [x] Component test for removed or unavailable dependencies
- [x] Render-count or equivalent test proving unrelated state changes do not trigger an update
- [x] Targeted HA smoke scenario if registry or full frontend behavior is required
- [x] Existing contract, lint, formatting, component, and smoke suites pass

## Compatibility and migration

- Minimum or targeted Home Assistant version: all currently supported versions
- Existing configuration impact: none
- Deprecations: none
- Breaking change: No

## Dependencies

- Blocked by: {{issue:p0-real-lit-component-tests}}
- Blocks: {{issue:p0-device-aware-battery}}; external entity controls
- Related epics: {{issue:epic-modern-ha-entities}} and {{issue:epic-testing-architecture}}

## Release impact

- Target milestone: v4.6.3 — Runtime correctness
- Changelog entry required: Yes
- Documentation update required: Only if dependency behavior or limitations require explanation
- HACS or release asset impact: canonical `dist/xiaomi-vacuum-card.js` changes; asset name remains unchanged
