<!-- markdownlint-disable MD034 -->

## Problem

The fork already supports explicit battery entities and name-based fallbacks such as `sensor.<vacuum_object_id>_battery`, but Home Assistant entity IDs are user-editable and are not a stable relationship key. A renamed battery sensor attached to the same Home Assistant device can therefore be missed even though its `device_class` identifies it correctly.

Modern vacuum integrations may also expose charging state as a separate `binary_sensor` with `device_class: battery_charging`. Without device-aware discovery, the card can show a generic battery icon or depend on legacy vacuum attributes that are being removed.

## Evidence and upstream references

- Upstream issue(s): https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/84, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/92, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/124
- Upstream pull request(s): https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/126
- Home Assistant change or documentation: https://developers.home-assistant.io/blog/2025/07/02/vacuum-battery-properties-deprecated/ and Home Assistant frontend entity-registry battery discovery
- Current fork behavior: explicit entity, modern name, legacy name, and vacuum attribute fallbacks are supported; same-device registry discovery is not.
- Reproduction, fixture, or diagnostic evidence: rename the generated battery sensor while keeping it attached to the same device; name-based discovery no longer finds it.

## Scope

- Discover battery entities attached to the same Home Assistant device as the configured vacuum.
- Prefer `sensor` entities with `device_class: battery`, matching Home Assistant frontend conventions.
- Discover an optional same-device `binary_sensor` with `device_class: battery_charging`.
- Preserve explicit configuration as the highest precedence.
- Preserve name-based and legacy attribute fallbacks for compatibility.
- Integrate discovered entities with the reactive dependency tracker.
- Add deterministic tests for renamed, missing, unavailable, and ambiguous candidates.

## Non-goals

- Generic discovery of every related entity type.
- Automatically enabling disabled entity-registry entries.
- Guessing battery entities from friendly names or vendor-specific strings.
- Removing legacy fallbacks in this release.

## Proposed behavior

Battery source precedence:

1. explicit configured battery entity;
2. same-device enabled `sensor` with `device_class: battery`;
3. `sensor.<vacuum_object_id>_battery`;
4. `sensor.<vacuum_object_id>_battery_level`;
5. legacy vacuum `battery_level` attribute;
6. legacy vacuum `battery` attribute.

Charging source precedence:

1. explicit future charging entity configuration, if introduced by the design;
2. same-device enabled `binary_sensor` with `device_class: battery_charging`;
3. legacy battery icon or charging metadata fallback.

When multiple same-priority candidates exist, selection must be deterministic and ambiguity should be diagnosable rather than silently vendor-specific.

## Acceptance criteria

- [ ] A renamed battery sensor attached to the vacuum device is discovered automatically.
- [ ] An explicit configured battery entity overrides all automatic candidates.
- [ ] A same-device battery sensor overrides object-ID naming fallbacks.
- [ ] Legacy name and vacuum attribute fallbacks remain functional.
- [ ] A same-device charging binary sensor influences the rendered battery icon or charging presentation.
- [ ] Disabled, missing, unknown, and unavailable entities are handled safely.
- [ ] Multiple candidate selection is deterministic and covered by tests.
- [ ] Battery and charging updates refresh the card through tracked dependencies.

## Test plan

- [ ] Entity-registry fixture for a renamed same-device battery sensor
- [ ] Fixture for a same-device charging binary sensor
- [ ] Source-precedence unit tests
- [ ] Ambiguous candidate and unavailable-state tests
- [ ] Backward-compatibility tests for current naming and attribute fallbacks
- [ ] Home Assistant smoke test using modern diagnostic entities where feasible

## Compatibility and migration

- Minimum or targeted Home Assistant version: versions exposing the frontend entity/device registry data used by the maintained card
- Existing configuration impact: explicit and legacy configurations remain valid
- Deprecations: none in this issue
- Breaking change: No

## Dependencies

- Blocked by: {{issue:p0-reactive-external-entities}}
- Blocks: generic same-device entity discovery in the visual editor
- Related epic: {{issue:epic-modern-ha-entities}}

## Release impact

- Target milestone: v4.6.3 — Runtime correctness
- Changelog entry required: Yes
- Documentation update required: Yes, document source precedence and renamed-entity support
- HACS or release asset impact: canonical `dist/xiaomi-vacuum-card.js` changes; asset name remains unchanged
