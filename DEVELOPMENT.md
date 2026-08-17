# Development Workflow

This repository is a maintained Home Assistant Lovelace custom card (HACS plugin) forked from benct.

## Repository Roles

- `Zuz666/lovelace-xiaomi-vacuum-card` is the canonical mainline repository for ongoing development and HACS-facing releases.
- `benct/lovelace-xiaomi-vacuum-card` is the historical upstream. It is unmaintained but remains useful as the reference for legacy configurations.

## Branches

- `main` is the primary and only persistent branch. It serves as both the integration branch and the release source.
- Do not use a separate `release` branch.
- Use short feature branches (e.g., `feat/card-editor`, `fix/fan-speed-dropdown`, `chore/tooling`) for all work.

## Pull Requests

- Open feature PRs targeting the `main` branch of `Zuz666/lovelace-xiaomi-vacuum-card`.
- Run all checks via `npm run check` and ensure `npm run test:ha-smoke` passes before opening a PR.

## Local-Only Files

Private workspace data is ignored by Git in the `/.local/` directory.

- `/.local/` is for agent notes, scratchpads, transcripts, and backups.
- Do not commit credentials or local-only session files.

If local information becomes relevant to the public project, document it in the `docs/` folder.

## Commit Messages

Use Conventional Commits so history and changelogs remain readable.

Examples:

- `fix: resolve modern vacuum battery sensors`
- `feat: support dynamic service data`
- `docs: define mainline workflow`
- `test: add ha-smoke coverage`
- `chore: update tooling`
