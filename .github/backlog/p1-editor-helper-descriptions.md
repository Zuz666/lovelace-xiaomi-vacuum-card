<!-- managed-by: .github/backlog/issues.json key=p1-editor-helper-descriptions -->

## Problem

While the Visual Card Editor (`XiaomiVacuumCardEditor`) provides structured expansion panels for Basic, Visibility, State, Attributes, and Buttons configurations, many fields only display their raw YAML key names without contextual explanations or guidance.

New and existing users configuring the card visually benefit from concise helper descriptions rendered beneath form inputs via Home Assistant's `computeHelper` API to explain options without cluttering field labels or deviating from YAML schema naming.

## Evidence and upstream references

- Current fork behavior: Helper text enabled via `computeHelper` for Visibility options in v4.6.4. Other sections (Basic, State, Attributes, Buttons, Service Data) lack dedicated helper text.
- Home Assistant UI standard: Standard Lovelace card editors provide `helper` text beneath complex selectors.

## Scope

1. Add descriptive `helper` text to fields across all remaining Visual Editor panels (Visibility panel helpers are already implemented in v4.6.4 and retained):
   - **Basic panel**: `entity` (filter guidance), `name` (override vs friendly name), `vendor` (preset effects), `image` (supported formats and media URIs).
   - **State and Attribute rows**: `show`, `key` (attribute resolution), `entity` (external sensor binding), `icon`, `label`, `unit`.
   - **Buttons panel**: `show`, `icon`, `label` (tooltip and accessibility), `service`, `service_data_mode`, `service_data`, `service_data_template` (Jinja2 template syntax guidance).
2. Ensure all helper texts render consistently through `.computeHelper` in `<ha-form>`.
3. Retain exact 1:1 matching between form field `name` and YAML configuration keys without hardcoding conversational `label` strings.

## Non-goals

- Altering the underlying YAML schema or runtime card behavior.
- Modifying custom card registration metadata.

## Proposed behavior

When editing the card in the Lovelace visual editor, form fields display their exact YAML key name alongside clear, concise helper text rendered beneath each input element.

## Acceptance criteria

- [x] All inputs in Basic, State, Attributes, and Buttons editor panels have contextual `helper` text.
- [x] Field names remain strictly identical to their YAML configuration keys.
- [x] Editor model serialization and event dispatch continue to function without regressions.
- [x] Browser component tests verify `computeHelper` output in the rendered editor DOM.

## Test plan

- [x] Node unit or contract tests: Verify editor schema definitions and `computeHelper` resolution.
- [x] Real browser component tests: Verify helper text rendering under form inputs in Playwright component tests.
- [ ] Pinned Home Assistant smoke test: N/A
- [ ] Shared sanitized fixtures: N/A
- [x] Manual browser or Companion App verification: Verify visual rendering across desktop and mobile browsers

Test-layer rationale:

Unit tests verify that editor schema definitions include valid `helper` strings and `computeHelper` extracts them correctly. Browser component tests verify that `ha-form` renders helper elements in real DOM.

## Compatibility and migration

- Minimum or targeted Home Assistant version: 2024.x+
- Existing configuration impact: None.
- Deprecations: None.
- Breaking change: No

## Dependencies

- Blocked by: None
- Blocks: None
- Related epic: {{issue:epic-entity-aware-rows}}

## Release impact

- Target milestone: v4.7.0 — Entity-aware rows and controls
- Changelog entry required: Yes
- Documentation update required: No
- HACS or release asset impact: None
