<!-- markdownlint-disable MD034 -->

## Outcome

Users can configure standard Home Assistant Lovelace interactions and launch room or area cleaning from a responsive action layout without relying on a large map or vendor-specific button rows as the primary path.

## Why this matters

Historical requests for custom services, confirmation, `fire-dom-event`, room buttons, and second button rows describe one broader need: a standard interaction model and a layout that remains usable as actions grow. Home Assistant now provides standard Lovelace actions and native vacuum area-cleaning capabilities that should be preferred over ad hoc card-only contracts.

These interactions require real browser tests. Direct method calls in the VM harness cannot validate focus, pointer and keyboard handling, event propagation, disabled state, confirmation, or the accessibility tree.

## Scope

- standard Lovelace `tap_action`, `hold_action`, and `double_tap_action` support for buttons, rows, and appropriate card surfaces;
- `more-info`, perform-action, navigation, URL, assist, none, target/data, and confirmation behavior;
- optional compatibility adapter for `fire-dom-event` after the standard model is complete;
- responsive action grid or wrapping layout;
- native `vacuum.clean_area` controls when supported;
- documented vendor-command fallback where native area cleaning is unavailable;
- conditions and active-state styling for rows and actions;
- real browser component tests for pointer, keyboard, focus, confirmation, availability, and accessibility behavior.

## Non-goals

- embedding or replacing full vacuum map cards;
- maintaining a hardcoded room-ID database;
- implementing vendor-specific segment services without fixtures;
- duplicating Home Assistant action semantics under card-specific names.

## Child issues

Planned decomposition after the entity-aware control interfaces are stable:

- [ ] Support standard Lovelace actions on rows, buttons, and the card header.
- [ ] Add a responsive action grid and native `vacuum.clean_area` controls.
- [ ] Add conditions and active-state styling.

## Shared external prerequisites

The following reusable testing infrastructure is owned and prioritized by the testing architecture epic. These issues gate safe implementation, but they are not child deliverables of this v4.8 feature outcome and their priority labels do not automatically promote every downstream epic that consumes them.

- [ ] {{issue:p0-real-lit-component-tests}} — provide real DOM, focus, keyboard, and accessibility assertions
- [ ] {{issue:p1-entity-fixture-matrix}} — provide deterministic capability and availability scenarios

The component harness is P0 because it is required to verify current P0 runtime-correctness work. This epic remains P1 because its own planned action and area-cleaning deliverables are next-minor feature work rather than a current correctness defect.

## Exit criteria

- [ ] Supported interactions follow Home Assistant Lovelace action semantics.
- [ ] Confirmation and unavailable states suppress unsafe dispatches.
- [ ] Five or more actions remain usable on narrow and Sections dashboards.
- [ ] Native area cleaning is capability-aware and integration-neutral.
- [ ] Vendor fallback behavior is explicit, fixture-backed, tested, and optional.
- [ ] Mouse, touch, keyboard, focus, and accessibility behavior is covered in real browser tests.
- [ ] Contract, component, pinned HA smoke, HACS, and CodeQL checks pass.
- [ ] README examples cover standard actions and area cleaning.

## Upstream and Home Assistant references

- Upstream issues: https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/50, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/51, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/57, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/64, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/73, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/94, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/112, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/113, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/120
- Home Assistant references: https://www.home-assistant.io/dashboards/actions/ and https://www.home-assistant.io/integrations/vacuum/

## Release plan

- Target milestone: v4.8.0 — Actions and area cleaning
- Priority rationale: P1 reflects the highest priority of this epic's own action and area-cleaning deliverables; shared testing prerequisites retain their independent priorities
- Critical path: entity-aware control interfaces → standard actions → responsive area controls → conditions and active state
- Testing gate: real component harness and capability fixtures must exist before interaction-heavy implementation is merged
- Known blockers: the v4.7.0 row/control architecture must expose stable interaction hooks
