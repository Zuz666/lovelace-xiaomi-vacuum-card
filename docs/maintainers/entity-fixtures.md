# Entity Fixtures and Scenario Matrix

## Overview

This repository uses a versioned, sanitized entity fixture format located in `tests/fixtures/scenarios/` to drive tests consistently across test layers:

- **Node.js Contract Tests** (`tests/fixtures-validation.test.mjs`)
- **Playwright Component Tests** (`tests/component/fixture-driven-scenarios.spec.mjs`)
- **Home Assistant Smoke Scenarios** (`tests/ha-smoke/` — currently uses an independent YAML baseline and requires a deterministic adapter before shared fixtures can drive it)
  By sharing canonical entity shapes, source precedence, reactivity, availability, and action capabilities are verified against the exact same scenario data without duplicating ad-hoc inline mocks.

---

## Schema Version Contract

Every fixture file declares a top-level integer `schema_version`.

- **Current Version**: `1`
- **Supported Versions**: `[1]`

### Version Policy

1. **Validation**: The shared loader (`tests/fixtures/loader.mjs`) strictly validates `schema_version` before exposing any fixture data. Missing, non-integer, zero, negative, or unsupported versions are rejected with a descriptive error.
2. **No Silent Coercion**: Unsupported versions are never silently coerced into the current shape.
3. **Migration**: Any intentional support for older schema versions must be implemented as an explicit, reviewed, one-way migration function covered by dedicated tests.

---

## Fixture Structure

```json
{
  "schema_version": 1,
  "id": "modern-separated-battery",
  "kind": "synthetic",
  "description": "Modern StateVacuumEntity with STATE (4096) and separate sensor battery",
  "vacuum_entity_id": "vacuum.modern_cleaner",
  "states": {
    "vacuum.modern_cleaner": {
      "entity_id": "vacuum.modern_cleaner",
      "state": "docked",
      "attributes": {
        "friendly_name": "Modern Robotic Cleaner",
        "supported_features": 12316
      }
    },
    "sensor.modern_cleaner_battery": {
      "entity_id": "sensor.modern_cleaner_battery",
      "state": "88",
      "attributes": {
        "device_class": "battery",
        "unit_of_measurement": "%"
      }
    }
  },
  "entities": {},
  "devices": {},
  "expected": {
    "status": "Docked",
    "battery": "88%",
    "actions": {
      "start": { "visible": true, "disabled": false },
      "pause": { "visible": true, "disabled": true }
    }
  }
}
```

### Required Fields

| Field              | Type      | Description                                                           |
| :----------------- | :-------- | :-------------------------------------------------------------------- |
| `schema_version`   | `integer` | Must match a supported schema version (currently `1`).                |
| `id`               | `string`  | Unique kebab-case identifier matching the filename without extension. |
| `kind`             | `string`  | `"synthetic"`, `"verified_integration"`, or `"verified_model"`.       |
| `description`      | `string`  | Clear summary of the vacuum scenario and capability flags.            |
| `vacuum_entity_id` | `string`  | Primary vacuum entity ID (must start with `vacuum.`).                 |
| `states`           | `object`  | Map of entity state objects present in the scenario.                  |

### Optional Fields

- `entities`: Entity registry entries (`device_id`, `platform`, `device_class`, etc.) for device registry discovery.
- `devices`: Device registry entries (`id`, `name`, `model`, `manufacturer`).
- `expected`: Assertable expected display values, status, battery, and action button states.

---

## Privacy and Sanitization Rules

Before committing any fixture based on user diagnostic reports or real Home Assistant instances:

1. **No Credentials or Secrets**: Remove all `password`, `secret`, `access_token`, `api_key`, or `bearer` tokens.
2. **No Private IP Addresses**: Replace local IPs (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`) with sanitized identifiers.
3. **No Private Identifiers**: Anonymize serial numbers, mac addresses, cloud user IDs, and personal entity names.
4. **No Map Coordinates**: Remove raw map polygons, room coordinates, and GPS location data.

The loader runs automated regex sanitization checks on all fixtures during testing.

---

## Adding a New Fixture

1. Create `tests/fixtures/scenarios/<kebab-case-id>.json`.
2. Populate required fields following `schema_version: 1`.
3. Run `npm test` to verify that `tests/fixtures-validation.test.mjs` validates the new fixture cleanly.
4. Add a component test scenario in `tests/component/fixture-driven-scenarios.spec.mjs` if new observable DOM behavior is introduced.
