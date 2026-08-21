# Architecture Specification: Entity-Aware Rows and Controls

## 1. Overview & Problem Statement

Historically, rows in `xiaomi-vacuum-card` were directly coupled to vacuum entity attributes (e.g. `attributes.status`, `attributes.battery_level`, `attributes.fan_speed`). Over time, external sensor binding, units, icons, custom service templates, and dropdowns were added as ad-hoc extensions.

In modern Home Assistant Core (validated baseline: Core 2024.1+ through 2026.2+, with legacy attribute fallbacks preserved for Core 2023.9+), vacuum integrations distribute capabilities across distinct entity domains:

- **Status & Activity**: `vacuum.*` canonical state (`VacuumActivity` enum: `cleaning`, `docked`, `idle`, `paused`, `returning`, `error` introduced in Core 2025.1) or dedicated `select.*` entities (e.g. cleaning mode, water level, mop route).
- **Consumables & Telemetry**: `sensor.*` (main brush left, side brush left, filter left, sensor dirty, total cleaning area, cleaning time).
- **Battery & Power**: `sensor.*` (with `device_class: battery`) and `binary_sensor.*` (with `device_class: battery_charging` or companion power sensor).
- **Actions & Triggers**: `button.*` (reset filter, empty dustbin, dock, self-clean).
- **Select Controls**: `select.*` (cleaning mode, suction power, mop intensity) dispatched via `select.select_option`.

To scale cleanly across all integrations without piling up vendor-specific special cases, this specification establishes an explicit three-tier architecture: **Source**, **Presentation**, and **Control**.

---

## 2. Three-Tier Separation Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. SOURCE LAYER                                             │
│ - Entity binding (vacuum, sensor, select, binary_sensor)    │
│ - Attribute extraction (explicit attribute vs state)        │
│ - Same-device registry & prefix auto-discovery              │
│ - Availability & reactive dependency tracking               │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. PRESENTATION LAYER                                       │
│ - Home Assistant metadata formatting (localize, formatState)│
│ - Unit of measurement & custom unit suffixes                │
│ - Non-negative integer display precision                    │
│ - Icon resolution & dynamic charging state indicators       │
│ - Value mapping (translation keys or literal overrides)     │
│ - Unavailable / Unknown string localization & styling       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. CONTROL LAYER                                            │
│ - Read-only display (text, badges)                          │
│ - Combobox select (options list, target select_option)      │
│ - Action buttons (press, service call dispatch)             │
│ - Lovelace standard tap/hold actions                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Canonical Schema Definition

### 3.1 Row Model Schema

```yaml
state:
  cleaning_mode:
    source:
      entity: select.roborock_s7_cleaning_mode
    presentation:
      icon: mdi:robot-vacuum
      label: "Mode"
    control:
      type: select
      service: select.select_option

attributes:
  main_brush:
    source:
      entity: sensor.roborock_s7_main_brush_left
    presentation:
      icon: mdi:brush
      label: "Main brush"
      unit: " h"
      precision: 1

  status_legacy:
    source:
      attribute: clean_mode
    presentation:
      icon: mdi:information
      label: "Status"

  battery_discovered:
    source:
      discovery: device_registry
    presentation:
      unit: " %"
      precision: 0
```

### 3.2 Source Descriptors

| Source Property | Type                               | Description                                                                                                                                                                                      |
| :-------------- | :--------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entity`        | `string` (optional)                | Explicit entity ID (e.g. `sensor.vacuum_battery` or `select.cleaning_mode`). Takes precedence over auto-discovery.                                                                               |
| `attribute`     | `string` (optional)                | Specific attribute on the bound entity (e.g. `status` or `filter_left`). If omitted and `entity` is provided, the entity's canonical state is resolved.                                          |
| `discovery`     | `"device_registry"` \| `"prefix"`  | Auto-discovery strategy: `"device_registry"` (discovers entities sharing the vacuum's `device_id`) or `"prefix"` (matches candidate entities by prefix pattern).                                 |
| `prefix`        | `string` (optional)                | Explicit entity ID prefix used when `discovery: "prefix"` is configured (e.g. `sensor.roborock_s7_`). Matched entities must start with this prefix and conform to expected domain/role suffixes. |
| `availability`  | `string` (auto-derived / optional) | Evaluated availability state (`"available"`, `"unavailable"`, or `"unknown"`). Controls on unavailable sources are automatically disabled, and text displays localized unavailable indicators.   |

### 3.3 Presentation Descriptors

| Presentation Property | Type                                | Description                                                                                                                                                                                                                                             |
| :-------------------- | :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `icon`                | `string` (optional)                 | Material Design icon name (e.g. `mdi:battery`, `mdi:fan`). Overrides integration and entity icons.                                                                                                                                                      |
| `label`               | `string` (optional)                 | Text label rendered beside or as tooltip for the row. Overrides entity `friendly_name`.                                                                                                                                                                 |
| `unit`                | `string` (optional)                 | Unit suffix (e.g. `" %"`, `" h"`, `" m²"`). Overrides entity `unit_of_measurement` if explicitly specified.                                                                                                                                             |
| `precision`           | `integer >= 0` (optional)           | Non-negative integer specifying decimal places for numeric formatting (e.g. `0`, `1`, `2`). Corresponds to Home Assistant's `suggested_display_precision`.                                                                                              |
| `value_map`           | `Record<string, string>` (optional) | Key-value dictionary translating raw states into localized strings. Values can be explicit localized strings or Home Assistant translation keys (e.g. `"state.vacuum.docked"` or `"ui.attributes.idle"`), resolved via `hass.localize` when applicable. |

#### Deterministic Presentation Resolution Precedence

1. **Value Resolution & Formatting**:
   - **Unavailable / Unknown**: If the resolved entity state or attribute is `unavailable` or `unknown`, render localized unavailable string (`state.default.unavailable` / `state.default.unknown`) in a muted visual style and suppress unit suffixes.
   - **Value Map**: If `presentation.value_map` contains an entry matching the raw string value:
     - If the mapped value matches a known translation key format, resolve via `hass.localize(key)`.
     - Otherwise, display the mapped string verbatim.
   - **Entity State Formatting (`hass.formatEntityState`)**: If `source.entity` is bound to a registered Home Assistant entity and no explicit override overrides it, format state through `hass.formatEntityState(entityState)` to respect integration localization, device class translations, and standard units.
   - **Numeric Formatting**: If the value is numeric:
     - Apply `presentation.precision` if explicitly defined as a non-negative integer.
     - Else apply the entity's `suggested_display_precision` / `display_precision` attribute if present.
     - Else preserve natural decimal representation.
     - Append `presentation.unit` if explicitly provided, else the entity's `unit_of_measurement`, else the default domain unit.
2. **Icon Resolution Precedence**:
   - Explicit `presentation.icon` override from row configuration.
   - For battery indicators: dynamic battery charging icon computed from the companion `binary_sensor.*_battery_charging` or battery state attribute (`mdi:battery-charging-XX` / `mdi:battery-XX`).
   - Entity icon from `entityState.attributes.icon` or Home Assistant entity/device registry icon.
   - Card default fallback icon for the specific canonical row key.
3. **Label Resolution Precedence**:
   - Explicit `presentation.label` override from row configuration.
   - Entity `friendly_name` from entity attributes or entity registry.
   - Card localized row key translation (e.g. `ui.attributes.main_brush`).

### 3.4 Control Descriptors

| Control Property | Type                                 | Description                                                                                                                                                       |
| :--------------- | :----------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`           | `"none"` \| `"select"` \| `"button"` | Control interaction type: `"none"` (read-only display), `"select"` (combobox dropdown), or `"button"` (action trigger). Defaults to `"none"`.                     |
| `service`        | `string` (optional)                  | Home Assistant service dispatched on interaction (e.g. `select.select_option`, `vacuum.set_fan_speed`, `button.press`).                                           |
| `service_data`   | `Record<string, unknown>` (optional) | Additional key-value payload parameters passed to the service call.                                                                                               |
| `options_source` | `string` (optional)                  | Attribute containing the selectable options list (defaults to `options` for `select.*` entities, or legacy `${key}_list` / `fan_speed_list` for vacuum entities). |

#### Select Control Dispatch Contract

When a user selects an option in a combobox control:

1. **Target Entity**:
   - If `source.entity` is specified (e.g. `select.roborock_s7_cleaning_mode`), the service call targets that specific entity: `target: { entity_id: source.entity }`.
   - If `source.entity` is omitted, the service call defaults to targeting the primary vacuum entity: `target: { entity_id: config.entity }`.
2. **Action / Service Selection**:
   - Defaults to `select.select_option` when bound to a `select.*` domain entity.
   - Defaults to `vacuum.set_fan_speed` when bound to legacy fan speed dropdown rows.
   - Uses explicit `control.service` when specified in configuration.
3. **Service Payload Dispatch**:
   - For `select.select_option`: dispatches `data: { option: selectedValue, ...control.service_data }`.
   - For `vacuum.set_fan_speed`: dispatches `data: { fan_speed: selectedValue, ...control.service_data }`.
   - For custom services: dispatches `data: { [key]: selectedValue, ...control.service_data }`.
4. **Legacy Dropdown Backward Compatibility**:
   - Legacy row definitions containing `service` or dropdown lists infer `control.type: "select"`.
   - Existing configurations using `service: vacuum.set_fan_speed` or custom scripts continue working identically without requiring manual migration.

---

## 4. Legacy YAML Normalization Matrix

The card maintains 100% backward compatibility by normalizing existing flat YAML into the canonical model during `setConfig`:

| Legacy YAML Field       | Normalized Canonical Path                              | Normalization Contract & Deterministic Rules                                                                                                         | Example Transformation                                                                                                                                                                                    |
| :---------------------- | :----------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entity: sensor.custom` | `source.entity: sensor.custom`                         | Explicit entity binding promoted to source layer.                                                                                                    | `{ entity: "sensor.batt" }` $\rightarrow$ `{ source: { entity: "sensor.batt" } }`                                                                                                                         |
| `key: status`           | `source.attribute` (if configured) or canonical vacuum | **Precedence rule**: If `attribute` is explicitly provided, maps to `source.attribute`. Otherwise maps to the bound vacuum entity's canonical state. | • Explicit: `{ key: "status", attribute: "clean_mode" }` $\rightarrow$ `{ source: { attribute: "clean_mode" } }`<br>• Fallback: `{ key: "status" }` $\rightarrow$ `{ source: { entity: config.entity } }` |
| `icon: mdi:brush`       | `presentation.icon: mdi:brush`                         | Promoted to presentation layer.                                                                                                                      | `{ icon: "mdi:brush" }` $\rightarrow$ `{ presentation: { icon: "mdi:brush" } }`                                                                                                                           |
| `label: "Brush: "`      | `presentation.label: "Brush: "`                        | Promoted to presentation layer.                                                                                                                      | `{ label: "Brush: " }` $\rightarrow$ `{ presentation: { label: "Brush: " } }`                                                                                                                             |
| `unit: " h"`            | `presentation.unit: " h"`                              | Promoted to presentation layer.                                                                                                                      | `{ unit: " h" }` $\rightarrow$ `{ presentation: { unit: " h" } }`                                                                                                                                         |
| `decimals: 1`           | `presentation.precision: 1`                            | Legacy `decimals` integer mapped to `presentation.precision`.                                                                                        | `{ decimals: 1 }` $\rightarrow$ `{ presentation: { precision: 1 } }`                                                                                                                                      |
| `service: custom.call`  | `control.service: custom.call`                         | Promotes row to controllable.                                                                                                                        | `{ service: "custom.call" }` $\rightarrow$ `{ control: { type: "button", service: "custom.call" } }`                                                                                                      |

---

## 5. Reactive Dependency Resolution & Availability

### 5.1 Reactive Subscriptions (`shouldUpdate` & `getReferencedEntities`)

The card tracks reactive dependencies to ensure efficient rendering without wasted cycles:

1. **Primary Vacuum Entity**: `config.entity` (`vacuum.*`).
2. **Explicit Source Entities**: All `source.entity` references across `state` and `attributes` rows (`sensor.*`, `select.*`, `binary_sensor.*`, `button.*`).
3. **Discovered Companion Entities**: Dynamically discovered battery, charging, and filter companion entities.
4. **Custom Attribute Dependencies**: Monitored vacuum attributes explicitly declared in `source.attribute` or used in template resolvers.
5. **Media Background Resolvers**: Entity IDs referenced by dynamic background image paths.

The card re-renders only when a tracked entity's `state` or relevant `attributes` change.

### 5.2 Availability Semantics

1. **State Evaluation**:
   - A row is marked as unavailable when its bound `source.entity` has state `"unavailable"` or `"unknown"`.
   - If a companion entity is unavailable, the card attempts a graceful fallback to legacy vacuum attributes (e.g. falling back to `attributes.battery_level` if external `sensor.*_battery` is unavailable).
2. **Control Protection**:
   - Combobox selects (`control.type: "select"`) and action buttons (`control.type: "button"`) bound to unavailable entities are disabled.
   - Disabled controls render with standard disabled contrast/opacity and suppress user click/key dispatch events.
3. **Presentation Styling**:
   - Unavailable rows display localized `"Unavailable"` or `"Unknown"` text with muted opacity.

---

## 6. Dynamically Discovered Same-Device Entities

### 6.1 Discovery Criteria & Scope

When auto-discovery is active (`discovery: "device_registry"` or `"prefix"`), candidate entities are filtered by device association and functional role:

- **Allowed Domains & Roles**:
  - `sensor` with `device_class: "battery"` $\rightarrow$ Battery level telemetry.
  - `binary_sensor` with `device_class: "battery_charging"` or `sensor` with `device_class: "power"` $\rightarrow$ Charging status indicator.
  - `sensor` with consumable keywords (`filter_left`, `main_brush_left`, `side_brush_left`, `sensor_dirty_left`) $\rightarrow$ Maintenance telemetry.
  - `select` matching vacuum device $\rightarrow$ Cleaning mode / water level controls.
  - `button` matching vacuum device $\rightarrow$ Vacuum trigger actions (e.g. empty dustbin, self-clean).

### 6.2 Registry Eligibility & Filtering Rules

1. **Disabled Entities (`disabled_by`)**:
   - Entities where `disabled_by !== null` (disabled by user, integration, device, or config entry) are **strictly excluded** from auto-discovery.
2. **Hidden Entities (`hidden_by`)**:
   - Entities where `hidden_by !== null` are excluded from automatic discovery, but may still be explicitly bound via `source.entity`.
3. **Candidate Tie-Breaking Order**:
   - Explicit `source.entity` configuration always has absolute precedence and skips discovery.
   - If multiple matching candidates are discovered for a single role on the same device:
     1. Exact `device_class` match.
     2. Primary entity category (`entity_category === null` preferred over `"diagnostic"` or `"config"`).
     3. Deterministic alphabetical entity ID ordering.
     4. Log a debug notice when multiple candidate entities match.
4. **Dynamic Recomputation**:
   - Candidate resolution is re-evaluated whenever Home Assistant emits entity registry or device registry updates.

---

## 7. Visual Editor Representation & Canonical Round-Trip Contract

### 7.1 Stable Identity & Deterministic Ordering

- **Row Identity**: Each row maintains a stable identifier (`id` / key) throughout editor manipulations (`rows[index].id`).
- **Ordering**: The sequence of rows displayed in the visual editor directly reflects the array order or key insertion order, preserved deterministically across saves.

### 7.2 Bidirectional Editor Mapping

The visual editor maps bidirectional row structures between the flat editor model and canonical descriptors:

| Visual Editor Field     | Canonical Source / Presentation / Control Mapping                                                   |
| :---------------------- | :-------------------------------------------------------------------------------------------------- |
| `rows[index].id`        | Row identifier key (`attributes.<key>` or `state.<key>`).                                           |
| `rows[index].entity`    | `source.entity` (supports same-device entity picker filtering).                                     |
| `rows[index].attribute` | `source.attribute` (attribute extraction on bound entity).                                          |
| `rows[index].icon`      | `presentation.icon`.                                                                                |
| `rows[index].label`     | `presentation.label`.                                                                               |
| `rows[index].unit`      | `presentation.unit`.                                                                                |
| `rows[index].precision` | `presentation.precision` (non-negative integer).                                                    |
| `rows[index].service`   | `control.service`.                                                                                  |
| `rows[index].custom`    | Template or custom rendering flag.                                                                  |
| `rows[index].extra`     | `model.extra` (preserves unrecognized, user-extended, or custom YAML properties without data loss). |

### 7.3 Unknown Field Preservation (`model.extra`)

To ensure lossless round-tripping between YAML and the visual editor:

- Any unrecognized properties encountered during YAML normalization are stored in `model.extra`.
- When serializing changes back to YAML or dispatching `config-changed` events, properties in `model.extra` are merged back at sibling depth.
- User comments and custom keys are protected from accidental erasure.

---

## 8. Implementation Sequence

1. **Step 1 (v4.7.0)**: RFC Design Approval (`Issue #37`) & Entity Fixture Matrix (`Issue #36`).
2. **Step 2 (v4.7.1)**: Internal YAML normalization layer in `src/utils.js` and `src/card.js`.
3. **Step 3 (v4.7.2)**: External `select.*` control support with native `select.select_option` dispatch.
4. **Step 4 (v4.7.3)**: Visual Editor related-entity discovery and schema upgrade.
