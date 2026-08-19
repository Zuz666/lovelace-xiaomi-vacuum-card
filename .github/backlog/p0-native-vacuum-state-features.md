<!-- markdownlint-disable MD034 -->

## Problem

The default status row reads the legacy `status` attribute, while modern Home Assistant `StateVacuumEntity` integrations expose the canonical activity in the entity state (`cleaning`, `docked`, `idle`, `paused`, `returning`, or `error`). This can render `Unavailable` for otherwise valid vacuum entities.

Default action buttons are also rendered from static card and vendor presets without consistently evaluating `supported_features` and the current activity. The card can therefore offer actions that the entity does not support or that are not meaningful in its current state.

## Evidence and upstream references

- Upstream issue(s): https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/78, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/123
- Upstream pull request(s): N/A
- Home Assistant change or documentation: https://developers.home-assistant.io/docs/core/entity/vacuum/ and https://github.com/home-assistant/frontend/blob/dev/src/data/vacuum.ts
- Current fork behavior: the default status row uses `key: status`; default action availability is primarily configuration-driven.
- Reproduction, fixture, or diagnostic evidence: use a modern vacuum entity whose state is `docked` and which has no `attributes.status`; the default status row renders unavailable until manually remapped to `key: state`.

## Scope

- Resolve the default status from the main vacuum entity state.
- Preserve `attributes.status` as a legacy fallback where useful.
- Introduce automatic action availability based on modern `StateVacuumEntity` feature flags, the effective service mapping, and current vacuum activity.
- Apply one deterministic hidden-versus-disabled policy for Start, Pause, Stop, Return to Base, Locate, and Spot Clean.
- Preserve explicit user overrides and legacy vendor service mappings without treating deprecated toggle features as modern automatic capabilities.
- Guard service dispatch independently from visual presentation.
- Add regression fixtures for modern and legacy entity shapes.

## Non-goals

- Replacing button configuration with the full Lovelace action model.
- Adding room or area cleaning controls.
- Adding new vendor presets.
- Inferring undocumented capabilities from manufacturer names.
- Applying feature inference to arbitrary custom services without an explicit configuration contract.

## Proposed behavior

### Status source

The default `status` row displays the localized or formatted main state of the configured `vacuum.*` entity. If a legacy integration provides a meaningful `attributes.status`, it may be used only as a documented fallback or explicit override.

### Presentation modes

Built-in button definitions normalize presentation as follows:

- omitted `show` or `show: auto`: use capability and state evaluation;
- `show: false`: always hidden;
- `show: true`: force the button visible for legacy integrations whose feature flags are incomplete, while retaining state and unavailable dispatch guards.

Custom buttons remain visible by default for backward compatibility. A custom button may opt into `show: auto` only when its service is recognized by the mapping below or when a future explicit feature requirement is configured.

Automatic presentation follows one rule:

- unsupported capability: hide the action entirely;
- supported capability but temporarily blocked by entity state: render the action disabled;
- supported and currently valid: render the action enabled.

A hidden action is absent from the DOM and focus order. A disabled action remains visible, exposes native disabled semantics, is not keyboard-focusable, and cannot dispatch a service through pointer, keyboard, or programmatic event paths.

### Effective service-to-feature mapping

Automatic capability inference uses only services and feature flags supported by modern Home Assistant `StateVacuumEntity`:

| Effective service       | Required feature |
| ----------------------- | ---------------- |
| `vacuum.start`          | `START`          |
| `vacuum.pause`          | `PAUSE`          |
| `vacuum.stop`           | `STOP`           |
| `vacuum.return_to_base` | `RETURN_HOME`    |
| `vacuum.locate`         | `LOCATE`         |
| `vacuum.clean_spot`     | `CLEAN_SPOT`     |

A legacy vendor mapping such as a Pause button using `vacuum.stop` evaluates the `STOP` feature required by the effective service, not only the semantic button ID. An unrecognized service cannot be auto-inferred and requires explicit visibility or a future explicit feature contract.

### Legacy toggle-service compatibility

Home Assistant still exposes deprecated `TURN_ON` and `TURN_OFF` feature constants for legacy entities, but they are not supported by modern `StateVacuumEntity`. The card must therefore not infer modern automatic capability from `vacuum.turn_on`, `vacuum.turn_off`, `TURN_ON`, or `TURN_OFF`.

Existing vendor or user configuration that explicitly maps a button to `vacuum.turn_on` or `vacuum.turn_off` remains accepted as a legacy custom-service path. Compatibility normalization treats that mapping as explicit visibility rather than `show: auto`; state and entity-availability guards still apply. A future configuration may introduce an explicit custom-service capability requirement, but it must not silently reuse deprecated modern feature inference.

### Per-action automatic policy

| Action         | Recognized automatic service(s)      | Temporarily blocked states                                              | Auto presentation                                                            | Dispatch guard                                                    |
| -------------- | ------------------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Start          | `vacuum.start`                       | `unavailable`, `unknown`, `cleaning`, `on`                              | Hidden when `START` is absent; otherwise disabled in blocked states          | Recheck `START` and state immediately before dispatch             |
| Pause          | `vacuum.pause`, legacy `vacuum.stop` | `unavailable`, `unknown`, and every state other than `cleaning` or `on` | Hidden when required feature is absent; otherwise disabled in blocked states | Recheck required feature and state immediately before dispatch    |
| Stop           | `vacuum.stop`                        | `unavailable`, `unknown`, `docked`, `off`, `idle`                       | Hidden when `STOP` is absent; otherwise disabled in blocked states           | Recheck `STOP` and state immediately before dispatch              |
| Return to Base | `vacuum.return_to_base`              | `unavailable`, `unknown`, `returning`                                   | Hidden when `RETURN_HOME` is absent; otherwise disabled in blocked states    | Recheck `RETURN_HOME` and state immediately before dispatch       |
| Locate         | `vacuum.locate`                      | `unavailable`, `unknown`                                                | Hidden when `LOCATE` is absent; otherwise disabled in blocked states         | Recheck `LOCATE` and availability immediately before dispatch     |
| Spot Clean     | `vacuum.clean_spot`                  | `unavailable`, `unknown`                                                | Hidden when `CLEAN_SPOT` is absent; otherwise disabled in blocked states     | Recheck `CLEAN_SPOT` and availability immediately before dispatch |

For `show: true`, the required-feature check is bypassed to preserve legacy integrations, but the state and entity-availability guard remains mandatory. For `show: false`, no action is rendered or dispatched.

## Acceptance criteria

- [x] The default status row renders the main vacuum state without requiring `key: state`.
- [x] A legacy `attributes.status` source remains available through documented fallback or explicit configuration.
- [x] Each modern automatic built-in action derives its feature requirement from the defined service mapping.
- [x] `vacuum.turn_on`, `vacuum.turn_off`, `TURN_ON`, and `TURN_OFF` are not used for modern automatic capability inference.
- [x] Existing explicit legacy toggle-service mappings remain usable through documented explicit-visibility compatibility behavior.
- [x] In `show: auto` or omitted `show`, unsupported actions are hidden and supported but state-blocked actions are disabled.
- [x] Hidden actions are absent from the focus order and disabled actions expose native disabled semantics.
- [x] For automatic actions, the handler re-evaluates capability; for all modes, it re-evaluates state and availability before dispatch.
- [x] Pointer, keyboard, or programmatic activation of a disabled automatic action never calls a Home Assistant service.
- [x] `show: false`, `show: auto`, and `show: true` follow the documented precedence.
- [x] Explicit visibility preserves legacy integrations with incomplete feature flags without bypassing unavailable-state safety.
- [x] Custom services are not silently assigned an undocumented feature requirement.
- [x] Fixtures cover modern Roborock-like, Eufy/robovac-like, legacy attribute-based, incomplete-feature, and vendor-service-remapping entity shapes.

## Test plan

- [x] Unit tests for status source precedence
- [x] Unit tests for every modern service-to-feature mapping
- [x] Negative tests proving deprecated toggle services are not auto-inferred
- [x] Compatibility tests for explicit `vacuum.turn_on` and `vacuum.turn_off` mappings
- [x] Table-driven unit tests for every action and blocked-state combination
- [x] Tests for `show: false`, `show: auto`, `show: true`, and custom-button compatibility
- [x] Service-dispatch guard tests that mutate state between render and activation
- [x] Real browser component tests for hidden DOM, disabled semantics, focus order, keyboard activation, and pointer activation
- [x] Regression test for upstream issue #123 behavior
- [x] Targeted Home Assistant smoke test for representative enabled, disabled, and hidden actions
- [x] Existing contract, component, lint, formatting, and smoke suites pass

## Compatibility and migration

- Minimum or targeted Home Assistant version: all currently supported versions, optimized for modern `StateVacuumEntity`
- Existing configuration impact: default status becomes correct for modern entities; explicit visibility and legacy vendor service mappings remain supported
- Deprecations: possible future de-emphasis of implicit legacy `attributes.status`; deprecated toggle features are no longer treated as modern automatic capability flags
- Breaking change: Potential presentation change because unsupported automatic built-in actions become hidden and temporarily invalid supported actions become disabled

## Dependencies

- Blocked by: {{issue:p0-real-lit-component-tests}}
- Blocks: standard Lovelace action support; native area-cleaning controls
- Related epics: {{issue:epic-modern-ha-entities}} and {{issue:epic-testing-architecture}}

## Release impact

- Target milestone: v4.6.3 — Runtime correctness
- Changelog entry required: Yes
- Documentation update required: Yes, document status precedence, presentation modes, modern feature mapping, legacy toggle-service compatibility, and the action matrix
- HACS or release asset impact: canonical `dist/xiaomi-vacuum-card.js` changes; asset name remains unchanged
