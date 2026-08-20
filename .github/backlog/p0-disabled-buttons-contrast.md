<!-- managed-by: .github/backlog/issues.json key=p0-disabled-buttons-contrast -->

## Problem

Following the introduction of capability- and state-aware action buttons in v4.6.3, action buttons blocked by current vacuum state (such as the Start button when cleaning, or the Pause/Stop button when docked) are rendered in the disabled state with `opacity: 0.4`.

On certain themes and background images, `opacity: 0.4` on solid glyphs (such as `mdi:play`) causes insufficient contrast, making the button appear completely missing rather than disabled. Users also lack a configuration option to customize the opacity of disabled buttons or adjust it directly in the visual card editor.

## Evidence and upstream references

- Current fork behavior: Hardcoded `opacity: var(--disabled-opacity, 0.4)` on `ha-icon-button[disabled]`.
- User feedback: Start button appears invisible during active cleaning state while Pause button remains faintly visible.
- Home Assistant UI standard: Disabled buttons should remain clearly perceivable as disabled controls.

## Scope

1. Adopt Material Design 3 disabled button opacity `0.38` on `ha-icon-button[disabled]` with SVG-level drop-shadows for high icon contrast across light and dark backgrounds.
2. Implement non-linear bottom scrim gradient overlay (`scrim: auto | true | false`) protecting button contrast over background images.
3. Provide three-way `buttons_mode` selector (`adaptive`, `compact`, `always_active`) with backward compatibility for `buttons_state_aware` / `state_aware_buttons`.
4. Add `buttons_disabled_opacity` configuration support (number clamped between `0.0` and `1.0`) setting `--xvc-disabled-opacity`, with backward compatibility for `disabled_opacity`.
5. Expose `scrim`, `buttons_mode`, and `buttons_disabled_opacity` under the **Visibility** panel in the visual card editor (`XiaomiVacuumCardEditor`).
6. Document `buttons_mode`, `scrim`, `buttons_disabled_opacity`, and `disabled_opacity` in `README.md` and specifications.

## Non-goals

- Altering the underlying state or capability evaluation matrix defined in #33.
- Removing native disabled semantics (`disabled`, `aria-disabled="true"`, `tabindex="-1"`).

## Proposed behavior

Disabled action buttons render with a Material Design 3 default opacity of `0.38` with SVG glyph drop-shadows and an automatic bottom scrim gradient over background images, ensuring clear icon silhouettes across all background photos. Users can select between `adaptive` (disable invalid actions), `compact` (dynamically hide invalid actions), or `always_active` (legacy mode), and configure `buttons_disabled_opacity: <number>` in YAML or the visual editor.

## Acceptance criteria

- [ ] Default disabled action button opacity is `0.38` with SVG glyph drop-shadows and bottom scrim overlay.
- [ ] `buttons_mode` selector supports `adaptive`, `compact`, and `always_active`.
- [ ] `buttons_disabled_opacity` in card YAML config overrides default opacity via `--xvc-disabled-opacity`.
- [ ] Visual editor Visibility tab provides controls for `scrim`, `buttons_mode`, and `buttons_disabled_opacity`.
- [ ] `README.md` documents `buttons_mode`, `scrim`, and `buttons_disabled_opacity`.
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
- Existing configuration impact: Fully backward-compatible; existing configurations get improved default contrast (0.38).
- Deprecations: None.
- Breaking change: No

## Dependencies

- Blocked by: None
- Blocks: None
- Related epic: {{issue:epic-entity-aware-rows}}

## Release impact

- Target milestone: v4.6.4 — Action controls UX refinement
- Changelog entry required: Yes
- Documentation update required: Yes
- HACS or release asset impact: None
