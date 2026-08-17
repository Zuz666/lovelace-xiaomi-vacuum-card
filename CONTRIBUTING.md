# Contributing

Thanks for improving this maintained Xiaomi Vacuum Card fork. Keep changes small,
public, and easy to review.

## Before Opening A Pull Request

- Run `npm run check` and fix any failures before submitting.
- For UI-sensitive changes, run the Home Assistant smoke test (`npm run test:ha-smoke`) or complete an equivalent manual Home Assistant browser test.
- Use Conventional Commits, for example `fix: handle unavailable fan speed` or `docs: clarify smoke testing`.

## Scope

- Private notes, scratchpads, and transcripts belong in `/.local/` (which is ignored by Git).
- Public architectural decisions and finalized plans belong in `/docs/`.

## Card Architecture

`dist/xiaomi-vacuum-card.js` is the shipped Home Assistant/HACS browser resource.
It is loaded directly by Home Assistant as a JavaScript module. Do not add
bundler, package-build, or import assumptions.
