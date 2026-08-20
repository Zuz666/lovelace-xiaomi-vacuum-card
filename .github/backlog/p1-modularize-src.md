<!-- managed-by: .github/backlog/issues.json key=p1-modularize-src -->

## Problem

`src/xiaomi-vacuum-card.js` is a monolithic file (>2300 lines) combining constants, LitElement CSS styles, service dispatch logic, template subscriptions, Device Registry discovery, the visual card editor (`XiaomiVacuumCardEditor`), and the main card class (`XiaomiVacuumCard`).

This monolithic structure creates high coupling and makes upcoming feature work in Milestone `v4.7.0 — Entity-aware rows and controls` (such as entity-aware rows and custom controls) harder to review, test in isolation, and maintain without risk of unintended side effects.

## Evidence and upstream references

- Current fork behavior: Monolithic `src/xiaomi-vacuum-card.js` compiled via `esbuild` to `dist/xiaomi-vacuum-card.js`.
- Architecture plan: `.local/docs/plans/build-pipeline-and-src-migration.md` (Step 3: Modularization of `src/`).
- Code review: CodeRabbit instructions in `.coderabbit.yaml` target `src/**` domain paths.

## Scope

1. Decompose `src/xiaomi-vacuum-card.js` into focused, single-responsibility modules:
   - `src/constants.js`: Vendor presets, `VacuumEntityFeature` bitmasks, action and service mappings.
   - `src/styles.js`: LitElement CSS style definitions (`cardStyles`, `editorStyles`).
   - `src/actions.js`: Capability evaluation, button state and presentation logic, pre-dispatch guards, service dispatchers (`callActionButton`, `callService`, `renderTemplateOnce`).
   - `src/registry.js`: Device registry discovery, adapter interfaces, candidate evaluation, and sanitized diagnostics.
   - `src/editor.js`: The visual Lovelace editor class `XiaomiVacuumCardEditor`.
   - `src/card.js`: The main card element class `XiaomiVacuumCard`.
   - `src/xiaomi-vacuum-card.js`: Entry point registering custom elements and Lovelace metadata.
2. Maintain clean ES module import/export semantics across modules.
3. Preserve the Home Assistant globals LitElement bootstrap (`window.LitElement || ...`) and zero runtime npm dependencies.
4. Ensure `scripts/build.mjs` bundles all modules seamlessly into `dist/xiaomi-vacuum-card.js`.

## Non-goals

- Changing any card runtime behavior, UI layout, or configuration schema.
- Introducing npm runtime dependencies.
- Modifying test assertions (all tests must pass unchanged).

## Proposed behavior

Internal source code is organized into maintainable domain modules. The resulting bundled release artifact `dist/xiaomi-vacuum-card.js` is functionally and behaviorally identical to the pre-refactoring bundle.

## Acceptance criteria

- [ ] `src/` is decomposed into modular files (`constants.js`, `styles.js`, `actions.js`, `registry.js`, `editor.js`, `card.js`, and `xiaomi-vacuum-card.js`).
- [ ] `npm run check:build` succeeds with zero drift in `dist/xiaomi-vacuum-card.js`.
- [ ] All 94 Node unit and contract tests pass without modification.
- [ ] All 27 Playwright browser component tests pass without modification.
- [ ] Code syntax and linting checks pass cleanly (`npm run lint`, `node --check`).
- [ ] Browser loading and custom element registration in Home Assistant remains 100% functional.

## Test plan

- [x] Node unit or contract tests for configuration, source resolution, formatting, payloads, or error paths
- [x] Real browser component tests for Lit lifecycle, visible DOM, focus, keyboard, availability, accessibility, or interaction behavior
- [x] Pinned Home Assistant smoke test for resource loading, editor or registry integration, service, WebSocket, or other HA boundaries
- [ ] Shared sanitized fixtures for affected integrations, entity shapes, feature flags, or expected controls: N/A (fixture matrix is introduced in #36)
- [ ] Manual browser or Companion App verification: N/A (covered by automated Playwright and HA smoke suites)

Test-layer rationale:

Because this is a pure structural refactoring with zero intended behavioral changes, passing the full test suite across Node contracts, browser component tests, and Home Assistant smoke tests proves that no functionality was broken or altered.

## Compatibility and migration

- Minimum or targeted Home Assistant version: 2024.x, 2025.x, 2026.x
- Existing configuration impact: None.
- Deprecations: None.
- Breaking change: No

## Dependencies

- Blocked by: Release v4.6.3
- Blocks: #37 (entity-aware row model and migration strategy)
- Related epic: #40 (`epic: entity-aware rows and controls`)

## Release impact

- Target milestone: v4.7.0 — Entity-aware rows and controls
- Changelog entry required: No (internal maintainer refactoring)
- Documentation update required: No
- HACS or release asset impact: None (`dist/xiaomi-vacuum-card.js` remains the release asset)
