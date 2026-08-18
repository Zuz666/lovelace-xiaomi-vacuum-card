<!-- markdownlint-disable MD034 -->

## Outcome

The project publishes and maintains evidence-based compatibility profiles and fixtures for major Home Assistant vacuum integrations without treating one model-specific patch as support for an entire vendor.

## Why this matters

Historical upstream issues and pull requests contain useful Dreame, Roborock, Viomi, Ecovacs, Valetudo, and Eufy examples, but many reflect old entity models or a single device. Modern integrations dynamically expose entities according to model, firmware, map, and device capabilities. Compatibility work therefore needs fixtures, explicit contracts, and a tested matrix before presets are added.

Fixtures must be shared with the contract and real browser component layers so a compatibility claim verifies source resolution, visible presentation, controls, availability, and service behavior for the same entity model.

## Scope

- define a compatibility fixture format for vacuum state, related entities, metadata, services, and capabilities;
- add representative sanitized fixtures for verified integrations and models;
- reuse fixtures across contract, component, and selected HA smoke tests;
- record which rows, controls, and actions are supported automatically;
- add compatibility profiles only when generic discovery and explicit configuration are insufficient;
- publish a tested integration and model matrix;
- use public compatibility reports to expand evidence safely.

Initial integration order:

1. Roborock;
2. Xiaomi Miio;
3. Dreame Vacuum;
4. Ecovacs;
5. Valetudo;
6. Viomi;
7. Eufy or Robovac.

## Non-goals

- claiming support for every model from one fixture;
- copying historical upstream vendor objects without current verification;
- storing user credentials, tokens, coordinates, serial numbers, or raw private diagnostics;
- duplicating behavior already handled by generic entity discovery;
- requiring a full HA container for every compatibility fixture.

## Child issues

- [ ] {{issue:p1-entity-fixture-matrix}} — introduce reusable entity fixtures and a scenario matrix

Planned decomposition after the shared fixture schema and entity-aware row model are approved:

- [ ] Add verified fixtures for prioritized integrations and models.
- [ ] Add only the compatibility profiles justified by fixture gaps.
- [ ] Publish tested integration and model documentation.

## Exit criteria

- [ ] Fixture format and privacy requirements are documented.
- [ ] Every compatibility claim links to a fixture and tested behavior.
- [ ] At least the contract and component layers consume the shared fixture format.
- [ ] Generic behavior is preferred over vendor-specific mapping.
- [ ] Profile selection and fallbacks are deterministic.
- [ ] The visual editor exposes only verified choices or generic entity selectors.
- [ ] The published matrix distinguishes integration support, tested models, and unverified reports.
- [ ] Tests cover profile, fixture, and expected behavior across relevant layers.

## Upstream and Home Assistant references

- Upstream pull requests: https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/83, https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/106, https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/114, https://github.com/benct/lovelace-xiaomi-vacuum-card/pull/127
- Representative upstream issues: https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/82, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/85, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/89, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/101, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/108, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/109, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/111

## Release plan

- Target milestone: none until fixtures and implementation capacity justify a release commitment
- Critical path: shared fixture schema → entity-aware row design → verified fixtures → narrowly scoped profiles
- Known blockers: access to sanitized real-device evidence for some integrations and models
