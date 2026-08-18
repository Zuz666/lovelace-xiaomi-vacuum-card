## Outcome

Xiaomi Vacuum Card Reborn renders and controls modern Home Assistant vacuum entities correctly, reacts to every entity it displays, and no longer depends on legacy vacuum attributes or fragile object-ID naming as its primary behavior.

## Why this matters

Home Assistant integrations increasingly expose vacuum state, battery, charging, consumables, and controls as separate entities. The fork already supports external rows and modern battery naming, but stale external values, legacy status lookup, static button presentation, and name-only battery discovery can still produce incorrect UI.

This epic addresses correctness before adding new controls or vendor profiles.

## Scope

- reactive dependency tracking for referenced entities;
- native vacuum activity as the default status source;
- feature- and state-aware default actions;
- device-registry battery and charging discovery;
- regression fixtures for modern and legacy entity shapes;
- backward-compatible behavior for existing YAML.

## Non-goals

- full entity-aware row architecture;
- external `select.*` controls;
- standard Lovelace tap/hold/double-tap actions;
- room or area cleaning UI;
- unverified vendor presets.

## Child issues

- [ ] {{issue:p0-reactive-external-entities}} — update the card when referenced external entities change
- [ ] {{issue:p0-native-vacuum-state-features}} — use native vacuum activity and supported feature flags
- [ ] {{issue:p0-device-aware-battery}} — discover battery and charging entities through the device registry

## Exit criteria

- [ ] All required child issues are completed.
- [ ] The default status and action UI follows the modern Home Assistant vacuum contract.
- [ ] Every displayed external entity is a tracked reactive dependency.
- [ ] Renamed same-device battery entities work without manual YAML.
- [ ] Legacy YAML and documented fallbacks remain covered by tests.
- [ ] Unit and Home Assistant smoke suites pass.
- [ ] README and changelog reflect user-visible behavior.

## Upstream and Home Assistant references

- Upstream issues: https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/78, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/84, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/92, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/118, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/123, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/124
- Home Assistant references: https://developers.home-assistant.io/docs/core/entity/vacuum/ and https://developers.home-assistant.io/blog/2025/07/02/vacuum-battery-properties-deprecated/

## Release plan

- Target milestone: v4.6.3 — Runtime correctness
- Critical path: reactive dependencies → device-aware battery discovery; native activity and features can proceed independently
- Known blockers: none at bootstrap time
