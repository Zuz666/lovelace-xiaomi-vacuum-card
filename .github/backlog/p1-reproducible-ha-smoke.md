## Problem

The required Home Assistant smoke job starts `ghcr.io/home-assistant/home-assistant:stable`. That tag is mutable, so a newly published Home Assistant release can change a required pull-request check even when the repository and pull request have not changed.

The smoke suite also produces useful Playwright traces and screenshots locally, but the CI workflow does not upload the browser report, traces, screenshots, or Home Assistant logs. A failed runner can therefore disappear with the best diagnostic evidence.

Moving Home Assistant channels are valuable compatibility signals, but they should be separated from the deterministic required baseline.

## Evidence and upstream references

- Current CI workflow: [`.github/workflows/ci.yml`](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/blob/main/.github/workflows/ci.yml)
- Current Playwright configuration: [`playwright.config.mjs`](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/blob/main/playwright.config.mjs)
- Current smoke test: [`tests/ha-smoke/xiaomi-vacuum-card.spec.mjs`](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/blob/main/tests/ha-smoke/xiaomi-vacuum-card.spec.mjs)
- Maintainer review: [`docs/maintainers/testing-strategy.md`](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/blob/main/docs/maintainers/testing-strategy.md)
- Current fork behavior: every pull request uses the moving `stable` image and one Chromium HA scenario.

## Scope

- Select and document an explicit supported Home Assistant image tag or immutable digest for the required PR smoke job.
- Make the required image reference a visible workflow variable rather than an embedded moving tag.
- Add a scheduled and manually dispatchable compatibility canary for selected moving channels such as stable and beta or development.
- Keep canary results visible but separate from deterministic branch-protection checks.
- Upload Playwright traces, screenshots, videos when enabled, HTML reports, and Home Assistant logs on failure.
- Include the tested HA image and card commit in the workflow summary.
- Add a pull-request concurrency group with cancellation for superseded runs.
- Ensure the HA container is force-removed during cleanup even after partial startup failures.
- Remove duplicate readiness work where it does not improve diagnostics, or document why both workflow and test readiness checks are retained.
- Document the process for intentionally updating the pinned HA baseline.

## Non-goals

- Running every Home Assistant release channel as a required check.
- Running Chromium, Firefox, and WebKit against a full HA container on every pull request.
- Replacing the faster real-browser component tests.
- Claiming integration compatibility from a single demo vacuum scenario.
- Automatically updating the required HA baseline without review.

## Proposed behavior

Pull requests run one reproducible HA smoke job whose image version changes only through a reviewed repository update. The job name or summary clearly identifies that version.

A separate scheduled or manually dispatched canary runs against moving channels. A canary failure retains diagnostics and creates a visible maintenance signal, but it does not retroactively make an unrelated pull request nondeterministic.

On failure, maintainers can download the Playwright report, trace, screenshots, and Home Assistant logs without rerunning the workflow.

## Acceptance criteria

- [ ] The required PR smoke job uses an explicit HA tag or digest, not only `:stable`, `:beta`, or `:dev`.
- [ ] The pinned baseline and update procedure are documented.
- [ ] A scheduled and manually dispatchable canary tests selected moving HA channels.
- [ ] Required and canary checks have distinct stable names and purposes.
- [ ] Failed runs upload Playwright traces, screenshots, the HTML report, and Home Assistant or Docker logs.
- [ ] Workflow summaries identify the HA image, card commit, browser, and scenario result.
- [ ] Superseded pull-request runs are cancelled through workflow concurrency.
- [ ] Cleanup removes the HA container on success, failure, and cancelled runs.
- [ ] No stored personal access token is required.
- [ ] Existing required smoke behavior still verifies resource loading, rendering, a state value, a service or action, and fatal console errors.

## Test plan

- [ ] Run the required smoke test against the pinned baseline
- [ ] Manually dispatch each configured canary channel
- [ ] Force a controlled Playwright failure and verify downloadable artifacts
- [ ] Force a controlled HA startup failure and verify retained container logs
- [ ] Push a superseding commit and verify the older PR run is cancelled
- [ ] Verify branch-protection check names remain predictable

## Compatibility and migration

- Minimum or targeted Home Assistant version: the explicit baseline selected by the issue implementation
- Existing configuration impact: none
- Deprecations: none
- Breaking change: No

## Dependencies

- Blocked by: none
- Blocks: reliable large-scale runtime and editor development; intentional supported-HA baseline management
- Related epic: {{issue:epic-testing-architecture}}

## Release impact

- Target milestone: v4.6.3 — Runtime correctness
- Changelog entry required: No
- Documentation update required: Yes
- HACS or release asset impact: none
