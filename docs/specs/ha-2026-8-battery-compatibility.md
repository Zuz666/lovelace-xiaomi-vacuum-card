# Specification: Home Assistant 2026.8 Battery Compatibility

## Context & Core References

In Home Assistant Core 2026.8 ([home-assistant/core#175682](https://github.com/home-assistant/core/pull/175682), [home-assistant/core#175687](https://github.com/home-assistant/core/pull/175687)), the deprecated `battery_level` property and `battery_icon` attribute were removed from `vacuum` platform entities for standard and vendor integrations (including `xiaomi_miio`, `roomba`, `neato`, etc.).

Under [home-assistant/core#179095](https://github.com/home-assistant/core/pull/179095), dedicated battery diagnostic sensors (`SensorDeviceClass.BATTERY`) were introduced for `xiaomi_miio` under the entity ID pattern:

- **`sensor.<vacuum_name>_battery`** (for example `sensor.test_vacuum_cleaner_battery`).

The legacy attribute `battery_level` in `vacuum.<vacuum_name>` is not populated in modern HA. Consequently, the default card configuration (which expected `sensor.<vacuum_name>_battery_level` or `vacuum.attributes.battery_level`) would display "Unavailable" unless updated.

Note on UI components: while older versions of the card previously depended on `mwc-menu` / `mwc-list-item`, the modern card uses a dependency-free custom ARIA combobox (`button`/`listbox` pattern) for fan speed selection rather than a native `<select>` element.

The card must resolve battery state accurately across modern sensor entities, explicit overrides, and legacy attributes without breaking existing configurations.

## Requirements

### 1. Registry Adapter & Battery Attribute Resolution Precedence

The card uses an internal adapter snapshot (`getRegistrySnapshot(hass)`) returning `{ states, entities, devices }`.

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

When rendering battery row icons:

1. **Sensor icon**: icon from the resolved external sensor entity state, if present.
2. **Deterministic numeric icon**: mapped from numeric battery value (`0..100` rounded to nearest 10). If a same-device charging binary sensor (`device_class: battery_charging`) is discovered and `on`, charging icons are rendered:
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

1. Unit tests in `tests/card-attributes.test.mjs` verifying the entire precedence matrix, `0%` handling, unavailable handling, numeric icon mapping, and editor schemas.
2. HA smoke test fixture with a modern `sensor.demo_vacuum_0_ground_floor_battery` entity asserting rendered battery percentage.
