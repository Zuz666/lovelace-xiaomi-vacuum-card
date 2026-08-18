## Outcome

Xiaomi Vacuum Card Reborn has a layered, reproducible test system that can detect pure-logic defects, real Lit and DOM lifecycle regressions, Home Assistant integration breaks, and unsupported compatibility claims without making pull-request feedback unnecessarily slow or flaky.

## Why this matters

The current Node VM harness is valuable for fast contract tests, but it uses a fake `LitElement` and does not execute actual reactive updates, Shadow DOM, focus, keyboard behavior, or event propagation. The real Home Assistant Playwright smoke test covers the shipped card, but currently exercises one primary scenario against a mutable `stable` container tag.

Planned work includes reactive dependency tracking, external controls, editor changes, standard Lovelace actions, and multiple integration entity models. Those changes require a real browser component layer and reusable fixtures before the codebase grows further.

The detailed review and target architecture are documented in the [maintainer testing strategy](https://github.com/Zuz666/lovelace-xiaomi-vacuum-card/blob/main/docs/maintainers/testing-strategy.md).

## Scope

- retain fast Node unit and contract tests for logic that does not require a DOM;
- add real browser component tests with actual Lit lifecycle and Shadow DOM;
- provide deterministic Home Assistant object stubs and state-update controls;
- add keyboard, focus, availability, and targeted accessibility assertions;
- pin the required Home Assistant smoke baseline;
- run moving HA channels as scheduled or manually dispatched canaries;
- retain Playwright traces, screenshots, reports, and Home Assistant logs on failures;
- create sanitized entity fixtures reusable across contract, component, and HA tests;
- define risk-based quality gates for runtime, editor, action, and compatibility changes.

## Non-goals

- replacing every existing Node test with a browser test;
- emulating the complete Home Assistant frontend in the fast harness;
- depending on private Home Assistant UI components;
- enforcing 100% code coverage before the source is modularized;
- broad visual snapshots across every theme;
- running every browser against a full HA container on every pull request.

## Child issues

- [x] {{issue:p0-real-lit-component-tests}} — add real Lit browser component tests for lifecycle and interactions
- [ ] {{issue:p1-reproducible-ha-smoke}} — make Home Assistant smoke tests reproducible and diagnostic
- [ ] {{issue:p1-entity-fixture-matrix}} — introduce reusable entity fixtures and a scenario matrix

## Exit criteria

- [ ] The stale external-entity scenario is covered by a real Lit and DOM regression test.
- [ ] Fast tests and component tests have clearly separated responsibilities.
- [ ] The required HA smoke run uses an explicit supported baseline.
- [ ] Moving HA channel failures are visible without making unrelated PR checks nondeterministic.
- [ ] Failed browser and HA tests retain actionable artifacts.
- [ ] Sanitized entity fixtures are shared by at least two test layers.
- [ ] Interaction-sensitive controls have real keyboard, focus, and availability assertions.
- [ ] Contributor and maintainer documentation describes which test layer is required for each change type.

## Release plan

- Target milestone: none; this is a cross-release quality epic
- Critical path: real component harness → external-entity reactivity fix → entity fixtures → v4.7 implementation
- Parallel path: pinned HA smoke baseline, canaries, and failure artifacts
- Known blockers: none at bootstrap time
