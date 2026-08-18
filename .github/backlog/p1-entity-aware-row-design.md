<!-- markdownlint-disable MD034 -->

## Problem

The current row model grew from vacuum attributes and later added explicit external entities, custom services, units, icons, and dropdown behavior. Modern Home Assistant integrations now distribute vacuum functionality across `vacuum`, `sensor`, `binary_sensor`, `select`, `button`, `number`, and image or camera entities. Adding more vendor presets or special-case compute functions would make the configuration and runtime increasingly inconsistent.

Before implementing external `select.*` controls, Home Assistant-aware formatting, same-device discovery, and richer visual-editor support, the repository needs one approved row and control model with a backward-compatible migration strategy.

## Evidence and upstream references

- Upstream issue(s): https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/57, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/65, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/67, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/89, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/93, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/115, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/118
- Upstream pull request(s): https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/69, https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/71, https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/114
- Home Assistant change or documentation: entity state formatting, entity/device registry metadata, `select.select_option`, and modern vacuum entity capabilities
- Current fork behavior: rows can read vacuum attributes or external entity states; dropdown payload and target semantics remain vacuum-oriented.
- Reproduction, fixture, or diagnostic evidence: an external `select.*` can be displayed as text but cannot use its native options and `select.select_option` target contract through the existing generic row behavior.

## Scope

Produce and approve a design specification covering:

- row identity and ordering;
- data-source descriptors for the main vacuum state, vacuum attributes, explicit entities, and same-device discovery;
- read-only versus controllable rows;
- entity-aware state and attribute formatting;
- units, precision, icons, availability, and value-map fallback behavior;
- control descriptors for `select`, `button`, and generic Home Assistant actions;
- service target and data semantics;
- reactive dependency declaration;
- visual-editor representation;
- serialization and validation;
- legacy YAML normalization and deprecation policy;
- source-module and build boundaries needed to implement the model safely.

The design should include representative YAML examples and a migration matrix from current configuration fields.

## Non-goals

- Implementing the complete design in this issue.
- Adding vendor presets before fixtures and contracts exist.
- Removing current YAML syntax.
- Defining room and area cleaning UX beyond interfaces needed by the future action subsystem.

## Proposed behavior

The approved design should separate three concerns that are currently partially coupled:

1. **Source** — where a value, metadata, availability, and dependencies come from;
2. **Presentation** — how Home Assistant formats the value and how explicit overrides apply;
3. **Control or action** — how user interaction targets an entity or performs a Home Assistant action.

A representative direction, subject to the design decision, is:

```yaml
state:
  cleaning_mode:
    source:
      entity: select.my_vacuum_cleaning_mode
    control:
      type: select
    icon: mdi:robot-vacuum
```

The migration layer may continue accepting the existing compact form:

```yaml
attributes:
  cleaned_area:
    entity: sensor.my_vacuum_cleaned_area
    label: "Cleaned area: "
    unit: " m²"
```

The design must state which configuration is canonical, which is normalized internally, and how unknown fields remain round-trip safe in the visual editor.

## Acceptance criteria

- [ ] A written design is committed under `docs/specs/`.
- [ ] Source, presentation, control, availability, and dependency responsibilities are explicitly separated.
- [ ] Current YAML fields are mapped to the proposed internal model.
- [ ] Backward compatibility, deprecation, and migration rules are explicit.
- [ ] External `select.*`, read-only sensors, binary sensors, and button entities are represented without vendor-specific assumptions.
- [ ] Home Assistant formatting and explicit `precision` or `value_map` fallback precedence are defined.
- [ ] Service target and data semantics are defined for native controls and generic actions.
- [ ] Visual-editor serialization and unknown-field preservation are defined.
- [ ] Required source/build refactoring is identified and sequenced.
- [ ] Follow-up implementation issues can be created with independent acceptance criteria.

## Test plan

- [ ] Review configuration examples against current parser and editor behavior
- [ ] Create migration fixtures for representative current YAML
- [ ] Validate proposed service contracts against Home Assistant documentation and integration fixtures
- [ ] Document test seams for source resolution, formatting, controls, and serialization
- [ ] No runtime tests are required unless a prototype is committed

## Compatibility and migration

- Minimum or targeted Home Assistant version: to be decided and documented by the design
- Existing configuration impact: no immediate runtime change; design must preserve current supported YAML through normalization
- Deprecations: potential future deprecations must include warning and migration policy
- Breaking change: Potential

## Dependencies

- Blocked by: completion or stable direction of the v4.6.3 runtime-correctness work
- Blocks: modular source/build refactor; Home Assistant-aware formatter; external select controls; related-entity discovery in the visual editor
- Related epic: {{issue:epic-entity-aware-rows}}

## Release impact

- Target milestone: v4.7.0 — Entity-aware rows and controls
- Changelog entry required: No for design-only work
- Documentation update required: Yes, the design specification is the primary deliverable
- HACS or release asset impact: none for design-only work
