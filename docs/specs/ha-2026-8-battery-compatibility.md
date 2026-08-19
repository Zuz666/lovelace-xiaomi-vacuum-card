# Specification: Home Assistant 2026.8+ Battery Compatibility

## Context & Core References

In Home Assistant Core 2026.8+ ([home-assistant/core#175682](https://github.com/home-assistant/core/pull/175682), [home-assistant/core#175687](https://github.com/home-assistant/core/pull/175687)), `vacuum` platform entities deprecate and remove the legacy `battery_level` property and `battery_icon` attributes, while dedicated battery diagnostic sensors (`SensorDeviceClass.BATTERY`, [home-assistant/core#179095](https://github.com/home-assistant/core/pull/179095)) are introduced under the entity ID pattern:

- **`sensor.<vacuum_name>_battery`** (for example `sensor.test_vacuum_cleaner_battery`).

The legacy attribute `battery_level` in `vacuum.<vacuum_name>` is not populated in modern HA. Consequently, the default card configuration (which expected `sensor.<vacuum_name>_battery_level` or `vacuum.attributes.battery_level`) would display "Unavailable" unless updated.

Note on UI components: while older versions of the card previously depended on `mwc-menu` / `mwc-list-item`, the modern card uses a dependency-free custom ARIA combobox (`button`/`listbox` pattern) for fan speed selection rather than a native `<select>` element.

The card must resolve battery state accurately across modern sensor entities, explicit overrides, and legacy attributes without breaking existing configurations.

## Requirements

### 1. Registry Adapter & Battery Attribute Resolution Precedence

The card uses an internal adapter snapshot (`getRegistrySnapshot(hass)`) returning `{ states, entities, devices }`.

If `hass.entities`, the configured vacuum registry entry, or its `device_id` is unavailable, the card skips same-device discovery and gracefully continues through name-based and legacy fallbacks in subsequent rules. Missing `hass.devices` alone is non-blocking and does not prevent resolution through available sources.

When rendering a battery row (`id: 'battery'` or `key: 'battery'` / `key: 'battery_level'`):

1. **Explicit entity**: `data.entity` if configured and present in `hass.states`. If configured but absent in `states`, fall through to subsequent sources.
2. **Same-device sensor**: eligible `sensor.*` entity attached to the same Home Assistant device as the configured vacuum (`device_class: battery`, `disabled_by: null`, `hidden_by: null`, not `hidden: true`, present in `states`).
3. **Modern sensor entity**: `sensor.${vacuum_object_id}_battery`.
4. **Legacy sensor entity**: `sensor.${vacuum_object_id}_battery_level`.
5. **Vacuum attribute `battery_level`**: `vacuumState.attributes.battery_level`.
6. **Vacuum attribute `battery`**: `vacuumState.attributes.battery`.
7. **Generic vacuum property fallback**: `vacuumState[data.key]`.

If any source exists, including valid `0` or empty string values, use it. If no source is found, return `null` (displayed as localized "Unavailable").

Selected entities in `unavailable` or `unknown` state remain selected and render localized "Unavailable" / "Unknown" without demoting to lower-priority fallbacks.

When multiple candidates exist on the same device at the same precedence level, platform matching the vacuum entity's platform is preferred, ties are sorted alphabetically by `entity_id`, and a sanitized diagnostic warning is logged once per candidate set.

For non-battery rows, the resolution order remains:

1. Explicit `data.entity`.
2. `${sensorEntity}_${data.key}`.
3. `vacuumState.attributes[data.key]`.
4. `vacuumState[data.key]`.

### 2. Battery Icon & Charging State Precedence

Charging detection sources (in precedence order):

1. **Eligible same-device charging binary sensor**: `binary_sensor.*` entity attached to the same device as the vacuum, with `device_class: battery_charging`, `disabled_by: null`, `hidden_by: null`, display `hidden !== true`, and active state object in `hass.states`. Active charging is indicated when state is `'on'`. When multiple charging candidates exist, candidates matching the vacuum platform are preferred and ties are broken alphabetically by `entity_id`.
2. **Legacy vacuum charging attributes**: `vacuumState.attributes.charging === true` or `vacuumState.attributes.is_charging === true` when a same-device binary sensor candidate is absent.

When rendering battery row icons:

1. **Sensor icon**: icon from the resolved external sensor entity state, if present.
2. **Deterministic numeric icon**: mapped from numeric battery value (`0..100` rounded to nearest 10). If active charging is detected via the charging sources above, charging icons are rendered:
   - Charging: `0` -> `mdi:battery-charging-outline`, `10..90` -> `mdi:battery-charging-10`..`90`, `100` -> `mdi:battery-charging-100`.
   - Not charging: `0` -> `mdi:battery-outline`, `10..90` -> `mdi:battery-10`..`90`, `100` -> `mdi:battery`.
3. **Legacy attribute icon**: `vacuumState.attributes.battery_icon`.
4. **Configured fallback icon**: `data.icon` or default fallback.

### 3. Editor Behavior

In `XiaomiVacuumCardEditor.entityDataRowSchema(row)`:

- For battery rows, always show the icon selector.
- Constrain entity selector to `{ domain: 'sensor', device_class: 'battery' }`.
- Do not auto-populate or save derived sensor entities into configuration YAML unless explicitly chosen by the user.

## Verification

1. Unit contract tests in `tests/card-attributes.test.mjs` and `tests/card-device-registry.test.mjs` verifying the entire precedence matrix, device-registry candidate discovery, `0%` handling, unavailable/unknown stability, numeric and charging icon mapping, and editor schemas.
2. Playwright browser component tests in `tests/component/device-aware-battery.spec.mjs` validating renamed sensor discovery, dynamic charging binary sensor reactivity, and registry map invalidation.
3. HA smoke test fixture in `tests/ha-smoke/xiaomi-vacuum-card.spec.mjs` asserting frontend registry snapshot contract and rendered battery percentage.
