<!-- managed-by: .github/backlog/issues.json key=p0-disabled-buttons-contrast -->

## Problem

Following the introduction of capability- and state-aware action buttons in v4.6.3, action buttons blocked by current vacuum state (such as the Start button when cleaning, or the Pause/Stop button when docked) are rendered in the disabled state with `opacity: 0.4`.

On certain themes and background images, `opacity: 0.4` on solid glyphs (such as `mdi:play`) causes insufficient contrast, making the button appear completely missing rather than disabled. Users also lack a configuration option to customize the opacity of disabled buttons or adjust it directly in the visual card editor.

## Evidence and upstream references

- Current fork behavior: Hardcoded `opacity: var(--disabled-opacity, 0.4)` on `ha-icon-button[disabled]`.
- User feedback: Start button appears invisible during active cleaning state while Pause button remains faintly visible.
- Home Assistant UI standard: Disabled buttons should remain clearly perceivable as disabled controls.

## Scope

1. Adjust the default disabled action button opacity from `0.4` to `0.55` in card styles.
2. Add top-level `disabled_opacity` configuration support (number between `0.0` and `1.0`) setting `--xvc-disabled-opacity`.
3. Add a slider control for `disabled_opacity` under the **Visibility** panel in the visual card editor (`XiaomiVacuumCardEditor`).
4. Support explicit `show: true` on individual buttons to force 100% visibility while retaining runtime state guards.
5. Document `disabled_opacity` in `README.md`.

## Non-goals

- Altering the underlying state or capability evaluation matrix defined in #33.
- Removing native disabled semantics (`?disabled`, `aria-disabled="true"`, `tabindex="-1"`).

## Proposed behavior

Disabled action buttons render with a default opacity of `0.55`, ensuring clear icon silhouettes across light and dark themes. Users can configure `disabled_opacity: <number>` in YAML (clamped to `0.0`–`1.0`) or adjust the slider in the visual editor's Visibility section to tune opacity to their preferred theme.

## Acceptance criteria

- [ ] Default disabled action button opacity is `0.55`.
- [ ] `disabled_opacity` in card YAML config overrides the default opacity via `--xvc-disabled-opacity`.
- [ ] Visual editor Visibility tab provides a slider for `disabled_opacity` (`min: 0, max: 1, step: 0.05`).
- [ ] `README.md` documents `disabled_opacity`.
- [ ] Unit and browser component tests verify styling, configuration parsing, and editor round-trips.

## Test plan

- [x] Node unit or contract tests for configuration, source resolution, formatting, payloads, or error paths
- [x] Real browser component tests for Lit lifecycle, visible DOM, focus, keyboard, availability, accessibility, or interaction behavior
- [ ] Pinned Home Assistant smoke test: N/A (tested via component layer)
- [ ] Shared sanitized fixtures: N/A
- [ ] Manual verification: Verified in component test suite

Test-layer rationale:

Unit tests verify configuration parsing and clamping of `disabled_opacity`. Playwright component tests verify the computed opacity on rendered disabled buttons and visual editor updates in real Lit DOM.

## Compatibility and migration

- Minimum or targeted Home Assistant version: 2024.x+
- Existing configuration impact: Fully backward-compatible; existing configurations get improved default contrast (0.55).
- Deprecations: None.
- Breaking change: No

## Dependencies

- Blocked by: None
- Blocks: None
- Related epic: #38 (`epic: layered testing architecture and quality gates`)

## Release impact

- Target milestone: v4.6.4 — Action controls UX refinement
- Changelog entry required: Yes
- Documentation update required: Yes
- HACS or release asset impact: None
