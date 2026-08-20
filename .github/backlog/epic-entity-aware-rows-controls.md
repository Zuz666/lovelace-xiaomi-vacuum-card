<!-- markdownlint-disable MD034 -->

## Outcome

Rows and controls use a consistent, Home Assistant-aware model that can display and control entities across modern vacuum integrations without accumulating vendor-specific special cases.

## Why this matters

Modern integrations expose related functionality through `sensor`, `binary_sensor`, `select`, `button`, `number`, and image entities. The current compact configuration remains useful, but source resolution, formatting, dropdown behavior, service targets, editor serialization, and reactivity need a shared architecture before the card grows further.

The implementation also needs reusable entity fixtures and real browser component tests. Adding more inline mocks to the VM harness would not validate Lit lifecycle, DOM controls, focus, or editor behavior and would make integration scenarios diverge across test layers.

## Scope

- approve the entity-aware row and control design;
- introduce reusable entity fixtures and a shared scenario matrix;
- introduce maintainable source-module and build boundaries;
- format values using Home Assistant entity metadata;
- support external `select.*` controls with native target and payload semantics;
- discover suitable same-device entities in the visual editor;
- normalize current YAML into the new internal model without losing unknown fields;
- define migration and deprecation policy;
- cover rendering, controls, availability, and editor round trips in the real browser component layer.

## Non-goals

- standard Lovelace actions beyond interfaces required by the control model;
- room and area cleaning UX;
- broad vendor preset expansion before compatibility fixtures exist;
- removal of currently supported YAML in the v4.7.0 line.

## Child issues

- [ ] {{issue:p1-modularize-src}} — modularize src directory into domain modules
- [ ] {{issue:p1-entity-aware-row-design}} — define the entity-aware row model and migration strategy
- [ ] {{issue:p1-entity-fixture-matrix}} — introduce reusable entity fixtures and a scenario matrix
- [ ] {{issue:p1-editor-helper-descriptions}} — provide descriptive helper text across all visual editor sections

**Shared testing prerequisite:**

- [x] {{issue:p0-real-lit-component-tests}} — provide real Lit and DOM component coverage

Planned decomposition after the design is approved:

- [ ] Refactor the shipped single-file source into documented source/build boundaries while preserving the release asset.
- [ ] Format row values through Home Assistant entity metadata with explicit override fallbacks.
- [ ] Control external `select.*` entities through `select.select_option`.
- [ ] Discover related device entities in the visual editor.

## Exit criteria

- [ ] The design specification is approved and implemented by independently testable issues.
- [ ] Shared fixtures cover representative modern, legacy, unavailable, and controllable entity shapes.
- [ ] Existing supported YAML is normalized and remains compatible.
- [ ] External read-only and controllable entities share one predictable model.
- [ ] Formatting respects Home Assistant metadata before card-specific fallbacks.
- [ ] Visual-editor round trips preserve supported and unknown configuration fields.
- [ ] Contract, component, pinned HA smoke, HACS, and CodeQL checks pass.
- [ ] Migration and contributor documentation is complete.

## Upstream and Home Assistant references

- Upstream issues: https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/57, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/65, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/67, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/89, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/93, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/115, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/118
- Upstream pull requests: https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/69, https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/71, https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/114

## Release plan

- Target milestone: v4.7.0 — Entity-aware rows and controls
- Critical path: design and fixture schema → source/build boundaries and migration layer → formatter and controls → editor discovery
- Testing gate: real component harness must exist before lifecycle- or interaction-sensitive implementation is merged
- Known blockers: runtime correctness must be stable enough to define dependency behavior
