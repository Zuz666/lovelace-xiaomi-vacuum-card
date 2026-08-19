<!-- markdownlint-disable MD034 -->

## Problem

The fork already supports explicit battery entities and name-based fallbacks such as `sensor.<vacuum_object_id>_battery`, but Home Assistant entity IDs are user-editable and are not a stable relationship key. A renamed battery sensor attached to the same Home Assistant device can therefore be missed even though its `device_class` identifies it correctly.

Modern vacuum integrations may also expose charging state as a separate `binary_sensor` with `device_class: battery_charging`. Home Assistant deprecated the vacuum entity properties `battery_level` and `battery_icon` in Core 2025.8 and removed them in Core 2026.8. Device-aware discovery is therefore the primary modern path; legacy vacuum attributes are compatibility fallbacks only for older supported Core versions or integrations that still expose them.

## Evidence and upstream references

- Upstream issue(s): https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/84, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/92, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/124
- Upstream pull request(s): https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/126
- Home Assistant change or documentation: https://developers.home-assistant.io/blog/2025/07/02/vacuum-battery-properties-deprecated/, https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/, and https://github.com/home-assistant/frontend/blob/dev/src/types.ts
- Current fork behavior: explicit entity, modern name, legacy name, and vacuum attribute fallbacks are supported; same-device registry discovery is not.
- Reproduction, fixture, or diagnostic evidence: rename the generated battery sensor while keeping it attached to the same device; name-based discovery no longer finds it.

## Scope

- Discover battery entities attached to the same Home Assistant device as the configured vacuum.
- Consume registry data through a documented adapter over the normal Home Assistant object assigned to a Lovelace custom card.
- Prefer eligible `sensor` entities with `device_class: battery`, matching Home Assistant frontend conventions.
- Discover an optional eligible same-device `binary_sensor` with `device_class: battery_charging`.
- Preserve explicit configuration as the highest precedence.
- Preserve name-based and legacy attribute fallbacks for compatibility.
- Integrate discovered entities and registry inputs with the reactive dependency tracker.
- Add deterministic tests for renamed, missing, unavailable, ambiguous, disabled, hidden, and registry-unavailable candidates.
- Add a production-shaped registry fixture and targeted Home Assistant smoke coverage for the real frontend registry boundary.

## Non-goals

- Generic discovery of every related entity type.
- Automatically enabling disabled entity-registry entries.
- Guessing battery entities from friendly names or vendor-specific strings.
- Importing private Home Assistant frontend decorators or components into the direct browser resource.
- Maintaining a separate WebSocket registry subscription or private registry cache.
- Removing legacy fallbacks in this release.

## Proposed behavior

### Home Assistant registry input contract

The card continues to receive the normal `hass` object through its public Lovelace custom-card setter. In the current Home Assistant frontend type contract, that object includes `states`, `entities`, and `devices`; the latter two contain entity-registry display entries and device-registry entries.

Implementation must introduce a small internal adapter, conceptually `getRegistrySnapshot(hass)`, rather than reading registry fields throughout rendering code. The adapter returns:

```js
{
  states: hass.states,
  entities: hass.entities ?? null,
  devices: hass.devices ?? null,
}
```

The adapter contract is deliberately optional for registry maps:

- current supported frontends provide `hass.entities` and `hass.devices` through the normal `hass` assignment;
- an older supported frontend, minimal test host, or temporarily incomplete object may omit either map;
- missing registry maps must produce an explicit `null` adapter value and activate documented name-based and legacy fallbacks rather than a private API call;
- the card must not import Home Assistant's private context decorators, request registry contexts directly from internal elements, or call `config/entity_registry/list` in this P0 issue;
- a future architecture may consume fine-grained frontend contexts behind the same adapter, but that is a separate reviewed change.

The production browser component fixture must model the current `HomeAssistant` shape with `states`, `entities`, and optional `devices`. The full Home Assistant smoke test must read the actual `hass` object assigned to the mounted card and verify that the adapter can consume the real frontend registry maps and configured vacuum registry entry. Deterministic same-device candidate ordering remains fixture-driven when the smoke integration cannot reliably manufacture a specific device relationship.

### Registry access and refresh contract

1. Obtain `states`, `entities`, and `devices` through the adapter above.
2. Read the configured vacuum entry from `entities[config.entity]` when `entities` is available.
3. If the entry has a `device_id`, filter `Object.values(entities)` to entries with the same `device_id`.
4. Evaluate registry metadata and runtime state as separate eligibility checks:
   - the entity domain must be the expected `sensor` or `binary_sensor` domain;
   - when a full registry entry exposes `disabled_by`, it must be `null`;
   - when a full registry entry exposes `hidden_by`, it must be `null`; when the frontend display map exposes only `hidden`, it must not be `true`;
   - a current state object must exist at `states[entity_id]`;
   - `states[entity_id].attributes.device_class` must be exactly `battery` for a `sensor` or `battery_charging` for a `binary_sensor`.
5. Do not treat state presence as proof that `disabled_by` is `null`. State presence is an independent runtime-discoverability requirement. When the public frontend display map omits full `disabled_by` or `hidden_by` fields, use the available display metadata plus the required live state object without inventing missing registry values.
6. Use `devices` to validate or diagnose the referenced device when available, but do not fail only because the device map is absent.
7. Recompute registry candidates when the configured vacuum changes, the `entities` map reference changes, or the relevant adapter contract changes. Resolve candidate availability and device class from current `states` on each relevant update. Any memoization must be keyed by these inputs and must not outlive them.
8. If `entities`, the vacuum registry entry, or its `device_id` is unavailable, skip same-device discovery and continue through name-based and legacy fallbacks without failing the card.

### Candidate selection and diagnostics

For candidates at the same precedence level:

1. prefer an entity whose registry `platform` matches the vacuum entry's platform;
2. then sort by `entity_id` for deterministic selection;
3. when more than one valid candidate remains, select deterministically and emit one sanitized warning per candidate-set signature that lists entity IDs and recommends explicit configuration.

Diagnostics must not include state values, tokens, device identifiers beyond the non-secret entity IDs already visible in Home Assistant, or any private registry payload.

### Source precedence

Battery source precedence:

1. explicit configured battery entity;
2. same-device eligible `sensor` with `device_class: battery`;
3. `sensor.<vacuum_object_id>_battery`;
4. `sensor.<vacuum_object_id>_battery_level`;
5. legacy vacuum `battery_level` attribute;
6. legacy vacuum `battery` attribute.

Charging source precedence:

1. explicit future charging entity configuration, if introduced by the design;
2. same-device eligible `binary_sensor` with `device_class: battery_charging`;
3. legacy battery icon or charging metadata fallback on older entity shapes.

Source precedence selects an entity identity or legacy attribute source. The current value of a selected source does not reorder that precedence.

### Unavailable and unknown state policy

An explicit or automatically selected entity that still exists and remains structurally eligible stays selected when its state becomes `unavailable` or `unknown`. The card displays the localized unavailable state and must not demote the source to a lower-priority name-based or legacy attribute fallback.

Fallback continues only when the higher-priority source is absent or no longer structurally eligible, for example because the entity was removed, disabled, hidden, moved to another device, changed domain, or no longer has the required `device_class`. This prevents transient state changes from making the displayed battery source flap between modern and legacy contracts.

## Acceptance criteria

- [x] A documented adapter consumes registry maps from the normal custom-card `hass` object without private frontend imports or an extra WebSocket registry subscription.
- [x] A renamed battery sensor attached to the vacuum device is discovered automatically.
- [x] An explicit configured battery entity overrides all automatic candidates.
- [x] A same-device battery sensor overrides object-ID naming fallbacks.
- [x] Legacy name and vacuum attribute fallbacks remain functional for older supported entity shapes.
- [x] A same-device charging binary sensor influences the rendered battery icon or charging presentation.
- [x] Missing `hass.entities` or `hass.devices` degrades to existing fallbacks without a failed render or extra private API dependency.
- [x] A full registry entry with non-null `disabled_by` or `hidden_by` is excluded; a display entry with `hidden: true` is excluded.
- [x] Runtime state presence and `attributes.device_class` are checked independently from registry enabled or hidden metadata.
- [x] Missing or structurally ineligible entities fall through safely to the next source.
- [x] A selected entity in `unavailable` or `unknown` state remains selected and renders unavailable instead of switching to a lower-priority fallback.
- [x] Multiple candidate selection follows the documented platform and `entity_id` ordering and emits a sanitized diagnostic.
- [x] Registry-map replacement invalidates candidate discovery.
- [x] Battery and charging state updates refresh the card through tracked dependencies.
- [x] A real Home Assistant smoke scenario verifies the actual frontend registry-map boundary consumed by the adapter.

## Test plan

- [x] Production-shaped component fixture with `states`, `entities`, and `devices`
- [x] Shared entity-registry fixture for a renamed same-device battery sensor
- [x] Fixture for a same-device charging binary sensor
- [x] Fixture with full registry entries covering `disabled_by` and `hidden_by`
- [x] Fixture with display-map entries that expose `hidden` but omit full registry fields
- [x] Fixture with no frontend registry maps, proving fallback behavior
- [x] Source-precedence unit tests
- [x] Registry refresh and memoization invalidation tests
- [x] Ambiguous candidate, platform preference, diagnostic, and unavailable-state tests
- [x] Test that `unavailable` and `unknown` selected entities do not demote to name or legacy fallbacks
- [x] Test that removed, disabled, hidden, wrong-domain, and wrong-device-class entities do fall through
- [x] Backward-compatibility tests for current naming and legacy attribute fallbacks
- [x] Real browser component tests for battery, charging, and registry-map replacement updates
- [x] Home Assistant smoke assertion against the actual `hass.entities` and `hass.devices` contract assigned to the mounted card

## Compatibility and migration

- Minimum or targeted Home Assistant version: current maintained versions expose frontend entity and device registry maps; older supported versions or minimal hosts without those maps use existing name and attribute fallbacks
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
- Documentation update required: Yes, document the registry adapter, source precedence, unavailable-state stability, renamed-entity support, and legacy fallback limits
- HACS or release asset impact: canonical `dist/xiaomi-vacuum-card.js` changes; asset name remains unchanged
