# Specification: Vacuum Activity and Action Capabilities

## Context & Core References

In modern Home Assistant Core ([StateVacuumEntity Documentation](https://developers.home-assistant.io/docs/core/entity/vacuum/)), modern vacuum integrations expose canonical activity in the entity state (`cleaning`, `docked`, `idle`, `paused`, `returning`, `error`, with `on` and `off` supported as legacy compatibility states) rather than in a vendor-specific `attributes.status`.

Furthermore, modern vacuum entities indicate their supported capabilities using the `VacuumEntityFeature` bitmask (`attributes.supported_features`):

- `START = 8192` (`vacuum.start`)
- `PAUSE = 4` (`vacuum.pause`)
- `STOP = 8` (`vacuum.stop`)
- `RETURN_HOME = 16` (`vacuum.return_to_base`)
- `LOCATE = 512` (`vacuum.locate`)
- `CLEAN_SPOT = 1024` (`vacuum.clean_spot`)
- `FAN_SPEED = 32` (`vacuum.set_fan_speed`)

Legacy toggle features (`TURN_ON = 1`, `TURN_OFF = 2`) are deprecated for modern `StateVacuumEntity` and must not be used to infer modern automatic capability.

## Requirements

### 1. Default Status Source and Precedence

The default `status` row (`id: 'status'`, `key: 'status'`, or `key: 'state'`) resolves its value according to the following precedence:

1. **Explicit Entity**: `data.entity` if explicitly configured and present in `hass.states`.
2. **Sensor Entity Prefix**: `${sensorEntity}_${data.key}` if present in `hass.states`.
3. **Explicit Attribute Override**: `vacuumState.attributes[data.attribute]` when `attribute` is explicitly configured (e.g. `attribute: 'status'`). Note that `key: 'status'` alone resolves to canonical entity state rather than an attribute override.
4. **Canonical Vacuum Entity State**: `vacuumState.state` (formatted/localized where available, e.g. "Cleaning", "Docked", "Paused", "Idle", "Returning", "Error").
5. **Legacy Vacuum Attribute `status`**: `vacuumState.attributes.status` when `vacuumState.state` is not available.
6. **Generic Vacuum Property**: `vacuumState[data.key]`.

If a selected entity is in `unavailable` or `unknown` state, it remains selected and renders the localized unavailable/unknown string without flapping to legacy attribute fallbacks.

### 2. Feature Constants & Effective Service Mapping

Automatic capability inference derives the required feature flag directly from the effective service:

| Effective Service       | Required Feature Flag             | Bitmask Value |
| ----------------------- | --------------------------------- | ------------- |
| `vacuum.start`          | `VacuumEntityFeature.START`       | `8192`        |
| `vacuum.pause`          | `VacuumEntityFeature.PAUSE`       | `4`           |
| `vacuum.stop`           | `VacuumEntityFeature.STOP`        | `8`           |
| `vacuum.return_to_base` | `VacuumEntityFeature.RETURN_HOME` | `16`          |
| `vacuum.locate`         | `VacuumEntityFeature.LOCATE`      | `512`         |
| `vacuum.clean_spot`     | `VacuumEntityFeature.CLEAN_SPOT`  | `1024`        |

- Legacy vendor mappings (e.g. Pause button configured to dispatch `vacuum.stop`) evaluate the feature required by the effective service (`STOP = 8`), not the button ID alone.
- Deprecated toggle services (`vacuum.turn_on`, `vacuum.turn_off`) do not map to modern automatic features and are never auto-inferred from `TURN_ON` (1) or `TURN_OFF` (2).
- Custom services without a recognized mapping do not infer undocumented feature requirements.

### 3. Presentation Modes

Each action button evaluates visibility and interactive state based on its `show` configuration:

- **`show: false`**: The button is unconditionally hidden (absent from DOM and accessibility tree).
- **`show: true`**: Explicit visibility. The button is forced visible (feature check is bypassed to support legacy integrations with incomplete feature flags), but runtime state and availability guards still apply.
- **`show: 'auto'` or omitted `show`**: Automatic evaluation based on feature flags and current activity:
  - **Unsupported feature**: The button is hidden (absent from DOM and focus order).
  - **Supported feature but temporarily blocked by entity state**: The button is rendered in the DOM with disabled semantics (`?disabled`, `aria-disabled="true"`, not focusable, non-interactive).
  - **Supported feature and valid state**: The button is rendered enabled and interactive.
- **Legacy Toggle Services (`vacuum.turn_on`, `vacuum.turn_off`)**: Normalized to explicit visibility (`show: true`), preserving existing legacy vendor presets while enforcing runtime availability guards.
- **Custom Buttons**: Default to visible (`show: true`) unless explicitly configured with `show: 'auto'` (for recognized services) or `show: false`.

### 4. Per-Action State & Dispatch Guard Matrix

| Action         | Recognized Effective Service         | Temporarily Blocked States                                            | Presentation in `show: auto`                                                | Pre-Dispatch Guard                                       |
| -------------- | ------------------------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------- |
| Start          | `vacuum.start`                       | `unavailable`, `unknown`, `cleaning`, `on`                            | Hidden if `START` absent; disabled in blocked states; else enabled          | Re-evaluate `START` capability, state, and availability  |
| Pause          | `vacuum.pause`, legacy `vacuum.stop` | `unavailable`, `unknown`, and any state other than `cleaning` or `on` | Hidden if required feature absent; disabled in blocked states; else enabled | Re-evaluate required feature, state, and availability    |
| Stop           | `vacuum.stop`                        | `unavailable`, `unknown`, `docked`, `off`, `idle`                     | Hidden if `STOP` absent; disabled in blocked states; else enabled           | Re-evaluate `STOP` capability, state, and availability   |
| Return to Base | `vacuum.return_to_base`              | `unavailable`, `unknown`, `returning`                                 | Hidden if `RETURN_HOME` absent; disabled in blocked states; else enabled    | Re-evaluate `RETURN_HOME`, state, and availability       |
| Locate         | `vacuum.locate`                      | `unavailable`, `unknown`                                              | Hidden if `LOCATE` absent; disabled in blocked states; else enabled         | Re-evaluate `LOCATE` capability, state, and availability |
| Spot Clean     | `vacuum.clean_spot`                  | `unavailable`, `unknown`                                              | Hidden if `CLEAN_SPOT` absent; disabled in blocked states; else enabled     | Re-evaluate `CLEAN_SPOT`, state, and availability        |

### 5. Independent Dispatch Guards

Before any service call is dispatched:

1. Re-verify that `this.stateObj` exists and its state is not `unavailable` or `unknown`.
2. For automatic actions, re-evaluate that `supported_features` still contains the required feature bit.
3. Re-evaluate that the current activity state does not match the blocked state conditions.
4. If any check fails, suppress the service dispatch and do not call `_hass.callService`.

## Verification Plan

1. **Unit Tests (`tests/card-vacuum-activity.test.mjs`)**:
   - Precedence of status row (`stateObj.state` vs `attributes.status` fallback vs explicit entities).
   - Mapping of effective services to modern feature bitmasks.
   - Negative tests proving `vacuum.turn_on` / `vacuum.turn_off` do not auto-infer `TURN_ON` / `TURN_OFF`.
   - Table-driven tests for every action and blocked-state combination.
   - Precedence and behavior for `show: false`, `show: auto`, `show: true`, and custom buttons.
   - Dispatch guards blocking service calls when state changes between render and click.
2. **Component Tests (`tests/component/vacuum-activity-actions.spec.mjs`)**:
   - Real Lit DOM presence (hidden actions absent from DOM).
   - Native disabled attributes and semantics on `<ha-icon-button>` for state-blocked actions.
   - Prevention of pointer, keyboard, or programmatic service dispatch for disabled actions.
   - Live activity transitions (e.g. `docked` -> `cleaning` -> `paused` -> `returning`) updating button enablement and visibility.
3. **Regression & Smoke Verification**:
   - Reproduction test for upstream issue #123 (`docked` vacuum without `attributes.status`).
   - Run full check suite (`npm run check` and `npm run test:component`).
