# Testing Strategy

> Review date: 2026-08-18
>
> Scope: the test architecture required before the runtime-correctness, entity-aware rows, actions, and integration-compatibility backlogs are implemented.

## Decision

The existing test system is a useful foundation and should be retained, but it is not sufficient by itself for the planned development.

Before broad runtime refactoring or new entity-aware controls begin, the repository should add a real browser component-test layer that executes the card with an actual Lit lifecycle and DOM. In parallel, the required Home Assistant smoke test should become reproducible and produce useful failure artifacts. Reusable entity fixtures should be in place before the v4.7.0 implementation work expands across integrations.

This is a targeted upgrade, not a test-stack rewrite. The component layer and immutable Home Assistant smoke baseline described below are the **target state**. The interim rules explicitly describe what is enforceable before those backlog items are complete.

## Current test system

| Layer                     | Current implementation                                                                         | Primary value                                                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Static validation         | `node --check`, version synchronization, ESLint, markdownlint, and Prettier                    | Fast syntax, repository-policy, and formatting feedback                                                                 |
| Source and contract tests | Node test runner loading `dist/xiaomi-vacuum-card.js` through `tests/helpers/card-harness.mjs` | Fast checks for configuration, source resolution, service payloads, metadata, and error paths                           |
| Home Assistant smoke test | Playwright against a Dockerized Home Assistant instance and the shipped `dist` asset           | Real resource loading, custom-element registration, rendering, templating, service dispatch, and browser-console checks |
| Repository validation     | HACS validation and CodeQL                                                                     | Packaging and static security checks                                                                                    |

The current suite directly tests the shipped browser resource rather than a parallel implementation. That is an important property and must be preserved when the source tree is later modularized.

The current required Home Assistant job uses the moving `ghcr.io/home-assistant/home-assistant:stable` tag. It is a real integration check, but it is not yet the reproducible pinned baseline described in the target architecture.

## What works well

### Fast contract feedback

The Node tests start quickly and cover behavior that does not require a browser. Existing coverage includes:

- configuration validation and safe image URLs;
- card registration, picker metadata, editor schema, and grid options;
- external entity and battery source precedence;
- battery value and icon edge cases;
- service payload construction;
- dynamic template subscriptions, malformed results, races, and unsubscribe failures;
- release metadata and changelog invariants.

### Real Home Assistant verification

The Playwright smoke test loads the actual distributed card in Home Assistant, verifies that the element is registered and visible, checks an external battery sensor, executes a dynamically templated service action, and fails on browser console errors.

### Appropriate dependency size

The repository currently avoids a large unit-test framework. The Node test runner and Playwright are enough to support the target architecture; adopting another runner is not a goal by itself.

## Findings and risks

| Severity | Finding                                                                                                                                             | Consequence                                                                                                                              |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Critical | The VM harness uses a fake `LitElement`; `requestUpdate()` is a no-op and no real reactive property or update cycle runs                            | Stale UI and `shouldUpdate()` defects can pass all fast tests                                                                            |
| High     | The harness has no Shadow DOM, rendered DOM, focus management, event propagation, accessibility tree, or real keyboard behavior                     | Interaction and accessibility regressions are only weakly represented by direct method calls                                             |
| High     | Several tests inspect the internal `{ strings, values }` representation returned by the fake `html` tag                                             | Tests can be coupled to implementation structure while missing user-visible DOM behavior                                                 |
| High     | The required smoke job uses the mutable `home-assistant:stable` container tag                                                                       | A new Home Assistant release can change the required PR check without a repository change                                                |
| High     | The HA smoke suite has one primary scenario and one demo vacuum shape                                                                               | External entity reactivity, feature flags, unavailable states, selects, editor round trips, and vendor entity models are not represented |
| Medium   | Playwright traces are retained locally on failure, but CI does not upload traces, screenshots, the HTML report, or Home Assistant logs as artifacts | A failed smoke run is harder to diagnose after the runner is destroyed                                                                   |
| Medium   | Entity states and integration shapes are embedded independently in tests                                                                            | Fixtures cannot be reused across contract, component, and HA scenarios, and compatibility claims can drift                               |
| Medium   | No real-browser accessibility assertions cover the ARIA combobox and future controls                                                                | Roles, focus, keyboard navigation, labels, and disabled behavior may regress silently                                                    |
| Low      | There is no coverage baseline                                                                                                                       | Untested branches are less visible, although a numeric coverage target alone would not address the critical lifecycle gap                |

## Target test architecture

### Layer 0: static and repository checks

Retain the existing syntax, version, lint, format, changelog, HACS, and CodeQL checks.

These checks should remain fast and required.

### Layer 1: unit and contract tests

Retain the current VM harness for logic that is independent of a real DOM:

- configuration normalization and validation;
- source precedence;
- formatting helpers;
- service and action payloads;
- registry metadata transformations;
- template parsing and error handling.

When the source is split into modules, pure functions should be imported and tested directly. The VM harness should become smaller rather than attempting to emulate more of Lit.

### Layer 2: real browser component tests

Add a fast Playwright component harness that loads the shipped card, or the same build artifact, into a minimal browser page with:

- actual Lit reactive behavior;
- actual custom elements and Shadow DOM;
- a deterministic Home Assistant object stub;
- controllable entity-state updates;
- production-shaped optional entity and device registry maps;
- service and WebSocket call recording;
- keyboard, focus, pointer, and accessibility assertions.

The harness must not depend on private Home Assistant UI components. It should provide only the public card inputs and the minimum independent browser environment needed by this card.

This layer should cover behavior such as:

- an external sensor changing while the vacuum object is unchanged;
- unrelated entities not causing unnecessary renders;
- unavailable and removed dependencies;
- registry-map replacement and documented map-absent fallback;
- ARIA combobox focus, selection, escape, and keyboard navigation;
- disabled or hidden actions based on capabilities;
- editor configuration round trips;
- external `select.*` controls and future Lovelace actions.

### Layer 3: immutable Home Assistant smoke baseline

Keep a required Chromium smoke test against an immutable Home Assistant container digest such as `ghcr.io/home-assistant/home-assistant@sha256:<digest>`. A human-readable Home Assistant release is recorded alongside the digest, but a tag alone is not the runtime identity.

It should continue to verify:

- loading the HACS-style distributed resource;
- registration and rendering inside Home Assistant;
- current public Home Assistant card APIs;
- actual `hass` registry maps where the card consumes that boundary;
- at least one real state update and one service or action dispatch;
- absence of fatal browser errors.

Repository validation must reject tag-only references for the required smoke job. The required digest should be updated intentionally through a reviewed pull request that records how the digest was resolved.

### Layer 4: compatibility canaries

Run scheduled and manually dispatchable non-blocking canaries against appropriate moving Home Assistant channels, such as current stable and beta or development builds.

Canary failures should not make an unrelated pull request nondeterministic. They should create a visible maintenance signal with retained logs and traces.

A periodic secondary-browser run may be added for interaction-sensitive paths. Running every browser against a full Home Assistant container on every pull request is not required initially.

### Shared fixture layer

Create sanitized, explicitly versioned entity fixtures that describe:

- the main vacuum state and `supported_features`;
- related sensors, binary sensors, selects, buttons, numbers, image or camera entities;
- entity and device metadata needed for discovery;
- expected rows, controls, availability, formatting, and actions.

The same fixture should be consumable by unit tests, component tests, and selected HA smoke scenarios. Fixtures must not contain credentials, tokens, coordinates, serial numbers, or private diagnostics. Unknown future fixture schema versions must be rejected before reaching any consumer.

## Quality gates by change type

The following table describes the target state after the relevant test-foundation issues are complete:

| Change type                                                                  | Target required evidence                                                              |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Documentation or governance only                                             | Static checks and relevant repository tests                                           |
| Pure source resolution, formatting, or payload logic                         | Unit or contract regression tests plus static checks                                  |
| Lit lifecycle, rendering, focus, keyboard, or availability                   | Real browser component test plus static checks                                        |
| Home Assistant resource, editor, registry, service, or WebSocket integration | Component tests and immutable digest-pinned HA smoke test                             |
| New integration or vendor compatibility claim                                | Versioned sanitized fixture, contract or component test, and targeted HA verification |
| Release or supported HA baseline update                                      | Full required suite, digest validation, and explicit smoke-baseline review            |

## Interim rules before target layers exist

### Interim lifecycle rule

Until the real browser component layer is merged, a lifecycle-sensitive pull request must include targeted Home Assistant smoke coverage that observes the user-visible regression and must link an issue that records the missing component-level regression test.

This is a temporary exception for urgent maintenance, security, or compatibility fixes that cannot safely wait for the component harness. It is not permission to expand the VM harness into a fake browser. Planned lifecycle-heavy work, including the external-entity reactivity implementation, remains blocked by the real component-harness backlog item.

After the component layer is available, the real browser component test is mandatory for lifecycle, DOM, focus, keyboard, availability, accessibility, or interaction changes. A full HA smoke scenario is additionally required only when the change crosses a Home Assistant resource, editor, registry, service, WebSocket, or other integration boundary.

### Interim Home Assistant smoke rule

Until the immutable baseline issue is merged, the existing required `ha-smoke` job remains the enforceable integration gate even though its configured `stable` source tag is mutable.

For each resource, editor, registry, service, WebSocket, or integration-boundary pull request during this interim period:

- the current required smoke job must pass;
- the pull request or workflow evidence must record the resolved image identifier or digest reported by Docker or the workflow, not only `:stable`;
- a change in the resolved image between otherwise identical runs must be treated as baseline drift and investigated;
- the pull request must not claim that a reproducible pinned baseline was used.

After the immutable baseline issue is complete, the required job must use `@sha256:` and tag-only references are rejected. Moving channels then run only as non-blocking canaries.

## Required sequence before major development

### Before the external-entity reactivity fix

Add the real browser component harness and encode the stale external-entity behavior as a regression test whose passing condition is that replacing only the referenced state updates visible DOM. The runtime fix should make that test pass without relying only on direct method calls.

### Before broad v4.7.0 implementation

Introduce reusable versioned entity fixtures and use them for source resolution, formatting, controls, and editor serialization. The entity-aware row design may proceed in parallel, but implementation should not accumulate new inline vendor-shaped mocks.

### Before v4.8.0 actions and area cleaning

Extend component tests with pointer, keyboard, confirmation, disabled-state, and accessibility assertions. Keep only a small number of representative end-to-end HA scenarios.

### In parallel with the first P0 work

Pin the required HA smoke baseline by immutable digest, separate moving-channel canaries, and upload Playwright and HA failure artifacts.

## CI recommendations

- Keep `checks` as the fast first stage.
- Add a required browser component-test job after unit tests.
- Keep one required immutable digest-pinned HA smoke job after the fast checks when the corresponding backlog item is complete.
- Until then, retain the current `ha-smoke` check name and record its resolved image identifier in evidence.
- Add `concurrency` with cancellation for superseded pull-request runs.
- Upload Playwright traces, screenshots, reports, and Home Assistant logs on failure.
- Run moving HA channels on a schedule or manual dispatch rather than as the only required baseline.
- Make the tested Home Assistant digest and human-readable release visible in job summaries.
- Preserve a stable check name when conditional execution is introduced so branch protection remains predictable.

## Deferred improvements

The following are useful but should not delay the critical test-foundation work:

- a strict repository-wide coverage percentage;
- mutation testing;
- broad visual snapshot testing across themes;
- a full Chromium, Firefox, and WebKit matrix on every pull request;
- performance budgets beyond targeted render-count regressions;
- replacing the current Node test runner solely for tooling uniformity.

Coverage should be introduced as a diagnostic baseline after source modules exist. Visual comparisons should be limited to stable, high-value surfaces because Home Assistant themes, fonts, and frontend changes can make broad snapshots noisy.

## Backlog mapping

The testing architecture is tracked by these canonical backlog items:

- `epic: layered testing architecture and quality gates`;
- `test: add real Lit browser component tests for lifecycle and interactions`;
- `test: make Home Assistant smoke tests reproducible and diagnostic`;
- `test: introduce reusable entity fixtures and scenario matrix`.

The real component harness is a prerequisite for the external-entity reactivity issue. The fixture matrix is shared with the entity-aware rows and integration compatibility epics. The immutable smoke issue converts the interim integration gate into the target reproducible gate.

## Review triggers

Revisit this strategy when any of the following occurs:

- the shipped artifact starts being generated from a modular source tree;
- the minimum supported Home Assistant version changes;
- the card adopts standard Lovelace action helpers or registry subscriptions;
- smoke runtime or flakiness materially affects contribution throughput;
- compatibility fixtures cover enough integrations to justify a broader matrix.
