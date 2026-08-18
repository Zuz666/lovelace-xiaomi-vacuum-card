# Agent Notes

## Repository Shape

- This repository is a maintained Home Assistant Lovelace custom card (HACS plugin) forked from benct.
- The shipped canonical implementation is the single file `dist/xiaomi-vacuum-card.js`. There is no bundler or build pipeline.
- `hacs.json` declares `"filename": "xiaomi-vacuum-card.js"`, meaning release assets are tied to this distributed filename.
- Development requires Node.js 22.

## Development Commands

- Install dependencies: `npm ci`
- Run all checks: `npm run check` (runs syntax, version, lint, format, and Node tests).
- Run syntax check: `npm run check:syntax` (`node --check dist/xiaomi-vacuum-card.js`).
- Run version check: `npm run check:version` (`node tests/check-version.mjs`, validates `package.json`, `dist/xiaomi-vacuum-card.js`, and `CHANGELOG.md`).
- Run linters: `npm run lint` (runs `eslint .` and `markdownlint-cli2 "**/*.md"`).
- Run JavaScript linter: `npm run lint:js` (`eslint .`).
- Run Markdown linter: `npm run lint:md` (`markdownlint-cli2 "**/*.md"`).
- Check formatting: `npm run format:check` (`prettier --check .`).
- Fix formatting: `npm run format` (`prettier --write .`).
- Run behavior tests: `npm test` (`node --test "tests/**/*.test.mjs"`).
- Run real browser verification: `npm run test:ha-smoke` (requires Docker and Playwright).
- Always verify behavior and ensure tests pass before yielding.

## Testing Boundaries

- Follow `docs/maintainers/testing-strategy.md` for test-layer responsibilities and the required sequence before major runtime work.
- `tests/helpers/card-harness.mjs` is a fast VM contract harness, not a real Lit or DOM environment. Its `requestUpdate()` is a no-op and it does not validate reactive updates, Shadow DOM, focus, keyboard behavior, event propagation, or accessibility.
- Keep pure configuration, source-resolution, formatting, payload, and error-path tests in the Node layer.
- Do not expand the fake harness to emulate browser lifecycle behavior. Use the real browser component layer after its backlog prerequisite is implemented; until then, lifecycle-sensitive changes require targeted HA smoke evidence and must record the missing component regression.
- New integration-shaped test data should move toward the shared sanitized fixture schema rather than accumulating unrelated inline mocks.
- Full HA smoke tests should prove resource and integration boundaries, not duplicate every component scenario.

## Implementation Gotchas

- The card bootstraps Lit from Home Assistant globals: `window.LitElement || Object.getPrototypeOf(customElements.get("hui-masonry-view") || customElements.get("hui-view"))`. Do not add bundler/import assumptions.
- The fan-speed dropdown intentionally uses a dependency-free ARIA combobox (`button`/`listbox`) for modern Home Assistant compatibility, removing the obsolete `mwc-menu`/`mwc-list-item`.
- Edits must remain compatible with direct browser loading as an ES module.

## Workflow & Documentation

- All development happens in the `Zuz666/lovelace-xiaomi-vacuum-card` repository.
- Changes must be done via feature branches and merged into `main` via PRs with passing CI checks. There is no separate `release` branch.
- Pull requests must follow the guidelines in `CONTRIBUTING.md` and populate all sections from `.github/PULL_REQUEST_TEMPLATE.md` (`## Summary`, `## Target`, `## Visual Proof`, `## Test Plan`, `## HACS And Release Impact`, `## AI Disclosure`, `## Checklist`, `## Review`) using `--body-file` or complete multiline text, avoiding single-line placeholders.
- Maintainer leaf issues must use `.github/ISSUE_TEMPLATE/work_item.md`; epics must use `.github/ISSUE_TEMPLATE/epic.md`.
- Follow `docs/maintainers/backlog-governance.md` for priority, type, area, milestones, Project lifecycle, Definition of Ready, Definition of Done, and upstream consolidation rules.
- The initial managed backlog is declared in `.github/backlog/issues.json` with Markdown bodies in `.github/backlog/`. Change managed issue bodies, labels, or milestones through those source files and rerun the manual **Bootstrap backlog** workflow after merge.
- Do not create one issue per historical upstream report. Consolidate related evidence into current canonical issues and distinguish existing fork behavior from proposed work.
- Lifecycle- or interaction-sensitive issues are not Ready without a real browser scenario capable of observing the defect. Compatibility issues are not Ready without sanitized entity evidence and an expected contract.
- Project docs and finalized plans belong in the public `docs/` folder.
- Private notes, scratchpads, and transcripts belong in `/.local/`, which is ignored by Git. Do not commit secrets.
- Every release requires updating `package.json`, `dist/xiaomi-vacuum-card.js`, and `CHANGELOG.md` following Keep a Changelog. See `docs/release-workflow.md` for full release steps.
- Handling automated dependency PRs (Dependabot): ensure all CI checks (`checks`, `ha-smoke`, `validate-hacs`, `CodeQL`) pass. If the PR is behind `main`, rebase via `@dependabot rebase` comment. Merge via squash with Conventional Commits (`chore(deps-dev): ...` or `chore(deps): ...`). Internal tooling updates do not require a changelog entry unless contributor requirements change. See `docs/dependency-workflow.md` for full guidance.
