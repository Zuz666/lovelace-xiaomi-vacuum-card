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
- Run version check: `npm run check:version` (`node tests/check-version.mjs`).
- Run linter: `npm run lint` (`eslint .`).
- Check formatting: `npm run format:check` (`prettier --check .`).
- Fix formatting: `npm run format` (`prettier --write .`).
- Run behavior tests: `npm test` (`node --test "tests/**/*.test.mjs"`).
- Run real browser verification: `npm run test:ha-smoke` (requires Docker and Playwright).
- Always verify behavior and ensure tests pass before yielding.

## Implementation Gotchas

- The card bootstraps Lit from Home Assistant globals: `window.LitElement || Object.getPrototypeOf(customElements.get("hui-masonry-view") || customElements.get("hui-view"))`. Do not add bundler/import assumptions.
- The fan-speed dropdown intentionally uses a dependency-free ARIA combobox (`button`/`listbox`) for modern Home Assistant compatibility, removing the obsolete `mwc-menu`/`mwc-list-item`.
- Edits must remain compatible with direct browser loading as an ES module.

## Workflow & Documentation

- All development happens in the `Zuz666/lovelace-xiaomi-vacuum-card` repository.
- Changes must be done via feature branches and merged into `main` via PRs with passing CI checks. There is no separate `release` branch.
- Project docs and finalized plans belong in the public `docs/` folder.
- Private notes, scratchpads, and transcripts belong in `/.local/`, which is ignored by Git. Do not commit secrets.

### Pull Request Requirements

- When opening pull requests via `gh pr create` or editing pull requests via `gh pr edit`, always populate all required sections from `.github/PULL_REQUEST_TEMPLATE.md` (`# Summary`, `# Target`, `# Test Plan`, `# HACS And Release Impact`, `# Checklist`).
- Single-line stubs or placeholders in `--body` are strictly prohibited. Pass the body using a prepared file (`--body-file`) or a complete multiline string matching the template.
