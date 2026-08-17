# Agent Notes

## Repository Shape

- This repo is a HACS-distributed Home Assistant Lovelace custom card fork, not a Node package: there is no `package.json`, lockfile, build script, test runner, formatter, or CI config in the current tree.
- The shipped implementation is the single file `dist/xiaomi-vacuum-card.js`; do not look for separate source files unless they are added later.
- `hacs.json` declares `"filename": "xiaomi-vacuum-card.js"`, so release/download expectations are tied to that distributed filename.

## Development Commands

- Syntax-check the card after edits with `node --check dist/xiaomi-vacuum-card.js`.
- There is no repo-configured lint/test/build command to run; if one is added, prefer it over ad hoc checks and update this file.

## Implementation Gotchas

- The card bootstraps Lit from Home Assistant globals: `window.LitElement || Object.getPrototypeOf(customElements.get("hui-masonry-view") || customElements.get("hui-view"))`. Avoid adding bundler/import assumptions unless the repo gains a build pipeline.
- The fork’s verified purpose is compatibility with modern Home Assistant: the fan-speed dropdown intentionally uses native `<select>` instead of removed `mwc-menu` / `mwc-list-item` components.
- Keep edits compatible with direct browser loading as a JavaScript module/resource from Home Assistant/HACS; dependencies cannot be installed by this repo as currently structured.

## Docs

- `README.md` only documents installation and points configuration options to the upstream project; verify behavior in `dist/xiaomi-vacuum-card.js` before relying on upstream prose.
