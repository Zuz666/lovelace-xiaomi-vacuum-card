# Specification: Home Assistant 2026.8 Battery Compatibility

## Context

Home Assistant modern vacuum integrations (such as the standard `vacuum` entity domain integrations and contemporary MQTT / integration platforms) expose battery level as a separate `sensor.<vacuum_name>_battery` or `sensor.<vacuum_name>_battery_level` entity rather than legacy vacuum state attributes.

The card must resolve battery state accurately across modern sensor entities, explicit overrides, and legacy attributes without breaking existing configurations.

## Requirements

### 1. Battery Attribute Resolution Precedence

When rendering a battery row (`id: 'battery'` or `key: 'battery'` / `key: 'battery_level'`):

1. **Explicit entity**: `data.entity` if configured and present in `hass.states`. If configured but absent in `states`, fall through to subsequent sources.
2. **Modern sensor entity**: `sensor.${vacuum_object_id}_battery`.
3. **Legacy sensor entity**: `sensor.${vacuum_object_id}_battery_level`.
4. **Vacuum attribute `battery_level`**: `vacuumState.attributes.battery_level`.
5. **Vacuum attribute `battery`**: `vacuumState.attributes.battery`.
6. **Generic vacuum property fallback**: `vacuumState[data.key]`.

If any source exists, including valid `0` or empty string values, use it. If no source is found, return `null` (displayed as localized "Unavailable").

For non-battery rows, the resolution order remains:

1. Explicit `data.entity`.
2. `${sensorEntity}_${data.key}`.
3. `vacuumState.attributes[data.key]`.
4. `vacuumState[data.key]`.

### 2. Battery Icon Precedence

When rendering battery row icons:

1. **Sensor icon**: icon from the resolved external sensor entity state, if present.
2. **Deterministic numeric icon**: mapped from numeric battery value (`0..100` rounded to nearest 10):
   - `0`: `mdi:battery-outline`
   - `10..90`: `mdi:battery-10` through `mdi:battery-90`
   - `100`: `mdi:battery`
3. **Legacy attribute icon**: `vacuumState.attributes.battery_icon`.
4. **Configured fallback icon**: `data.icon` or default fallback.

For non-battery rows, configured and entity icons retain standard semantics.

### 3. Editor Behavior

In `XiaomiVacuumCardEditor.entityDataRowSchema(row)`:

- For battery rows, always show the icon selector.
- Constrain entity selector to `{ domain: 'sensor', device_class: 'battery' }`.
- Do not auto-populate or save derived sensor entities into configuration YAML unless explicitly chosen by the user.

## Verification

1. Unit tests in `tests/card-attributes.test.mjs` verifying the entire precedence matrix, `0%` handling, unavailable handling, numeric icon mapping, and editor schemas.
2. HA smoke test fixture with a modern `sensor.demo_vacuum_0_ground_floor_battery` entity asserting rendered battery percentage.
