# Contributing to Xiaomi Vacuum Card Reborn

Thank you for contributing to this maintained Home Assistant Lovelace custom card (HACS plugin). Keep changes small, public, and easy to review.

## Repository Roles

- **`Zuz666/lovelace-xiaomi-vacuum-card`** is the canonical mainline repository for ongoing development and HACS-facing releases.
- **`benct/lovelace-xiaomi-vacuum-card`** is the historical upstream repository. It is unmaintained but serves as a reference for legacy configurations.

## Branching Model

- `main` is the primary and only persistent branch. It serves as both the integration branch and the release source.
- Do not use a separate `release` branch.
- Use short, descriptive feature branches (e.g., `feat/card-editor`, `fix/fan-speed-dropdown`, `docs/contributing-update`, `chore/tooling`) for all work.

## Development & Testing Workflow

1. **Install dependencies**:

   ```bash
   npm ci
   ```

2. **Run validation suite**:

   ```bash
   npm run check
   ```

   This runs JavaScript syntax checks, version synchronization, ESLint, markdownlint, Prettier formatting checks, and Node.js behavior tests.

3. **Browser & UI smoke verification**:
   For changes affecting card appearance, user interaction, or Home Assistant integration:

   ```bash
   npm run test:ha-smoke
   ```

   Requires Docker and Playwright.

The current commands are documented in [TESTING.md](TESTING.md). Test-layer responsibilities, known limitations, and the required improvements before major runtime development are defined in [docs/maintainers/testing-strategy.md](docs/maintainers/testing-strategy.md).

### Choose the test layer by risk

- Use Node contract tests for configuration, source precedence, formatting helpers, payloads, template handling, and error paths.
- The current VM harness is not a real Lit or DOM environment. It does not prove reactive updates, Shadow DOM, focus, keyboard behavior, event propagation, or accessibility.
- Do not expand the fake harness to emulate browser lifecycle behavior. Lifecycle and interaction changes require real browser evidence.
- A fast real-browser component layer is tracked in the canonical backlog. After it is merged, use it for Lit updates, visible DOM, focus, keyboard, availability, accessibility, and render-count regressions.
- Use the full Home Assistant smoke test for resource loading, editor or registry integration, service and WebSocket boundaries, and other behavior that truly requires HA.
- New compatibility claims require sanitized entity fixtures and expected behavior, not only a manufacturer name or one screenshot.

Until the component layer is available, lifecycle-sensitive pull requests must include targeted HA smoke coverage and explicitly identify the missing component regression in the linked issue.

## Commit Message Guidelines

Use Conventional Commits so history and automated changelogs remain structured and readable:

- `fix:` for bug fixes (e.g., `fix: resolve modern vacuum battery sensors`)
- `feat:` for new capabilities (e.g., `feat: support dynamic service data`)
- `docs:` for documentation updates (e.g., `docs: refine contributing guidelines`)
- `test:` for adding or updating tests (e.g., `test: add ha-smoke coverage`)
- `chore:` for tooling and maintenance (e.g., `chore: update dependencies`)

## Issue and Backlog Guidelines

Public bug, feature, and compatibility reports must use the structured forms under `.github/ISSUE_TEMPLATE/`.

Maintainer-authored work uses these versioned templates:

- `.github/ISSUE_TEMPLATE/work_item.md` for implementation-ready leaf issues;
- `.github/ISSUE_TEMPLATE/epic.md` for multi-issue outcomes.

The work item template is the canonical artifact for problem, evidence, scope, non-goals, proposed behavior, acceptance criteria, test plan, compatibility, dependencies, and release impact. Do not replace it with an unversioned personal template or a one-line issue body.

Initial roadmap issues are declared under `.github/backlog/` and created by the manual **Bootstrap backlog** workflow after the declarations are merged into `main`. Managed issue bodies contain a source marker; edit their Markdown source through a pull request and rerun the workflow rather than changing the generated body only in GitHub.

Every implementation issue must satisfy the Definition of Ready before work begins and the Definition of Done before closure. Priority, type, area, milestone, Project lifecycle, epic, testing gates, and triage rules are defined in [docs/maintainers/backlog-governance.md](docs/maintainers/backlog-governance.md).

Do not copy historical upstream issues one-for-one. Consolidate related evidence into one current canonical issue, describe what the maintained fork already solves, and verify the modern Home Assistant entity and service contract.

## Pull Request Guidelines

Every pull request must target the `main` branch of `Zuz666/lovelace-xiaomi-vacuum-card` and completely fill out all sections from `.github/PULL_REQUEST_TEMPLATE.md`:

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

- Mark all verified test and check steps.
- Explain why the selected test layers can observe the changed behavior.
- Include `npm run check` for every code change.
- Include real browser component tests for lifecycle, DOM, focus, keyboard, availability, accessibility, or interaction changes after that layer is available.
- Include `npm run test:ha-smoke` for Home Assistant resource, editor, registry, service, WebSocket, or integration-boundary changes.
- State the exact HA image or version used for smoke evidence.
- Link compatibility fixtures when an integration or model claim changes.

### 5. HACS And Release Impact (`## HACS And Release Impact`)

- Detail any HACS resource impacts (note that `dist/xiaomi-vacuum-card.js` is the canonical asset).
- Specify whether release notes are needed and what text should be included.
- State whether the pull request introduces breaking changes.

### 6. AI Disclosure (`## AI Disclosure`)

- **External contributors**: Disclose if AI models or AI coding tools were used during development, specifying the model and details.
- **StablyAI team members (internal contributors)**: Do not fill in; this section is ignored for internal team contributions.

### 7. Checklist (`## Checklist`)

- Verify that Conventional Commits are used, browser ES module compatibility is maintained, tests/docs are updated, managed backlog source files declared in `.github/backlog/issues.json` and parent epics are updated when closing or advancing backlog items, CodeQL security scanning checks pass, and automated review findings (CodeRabbit) are reviewed.

### 8. Review (`## Review`)

- Include notes for reviewers, self-review highlights, specific areas needing closer inspection, or explanations regarding automated review findings.

Do not use single-line placeholders or empty stubs in `--body`. Use `--body-file` or a full multiline description when submitting pull requests with the `gh` CLI.

## Automated Code Review & Security Scanning

Pull requests are automatically analyzed by CodeRabbit and GitHub CodeQL.

### CodeQL Security Analysis

GitHub CodeQL runs automated Static Application Security Testing (SAST) on
JavaScript/TypeScript source code and GitHub Actions workflow files. Pull
requests introducing unresolved security vulnerabilities or high-severity
alerts will be blocked.

### CodeRabbit AI Review

Pull requests may be reviewed automatically by CodeRabbit.

CodeRabbit feedback is advisory and does not replace maintainer review.
Authors should address actionable findings or briefly explain why a finding
does not apply.

Useful pull request commands:

- `@coderabbitai review` — review changes added since the previous review.
- `@coderabbitai full review` — review the complete pull request again.
- `@coderabbitai pause` — pause automatic reviews while making several updates.
- `@coderabbitai resume` — resume automatic reviews.

Do not apply automatically generated fixes without reviewing the resulting
diff and running the repository validation suite.

## Dependency Management & Automated Pull Requests

The repository relies on Dependabot for automated maintenance of `devDependencies` and GitHub Actions.

- The client card (`dist/xiaomi-vacuum-card.js`) has **zero** runtime npm dependencies. All npm dependencies are development tooling (linters, formatters, test runners).
- Automated dependency updates must pass all CI checks (`checks`, `ha-smoke`, `validate-hacs`) and automated code reviews.
- For stale or behind pull requests, trigger `@dependabot rebase` in a comment to bring the branch up to date with `main`.
- Internal developer tooling updates do not require an entry in `CHANGELOG.md` unless contributor prerequisites change.
- For full review, verification, and merge procedures, see [docs/dependency-workflow.md](docs/dependency-workflow.md).

## Changelog & Release Workflow

`CHANGELOG.md` is the authoritative source for all notable project changes.

- Follow the [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) format.
- Place unreleased contributions under the `## [Unreleased]` heading.
- When preparing a release, move entries to `## [X.Y.Z] - YYYY-MM-DD` and update comparison links at the bottom.
- `npm run check:version` automatically verifies that `package.json`, `dist/xiaomi-vacuum-card.js`, and `CHANGELOG.md` stay synchronized.
- For the full release lifecycle and automated GitHub Actions publishing steps, see [docs/release-workflow.md](docs/release-workflow.md).

## Workspace Scope & Documentation

- Private notes, scratchpads, and transcripts belong in `/.local/` (which is ignored by Git).
- Do not commit credentials or local-only session files.
- Public architectural decisions and finalized plans belong in the public `/docs/` folder.

## Card Architecture & Direct Browser Loading

`dist/xiaomi-vacuum-card.js` is the shipped canonical Home Assistant/HACS browser resource.
It is loaded directly by Home Assistant as an ES module in the browser. Do not add
bundler, package-build, or node-import assumptions.
