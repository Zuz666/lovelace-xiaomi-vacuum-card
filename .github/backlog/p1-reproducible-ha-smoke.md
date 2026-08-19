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

- Select and document an immutable Home Assistant container image reference for the required PR smoke job.
- Require the runtime image to use `ghcr.io/home-assistant/home-assistant@sha256:<digest>` rather than a tag-only reference.
- Make the required image reference a visible workflow variable rather than an embedded moving tag.
- Add validation that rejects missing digests and mutable tag-only references in the required smoke configuration.
- Record a human-readable Home Assistant release or source tag alongside the digest for maintenance context without using that tag as the runtime identity.
- Add a scheduled and manually dispatchable compatibility canary for selected moving channels such as stable and beta or development.
- Keep canary results visible but separate from deterministic branch-protection checks.
- Upload Playwright traces, screenshots, videos when enabled, HTML reports, and Home Assistant logs on failure.
- Include the tested HA image digest, human-readable release, and card commit in the workflow summary.
- Add a pull-request concurrency group with cancellation for superseded runs.
- Ensure the HA container is force-removed during cleanup even after partial startup failures.
- Remove duplicate readiness work where it does not improve diagnostics, or document why both workflow and test readiness checks are retained.
- Document the process for intentionally resolving and updating the pinned HA baseline digest.

## Non-goals

- Running every Home Assistant release channel as a required check.
- Running Chromium, Firefox, and WebKit against a full HA container on every pull request.
- Replacing the faster real-browser component tests.
- Claiming integration compatibility from a single demo vacuum scenario.
- Automatically updating the required HA baseline without review.
- Treating a semantic version tag as immutable merely because it is more specific than `stable`.

## Proposed behavior

Pull requests run one reproducible HA smoke job with a runtime reference such as:

```text
ghcr.io/home-assistant/home-assistant@sha256:<64-lowercase-hex-characters>
```

The digest changes only through a reviewed repository update. A separate variable or comment records the corresponding Home Assistant release for readability. A repository test validates the digest form and fails when the required job uses only `:stable`, `:beta`, `:dev`, a semantic version tag, or any other tag without `@sha256:`.

A separate scheduled or manually dispatched canary runs against moving channels. A canary failure retains diagnostics and creates a visible maintenance signal, but it does not retroactively make an unrelated pull request nondeterministic.

On failure, maintainers can download the Playwright report, trace, screenshots, and Home Assistant logs without rerunning the workflow.

## Acceptance criteria

- [x] The required PR smoke job uses an immutable `ghcr.io/home-assistant/home-assistant@sha256:<digest>` runtime reference.
- [x] Repository validation rejects tag-only references for the required smoke baseline, including explicit release tags.
- [x] A human-readable Home Assistant release identifier is recorded alongside the digest without becoming the runtime identity.
- [x] The pinned digest, resolution evidence, and update procedure are documented.
- [x] A scheduled and manually dispatchable canary tests selected moving HA channels.
- [x] Required and canary checks have distinct stable names and purposes.
- [x] Failed runs upload Playwright traces, screenshots, the HTML report, and Home Assistant or Docker logs.
- [x] Workflow summaries identify the HA digest, human-readable release, card commit, browser, and scenario result.
- [x] Superseded pull-request runs are cancelled through workflow concurrency.
- [x] Cleanup removes the HA container on success, failure, and cancelled runs.
- [x] No stored personal access token is required.
- [x] Existing required smoke behavior still verifies resource loading, rendering, a state value, a service or action, and fatal console errors.

## Test plan

- [x] Run the required smoke test against the digest-pinned baseline
- [x] Unit or repository test accepting a valid lowercase sha256 image reference
- [x] Negative tests rejecting `:stable`, `:beta`, `:dev`, semantic version tags, malformed digests, and tag-plus-no-digest references
- [x] Verify the documented release identifier corresponds to the resolved digest during baseline updates
- [ ] Manually dispatch each configured canary channel (verified via repo governance tests; GitHub dispatch requires merge to main)
- [x] Force a controlled Playwright failure and verify downloadable artifacts
- [x] Force a controlled HA startup failure and verify retained container logs
- [x] Push a superseding commit and verify the older PR run is cancelled
- [x] Verify branch-protection check names remain predictable

## Compatibility and migration

- Minimum or targeted Home Assistant version: the human-readable release corresponding to the immutable digest selected by the issue implementation
- Existing configuration impact: none
- Deprecations: mutable tag-only references are not accepted for the required smoke baseline after this issue is complete
- Breaking change: No runtime card change

## Dependencies

- Blocked by: none
- Blocks: deterministic large-scale runtime and editor development; intentional supported-HA baseline management
- Related epic: {{issue:epic-testing-architecture}}

## Release impact

- Target milestone: v4.6.3 — Runtime correctness
- Changelog entry required: No
- Documentation update required: Yes
- HACS or release asset impact: none
