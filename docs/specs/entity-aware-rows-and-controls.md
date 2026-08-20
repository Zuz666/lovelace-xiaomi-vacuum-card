# Architecture Specification: Entity-Aware Rows and Controls

## 1. Overview & Problem Statement

Historically, rows in `xiaomi-vacuum-card` were directly coupled to vacuum entity attributes (e.g. `attributes.status`, `attributes.battery_level`, `attributes.fan_speed`). Over time, external sensor binding, units, icons, custom service templates, and dropdowns were added as ad-hoc extensions.

In modern Home Assistant Core (2024+ / 2026+), vacuum integrations distribute capabilities across distinct entity domains:

- **Status & Mode**: `vacuum.*` canonical state or dedicated `select.*` entities (e.g. cleaning mode, water level).
- **Consumables & Telemetry**: `sensor.*` (main brush, side brush, filter left, sensor dirty, total cleaning area).
- **Battery & Power**: `sensor.*` (device_class: `battery`) and `binary_sensor.*` (device_class: `battery_charging`).
- **Actions & Triggers**: `button.*` (reset filter, empty dustbin, dock).

To scale cleanly across all integrations without piling up vendor-specific special cases, this specification establishes an explicit three-tier architecture: **Source**, **Presentation**, and **Control**.

---

## 2. Three-Tier Separation Architecture

```text
│ 1. SOURCE LAYER                                             │
│ - Entity binding (vacuum, sensor, select, binary_sensor)    │
│ - Attribute extraction (key, fallback attributes)           │
│ - Same-device registry auto-discovery                      │
│ - Availability & reactive dependency tracking               │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. PRESENTATION LAYER                                       │
│ - Home Assistant metadata formatting (localize, decimals)   │
│ - Unit of measurement & custom unit suffixes                │
│ - Icon resolution & dynamic charging state indicators       │
│ - Value mapping (state translations, custom compute maps)   │
│ - Unavailable / Unknown string localization                 │
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
```

### 3.2 Source Descriptors

| Source Property | Type     | Description                                                                  |
| :-------------- | :------- | :--------------------------------------------------------------------------- |
| `entity`        | `string` | Explicit entity ID (e.g. `sensor.vacuum_battery` or `select.cleaning_mode`). |
| `attribute`     | `string` | Specific attribute on the bound entity (e.g. `status` or `filter_left`).     |
| `discovery`     | `string` | Auto-discovery strategy: `"device_registry"` (same device) or `"prefix"`.    |

### 3.3 Presentation Descriptors

| Presentation Property | Type     | Description                                                               |
| :-------------------- | :------- | :------------------------------------------------------------------------ |
| `icon`                | `string` | Material Design icon name (e.g. `mdi:battery`, `mdi:fan`).                |
| `label`               | `string` | Text label rendered beside or as tooltip for the row.                     |
| `unit`                | `string` | Unit suffix (e.g. `" %"`, `" h"`, `" m²"`). Overrides entity unit if set. |
| `precision`           | `number` | Decimal places for numeric values.                                        |
| `value_map`           | `object` | Key-value dictionary translating raw states into localized strings.       |

### 3.4 Control Descriptors

| Control Property | Type     | Description                                                                                     |
| :--------------- | :------- | :---------------------------------------------------------------------------------------------- |
| `type`           | `string` | Control type: `"none"` (read-only), `"select"` (combobox), `"button"` (action).                 |
| `service`        | `string` | Home Assistant service dispatched on user interaction.                                          |
| `options_source` | `string` | Attribute containing option list (default: `options` for `select.*`, `${key}_list` for legacy). |

---

## 4. Legacy YAML Normalization Matrix

The card maintains 100% backward compatibility by normalizing existing flat YAML into the canonical model during `setConfig`:

| Legacy YAML Field       | Normalized Canonical Path                              | Example Transformation                                                            |
| :---------------------- | :----------------------------------------------------- | :-------------------------------------------------------------------------------- |
| `entity: sensor.custom` | `source.entity: sensor.custom`                         | `{ entity: "sensor.batt" }` $\rightarrow$ `{ source: { entity: "sensor.batt" } }` |
| `key: status`           | `source.attribute: status` (or canonical vacuum state) | `{ key: "status" }` $\rightarrow$ `{ source: { attribute: "status" } }`           |
| `icon: mdi:brush`       | `presentation.icon: mdi:brush`                         | Direct mapping to presentation layer                                              |
| `label: "Brush: "`      | `presentation.label: "Brush: "`                        | Direct mapping to presentation layer                                              |
| `unit: " h"`            | `presentation.unit: " h"`                              | Direct mapping to presentation layer                                              |
| `service: custom.call`  | `control.service: custom.call`                         | Promotes row to controllable                                                      |

---

## 5. Reactive Dependency Resolution

When the card registers entity listeners:

1. Primary `config.entity` (`vacuum.*`).
2. All explicit `source.entity` references across `state` and `attributes` rows.
3. Dynamically discovered same-device entities (`sensor.*`, `binary_sensor.*`).
4. Media-source background image resolvers.

The card updates only when a monitored entity's `state` or relevant `attributes` change, avoiding unnecessary render churn.

---

## 6. Visual Editor Representation & Field Preservation

1. **Structured Panels**:
   - The editor displays intuitive input fields with contextual `helper` text.
   - Preserves unknown custom YAML fields in `model.extra` during editor round-trips.
2. **Same-Device Entity Picker**:
   - When configuring a row, the entity selector automatically filters and suggests entities sharing the vacuum's `device_id`.

---

## 7. Implementation Sequence

1. **Step 1 (v4.7.0)**: RFC Design Approval (`Issue #37`) & Entity Fixture Matrix (`Issue #36`).
2. **Step 2 (v4.7.1)**: Internal YAML normalization layer in `src/utils.js` and `src/card.js`.
3. **Step 3 (v4.7.2)**: External `select.*` control support with native `select.select_option` dispatch.
4. **Step 4 (v4.7.3)**: Visual Editor related-entity discovery and schema upgrade.
