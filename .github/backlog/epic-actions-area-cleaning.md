## Outcome

Users can configure standard Home Assistant Lovelace interactions and launch room or area cleaning from a responsive action layout without relying on a large map or vendor-specific button rows as the primary path.

## Why this matters

Historical requests for custom services, confirmation, `fire-dom-event`, room buttons, and second button rows describe one broader need: a standard interaction model and a layout that remains usable as actions grow. Home Assistant now provides standard Lovelace actions and native vacuum area-cleaning capabilities that should be preferred over ad hoc card-only contracts.

## Scope

- standard Lovelace `tap_action`, `hold_action`, and `double_tap_action` support for buttons, rows, and appropriate card surfaces;
- `more-info`, perform-action, navigation, URL, assist, none, target/data, and confirmation behavior;
- optional compatibility adapter for `fire-dom-event` after the standard model is complete;
- responsive action grid or wrapping layout;
- native `vacuum.clean_area` controls when supported;
- documented vendor-command fallback where native area cleaning is unavailable;
- conditions and active-state styling for rows and actions.

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

## Exit criteria

- [ ] Supported interactions follow Home Assistant Lovelace action semantics.
- [ ] Confirmation and unavailable states suppress unsafe dispatches.
- [ ] Five or more actions remain usable on narrow and Sections dashboards.
- [ ] Native area cleaning is capability-aware and integration-neutral.
- [ ] Vendor fallback behavior is explicit, tested, and optional.
- [ ] Mouse, touch, and keyboard behavior is accessible.
- [ ] Unit and Home Assistant smoke suites pass.
- [ ] README examples cover standard actions and area cleaning.

## Upstream and Home Assistant references

- Upstream issues: https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/50, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/51, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/57, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/64, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/73, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/94, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/112, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/113, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/120
- Home Assistant references: https://www.home-assistant.io/dashboards/actions/ and https://www.home-assistant.io/integrations/vacuum/

## Release plan

- Target milestone: v4.8.0 — Actions and area cleaning
- Critical path: entity-aware control interfaces → standard actions → responsive area controls → conditions and active state
- Known blockers: the v4.7.0 row/control architecture must expose stable interaction hooks
