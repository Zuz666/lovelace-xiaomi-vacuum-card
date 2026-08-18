<!-- markdownlint-disable MD034 -->

## Problem

The fork already supports explicit battery entities and name-based fallbacks such as `sensor.<vacuum_object_id>_battery`, but Home Assistant entity IDs are user-editable and are not a stable relationship key. A renamed battery sensor attached to the same Home Assistant device can therefore be missed even though its `device_class` identifies it correctly.

Modern vacuum integrations may also expose charging state as a separate `binary_sensor` with `device_class: battery_charging`. Home Assistant deprecated the vacuum entity properties `battery_level` and `battery_icon` in Core 2025.8 and removed them in Core 2026.8. Device-aware discovery is therefore the primary modern path; legacy vacuum attributes are compatibility fallbacks only for older supported Core versions or integrations that still expose them.

## Evidence and upstream references

- Upstream issue(s): https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/84, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/92, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/124
- Upstream pull request(s): https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/126
- Home Assistant change or documentation: https://developers.home-assistant.io/blog/2025/07/02/vacuum-battery-properties-deprecated/ and Home Assistant frontend entity-registry battery discovery
- Current fork behavior: explicit entity, modern name, legacy name, and vacuum attribute fallbacks are supported; same-device registry discovery is not.
- Reproduction, fixture, or diagnostic evidence: rename the generated battery sensor while keeping it attached to the same device; name-based discovery no longer finds it.

## Scope

- Discover battery entities attached to the same Home Assistant device as the configured vacuum.
- Use the entity and device registry maps supplied on the Home Assistant frontend object as the registry source.
- Prefer enabled `sensor` entities with `device_class: battery`, matching Home Assistant frontend conventions.
- Discover an optional enabled same-device `binary_sensor` with `device_class: battery_charging`.
- Preserve explicit configuration as the highest precedence.
- Preserve name-based and legacy attribute fallbacks for compatibility.
- Integrate discovered entities with the reactive dependency tracker.
- Add deterministic tests for renamed, missing, unavailable, ambiguous, and registry-unavailable candidates.

## Non-goals

- Generic discovery of every related entity type.
- Automatically enabling disabled entity-registry entries.
- Guessing battery entities from friendly names or vendor-specific strings.
- Maintaining a separate WebSocket registry subscription or private registry cache.
- Removing legacy fallbacks in this release.

## Proposed behavior

### Registry access and refresh contract

1. Read the configured vacuum entry from `hass.entities[config.entity]`.
2. If the entry has a `device_id`, filter `Object.values(hass.entities)` to entries with the same `device_id`.
3. Consider an entry automatically discoverable only when:
   - its domain is the expected `sensor` or `binary_sensor` domain;
   - it is not marked hidden;
   - a current state object exists in `hass.states`, which excludes disabled entries that have no runtime entity;
   - the current state object's `device_class` is exactly `battery` or `battery_charging`.
4. Use `hass.devices` to validate or diagnose the referenced device when available, but do not fail only because the display device map is absent.
5. Do not call `config/entity_registry/list` or maintain an independent registry subscription in this issue. Current frontend registry maps are refreshed as part of the `hass` lifecycle.
6. Recompute registry candidates when the configured vacuum changes or the `hass.entities` registry-map reference changes. Resolve candidate availability and device class from the current `hass.states` on each relevant update. Any memoization must be keyed by these inputs and must not outlive them.
7. If `hass.entities`, the vacuum registry entry, or its `device_id` is unavailable on an older supported frontend, skip same-device discovery and continue through name-based and legacy fallbacks without failing the card.

### Candidate selection and diagnostics

For candidates at the same precedence level:

1. prefer an entity whose registry `platform` matches the vacuum entry's platform;
2. then sort by `entity_id` for deterministic selection;
3. when more than one valid candidate remains, select deterministically and emit one sanitized warning per candidate-set signature that lists entity IDs and recommends explicit configuration.

Diagnostics must not include state values, tokens, device identifiers beyond the non-secret entity IDs already visible in Home Assistant, or any private registry payload.

### Source precedence

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
3. legacy battery icon or charging metadata fallback on older entity shapes.

## Acceptance criteria

- [ ] A renamed battery sensor attached to the vacuum device is discovered automatically.
- [ ] An explicit configured battery entity overrides all automatic candidates.
- [ ] A same-device battery sensor overrides object-ID naming fallbacks.
- [ ] Legacy name and vacuum attribute fallbacks remain functional for older supported entity shapes.
- [ ] A same-device charging binary sensor influences the rendered battery icon or charging presentation.
- [ ] Registry data absent from the frontend object degrades to existing fallbacks without a failed render or extra private API dependency.
- [ ] Hidden, disabled, missing, unknown, and unavailable entities are handled safely.
- [ ] Multiple candidate selection follows the documented platform and `entity_id` ordering and emits a sanitized diagnostic.
- [ ] Registry-map replacement invalidates candidate discovery.
- [ ] Battery and charging state updates refresh the card through tracked dependencies.

## Test plan

- [ ] Shared entity-registry fixture for a renamed same-device battery sensor
- [ ] Fixture for a same-device charging binary sensor
- [ ] Fixture with no frontend registry maps, proving fallback behavior
- [ ] Source-precedence unit tests
- [ ] Registry refresh and memoization invalidation tests
- [ ] Ambiguous candidate, platform preference, diagnostic, and unavailable-state tests
- [ ] Backward-compatibility tests for current naming and legacy attribute fallbacks
- [ ] Real browser component tests for battery and charging updates
- [ ] Home Assistant smoke test using modern diagnostic entities where feasible

## Compatibility and migration

- Minimum or targeted Home Assistant version: current maintained versions expose frontend entity and device registry maps; older supported versions without those maps use existing name and attribute fallbacks
- Existing configuration impact: explicit and legacy configurations remain valid
- Deprecations: Home Assistant deprecated vacuum `battery_level` and `battery_icon` in Core 2025.8 and removed them in Core 2026.8; the card keeps read-only legacy fallbacks only for older supported entity shapes and does not reintroduce those properties
- Breaking change: No

## Dependencies

- Blocked by: {{issue:p0-reactive-external-entities}}
- Blocks: generic same-device entity discovery in the visual editor
- Related epics: {{issue:epic-modern-ha-entities}} and {{issue:epic-testing-architecture}}

## Release impact

- Target milestone: v4.6.3 — Runtime correctness
- Changelog entry required: Yes
- Documentation update required: Yes, document registry access, source precedence, renamed-entity support, and legacy fallback limits
- HACS or release asset impact: canonical `dist/xiaomi-vacuum-card.js` changes; asset name remains unchanged
