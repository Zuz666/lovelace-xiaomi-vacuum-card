# Contributing

Thanks for improving this maintained Xiaomi Vacuum Card fork. Keep changes small,
public, and easy to review.

## Before Opening A Pull Request

- Run `npm run check` and fix any failures before submitting.
- For UI-sensitive changes, run the Home Assistant smoke test or complete an
  equivalent manual Home Assistant browser test.
- Use Conventional Commits, for example `fix: handle unavailable fan speed` or
  `docs: clarify smoke testing`.

## Scope

Do not include local-only workflow files in public pull requests:

- `AGENTS.md`
- `/docs/`
- `/tmp/`
- `session-*.md`

Those files are ignored here and belong in the private local development
environment instead.

## Card Architecture

`dist/xiaomi-vacuum-card.js` is the shipped Home Assistant/HACS browser resource.
It is loaded directly by Home Assistant as a JavaScript module. Do not add
bundler, package-build, or import assumptions unless the project intentionally
adopts that architecture in a dedicated change.
