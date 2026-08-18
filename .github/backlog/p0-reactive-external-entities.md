## Problem

The card can read explicitly configured external entities and auto-discovered battery sensors, but the render lifecycle is primarily driven by the main `vacuum.*` state object. When a referenced `sensor.*`, `binary_sensor.*`, image entity, or future `select.*` changes without changing the vacuum entity object, the displayed value can remain stale.

The current implementation declares `_hass` as a reactive property but `shouldUpdate()` does not treat `_hass` as a reason to render. Assigning the same `stateObj` reference therefore does not guarantee an update for external dependencies.

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
- Add lifecycle regression coverage in the card harness and Home Assistant smoke test where appropriate.

## Non-goals

- Designing the complete future entity-aware row configuration model.
- Adding external `select.*` controls.
- Adding vendor-specific entity discovery beyond dependencies already resolved by the card.
- Replacing Lit or introducing a framework-level state manager.

## Proposed behavior

The card maintains a deterministic set of entity IDs used by the current configuration. On each `hass` assignment, it compares the previous and next state objects for those dependencies and requests an update only when a dependency was added, removed, or changed.

Changing an unrelated entity must not re-render the card. Changing a referenced entity must update the card even when the main vacuum object is unchanged.

## Acceptance criteria

- [ ] A row backed by an explicit external `sensor.*` updates without a vacuum state change.
- [ ] A row backed by an explicit `binary_sensor.*` updates without a vacuum state change.
- [ ] An auto-discovered battery entity update refreshes the battery value and icon.
- [ ] A referenced image entity update refreshes the image URL when applicable.
- [ ] Removing or making a referenced entity unavailable refreshes the displayed unavailable state.
- [ ] Unrelated Home Assistant entity changes do not trigger a card render.
- [ ] Existing supported YAML remains compatible.

## Test plan

- [ ] Card-harness tests for explicit external entity changes
- [ ] Card-harness tests for auto-discovered dependency changes
- [ ] Test for unrelated state changes not triggering a render
- [ ] Home Assistant smoke test covering at least one external entity update
- [ ] Existing unit, lint, formatting, and smoke suites pass

## Compatibility and migration

- Minimum or targeted Home Assistant version: all currently supported versions
- Existing configuration impact: none
- Deprecations: none
- Breaking change: No

## Dependencies

- Blocked by: none
- Blocks: device-aware battery and charging entity discovery; external entity controls
- Related epic: {{issue:epic-modern-ha-entities}}

## Release impact

- Target milestone: v4.6.3 — Runtime correctness
- Changelog entry required: Yes
- Documentation update required: Only if dependency behavior or limitations require explanation
- HACS or release asset impact: canonical `dist/xiaomi-vacuum-card.js` changes; asset name remains unchanged
