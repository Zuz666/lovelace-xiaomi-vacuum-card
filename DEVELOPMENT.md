# Development Workflow

This repository is a public Home Assistant Lovelace custom card fork. Keep public
development work separate from local-only automation, notes, and environment
files.

## Repository Roles

- `benct/lovelace-xiaomi-vacuum-card` is the original upstream project. It is
  unsupported, but remains useful as the historical reference for behavior and
  user-facing configuration.
- `3ative/lovelace-xiaomi-vacuum-card` is the active upstream base for focused
  pull requests that should be shared outside this fork.
- `Zuz666/lovelace-xiaomi-vacuum-card` is the public development fork for
  maintained changes, HACS-facing releases, and branch-based collaboration.
- `Zuz666/lovelace-xiaomi-vacuum-card-mydevenv` is a private local-only repo for
  development notes, agent instructions, scratch files, and session records that
  do not belong in public pull requests.

## Branches

- `main` is the integration branch for accepted public work.
- `release` is the stable HACS branch. Changes should reach `release` only after
  they are tested and ready for users to install.
- Use short feature branches with Conventional Commit prefixes, such as
  `feat/card-editor`, `fix/fan-speed-dropdown`, `docs/testing-workflow`,
  `test/ha-smoke`, or `chore/tooling`.

## Upstream Pull Requests

- Create a feature branch in `Zuz666/lovelace-xiaomi-vacuum-card` for public
  development work.
- Keep pull requests to `3ative/lovelace-xiaomi-vacuum-card` focused on one
  behavior or maintenance topic.
- Do not include private local-only files in upstream pull requests.
- After card edits, run a quick syntax check with
  `node --check dist/xiaomi-vacuum-card.js`.
- Before opening a pull request, run `npm run check`.

## Local-Only Files

The public repo ignores local workflow material that is versioned in
`Zuz666/lovelace-xiaomi-vacuum-card-mydevenv` instead:

- `AGENTS.md`
- `/docs/`
- `/tmp/`
- `session-*.md`

If local-only information needs to become public, rewrite it as general project
documentation and add it outside those ignored paths.

## Commit Messages

Use Conventional Commits so history and changelog preparation stay readable.

Examples:

- `fix: support native fan speed dropdown`
- `feat: add card picker metadata`
- `docs: describe development workflow`
- `test: add Home Assistant smoke coverage`
- `chore: update tooling`
