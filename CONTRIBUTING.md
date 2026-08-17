# Contributing

Thanks for improving this maintained Xiaomi Vacuum Card fork. Keep changes small,
public, and easy to review.

## Before Opening A Pull Request

- Run `npm run check` and fix any failures before submitting.
- For UI-sensitive changes, run the Home Assistant smoke test (`npm run test:ha-smoke`) or complete an equivalent manual Home Assistant browser test.
- Use Conventional Commits, for example `fix: handle unavailable fan speed` or `docs: clarify smoke testing`.

## Pull Request Guidelines

Every pull request must use and completely fill out all sections from `.github/PULL_REQUEST_TEMPLATE.md`:

### 1. Summary (`## Summary`)

- Clearly describe what changed and the motivation behind the change.

### 2. Target (`## Target`)

- Specify the relevant Home Assistant versions tested or targeted.
- Provide the base card version or target commit SHA.
- List all affected card features (e.g., battery rendering, service call handling, visual editor).

### 3. Visual Proof (`## Visual Proof`)

- **Required for UI / behavior changes**: Attach BEFORE and AFTER screenshots or screen recordings that can be easily compared. Use videos for interaction, animation, or state transition changes.
- **Non-UI changes**: If there is truly no visual or interaction change (e.g., CI workflows, documentation, internal refactoring), write exactly `N/A` followed by a concise explanation why.
- **Attachment rules**: Never commit image/video assets directly into git repository files. Use GitHub's web interface drag-and-drop or the `gh image` extension to attach media to the pull request description.

### 4. Test Plan (`## Test Plan`)

- Mark all verified test and check steps (e.g., `npm run check`, `npm run test:ha-smoke`, `node --check dist/xiaomi-vacuum-card.js`).

### 5. HACS And Release Impact (`## HACS And Release Impact`)

- Detail any HACS resource impacts (note that `dist/xiaomi-vacuum-card.js` is the canonical asset).
- Specify whether release notes are needed and what text should be included.
- State whether the pull request introduces breaking changes.

### 6. AI Disclosure (`## AI Disclosure`)

- **External contributors**: Disclose if AI models or AI coding tools were used during development, specifying the model and details.
- **StablyAI team members (internal contributors)**: Do not fill in; this section is ignored for internal team contributions.

### 7. Checklist (`## Checklist`)

- Verify that Conventional Commits are used, browser ES module compatibility is maintained, and tests/docs are updated.

### 8. Review (`## Review`)

- Include notes for reviewers, self-review highlights, or specific areas needing closer inspection.

Do not use single-line placeholders or empty stubs in `--body`. Use `--body-file` or a full multiline description when submitting pull requests with the `gh` CLI.

## Scope

- Private notes, scratchpads, and transcripts belong in `/.local/` (which is ignored by Git).
- Public architectural decisions and finalized plans belong in `/docs/`.

## Card Architecture

`dist/xiaomi-vacuum-card.js` is the shipped Home Assistant/HACS browser resource.
It is loaded directly by Home Assistant as a JavaScript module. Do not add
bundler, package-build, or import assumptions.
