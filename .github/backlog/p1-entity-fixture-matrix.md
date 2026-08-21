## Problem

Current test data is mostly embedded directly inside individual test files or the single Home Assistant smoke configuration. The same integration or entity shape must therefore be recreated independently for source-resolution tests, component tests, editor tests, and HA smoke scenarios.

This duplication makes compatibility claims difficult to audit and encourages one-off vendor mocks. It also makes it harder to verify that source precedence, reactivity, formatting, availability, controls, and editor serialization agree for the same entity model.

## Evidence and upstream references

- Current inline state examples: [`tests/card-attributes.test.mjs`](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/blob/main/tests/card-attributes.test.mjs)
- Current smoke fixture: [`tests/ha-smoke/home-assistant/configuration.yaml`](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/blob/main/tests/ha-smoke/home-assistant/configuration.yaml)
- Compatibility intake form: [`.github/ISSUE_TEMPLATE/compatibility_report.yml`](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/blob/main/.github/ISSUE_TEMPLATE/compatibility_report.yml)
- Maintainer review: [`docs/maintainers/testing-strategy.md`](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/blob/main/docs/maintainers/testing-strategy.md)
- Current fork behavior: tests use independently authored state maps and the repository has no canonical fixture schema.

## Scope

- Define a sanitized, explicitly versioned fixture schema for Home Assistant vacuum scenarios.
- Represent the main vacuum state, attributes, `supported_features`, related entities, and required entity or device metadata.
- Represent expected displayed rows, values, icons, availability, controls, service targets, and action payloads.
- Distinguish integration identity, verified model evidence, synthetic edge cases, and expected behavior.
- Add fixture loaders and builders usable by Node contract tests and real browser component tests.
- Provide a path for selected fixtures to generate or configure targeted HA smoke scenarios where feasible.
- Add initial generic fixtures for modern separated entities, legacy attribute-based entities, unavailable or renamed related entities, and feature-flag combinations.
- Add privacy validation and contribution guidance for compatibility fixtures.
- Link every future compatibility profile claim to fixture-backed tests.

## Non-goals

- Storing raw Home Assistant diagnostics without review and sanitization.
- Including credentials, tokens, coordinates, serial numbers, map data, personal entity names, or private images.
- Claiming support for every model from one fixture.
- Building a hardcoded vendor database when generic entity semantics are sufficient.
- Requiring a full HA container for every fixture.
- Silently accepting unknown future fixture schemas.

## Proposed behavior

### Schema version contract

Every fixture has a top-level integer `schema_version`. The initial schema version is `1`.

Loaders shared by Node, browser, and Home Assistant adapters must validate the version before exposing any fixture data:

- accept the exact current version;
- reject missing, non-integer, zero, negative, or unknown future versions with a diagnostic that names the fixture and supported versions;
- never silently coerce an unsupported version into the current shape;
- introduce an explicit, reviewed, one-way migration function when support for an older version is intentionally retained;
- test each supported migration and perform it before the fixture reaches any consumer-specific builder.

A schema-version increase requires documentation of incompatible fields, migration policy, and affected test consumers.

### Modern separated-entity example

A fixture contains stable scenario metadata and the Home Assistant objects needed by the card. A modern `StateVacuumEntity` example includes the required `STATE` feature bit (`4096`):

```json
{
  "schema_version": 1,
  "id": "modern-separated-entities",
  "kind": "synthetic",
  "vacuum_entity_id": "vacuum.test_vacuum",
  "states": {
    "vacuum.test_vacuum": {
      "state": "docked",
      "attributes": {
        "supported_features": 4096
      }
    },
    "sensor.test_vacuum_battery": {
      "state": "73",
      "attributes": {
        "device_class": "battery",
        "unit_of_measurement": "%"
      }
    }
  },
  "expected": {
    "battery": "73%",
    "status": "docked"
  }
}
```

The schema documentation should name numeric Home Assistant feature values symbolically in comments, builders, or companion metadata so tests do not obscure that `4096` represents `VacuumEntityFeature.STATE`.

### Legacy and feature-combination examples

A `supported_features: 0` scenario belongs in a separately named fixture such as `legacy-attribute-vacuum-no-state-feature`. It must be classified as a legacy or deliberately incomplete feature combination rather than presented as a compliant modern `StateVacuumEntity`.

Additional fixtures should independently vary `STATE`, `START`, `PAUSE`, `STOP`, `RETURN_HOME`, `LOCATE`, `CLEAN_SPOT`, `FAN_SPEED`, and `CLEAN_AREA` as required by the scenario. The final schema may separate entity registry and device registry data, use reusable fragments, and include service expectations. The important property is that the same versioned fixture can drive several test layers without embedding card implementation details.

## Acceptance criteria

- [x] A documented fixture schema distinguishes synthetic scenarios from verified integration or model evidence.
- [x] Every fixture declares `schema_version: 1` or another explicitly supported integer version.
- [x] Loaders reject missing and unknown future schema versions before passing data to Node, browser, or Home Assistant consumers.
- [x] Any supported older-version migration is explicit, one-way, documented, and covered by tests.
- [x] Fixtures include main vacuum state, related entity states, feature flags, and required registry metadata.
- [x] A modern `StateVacuumEntity` fixture includes the required `STATE` feature bit.
- [x] `supported_features: 0` appears only in a separately identified legacy or incomplete-feature scenario.
- [x] Expected behavior can describe displayed values, availability, controls, and service or action payloads.
- [x] A loader validates required fields, unique fixture IDs, schema versions, and privacy constraints.
- [x] Node contract tests consume at least two fixtures.
- [x] Real browser component tests consume the same fixture format.
- [x] At least one selected fixture can be represented in the HA smoke environment, or the limitation is documented with a deterministic adapter plan.
- [x] Initial fixtures cover modern separated entities, legacy attributes, unavailable related entities, and multiple supported-feature combinations.
- [x] Compatibility reports document how maintainers convert sanitized evidence into reviewed fixtures.
- [x] Future vendor profiles require fixture-backed regression tests.

## Test plan

- [x] Fixture schema validation tests
- [x] Tests for missing, malformed, current, migrated, and unknown future `schema_version` values
- [x] Test proving unsupported versions are rejected before consumer builders run
- [x] Privacy and forbidden-field validation tests
- [x] Contract-test loader integration
- [x] Component-test loader integration
- [x] Expected-value and service-payload assertions from shared fixtures
- [x] Modern `STATE` feature fixture and separate `supported_features: 0` legacy fixture
- [x] Negative tests for malformed and ambiguous fixture data
- [x] Review fixtures for deterministic ordering and stable IDs

## Compatibility and migration

- Minimum or targeted Home Assistant version: fixtures must declare the HA or integration context they represent when relevant
- Existing configuration impact: none
- Deprecations: inline test data may be gradually replaced where shared fixtures improve clarity
- Breaking change: No for runtime configuration; fixture schema changes follow the explicit version and migration policy

## Dependencies

- Blocked by: fixture consumers may be introduced incrementally; the real component harness {{issue:p0-real-lit-component-tests}} is required for browser reuse
- Blocks: broad v4.7 entity-aware implementation; verified compatibility profiles and matrix publication
- Related epics: {{issue:epic-testing-architecture}}, {{issue:epic-entity-aware-rows}}, and {{issue:epic-integration-compatibility}}

## Release impact

- Target milestone: v4.7.0 — Entity-aware rows and controls
- Changelog entry required: No
- Documentation update required: Yes
- HACS or release asset impact: none
