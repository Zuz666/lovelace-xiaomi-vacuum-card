# Backlog Governance

This document defines how Xiaomi Vacuum Card Reborn turns user reports, upstream history, Home Assistant changes, and maintainer research into an actionable backlog.

## Sources of truth

The repository uses separate GitHub objects for separate concerns:

| Object                    | Purpose                                                    | Source-of-truth rule                                                                      |
| ------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Issue                     | One implementable and verifiable work item                 | A leaf issue should normally fit in one pull request or a short explicitly ordered series |
| Epic issue                | A product or architecture outcome spanning multiple issues | Tracks child issues and shared exit criteria; it is not an implementation dump            |
| Milestone                 | A concrete release boundary                                | Contains only work planned for that release                                               |
| Label                     | Classification                                             | Priority, type, area, and exceptional state are independent dimensions                    |
| GitHub Project            | Workflow visibility                                        | Shows movement through intake, planning, implementation, and review                       |
| Documentation or research | Evidence and decisions                                     | Supports issues but does not replace issue acceptance criteria                            |

A historical upstream issue or pull request is evidence, not automatically a backlog item. Related reports should be consolidated into one canonical issue that describes the current fork behavior and the modern Home Assistant contract.

## Canonical issue artifacts

Maintainer-authored work must use the versioned templates in `.github/ISSUE_TEMPLATE/`:

- `work_item.md` — canonical implementation-ready leaf issue template;
- `epic.md` — parent outcome and exit-criteria template;
- `bug_report.yml` — structured public bug intake;
- `feature_request.yml` — structured public feature intake;
- `compatibility_report.yml` — integration and model evidence.

The canonical work item template is intentionally stored in the issue-template directory rather than only in this document. This keeps it visible in the GitHub issue chooser, reviewable through pull requests, and synchronized with the repository workflow.

Maintainer strategies and reviews that define cross-cutting quality gates belong under `docs/maintainers/`. The current test-system review and target architecture are stored in `docs/maintainers/testing-strategy.md`.

## Backlog lifecycle

Use the following Project status values:

1. **Inbox** — newly created and not yet classified;
2. **Backlog** — accepted as useful but not implementation-ready;
3. **Ready** — scope, acceptance criteria, test plan, dependencies, and release intent are complete;
4. **In progress** — an owner is actively implementing the issue;
5. **In review** — a pull request is open;
6. **Done** — implementation is merged or the issue is otherwise closed with a native GitHub state reason.

Do not duplicate these statuses with labels such as `in-progress`, `review`, or `done`.

## Priority labels

Every leaf issue must have exactly one priority label.

| Label         | Meaning                                                                            |
| ------------- | ---------------------------------------------------------------------------------- |
| `priority:P0` | Incorrect data, broken primary behavior, or current Home Assistant incompatibility |
| `priority:P1` | Required for the next planned minor release                                        |
| `priority:P2` | Valuable work that does not block the primary user journey                         |
| `priority:P3` | Nice-to-have, experimental, or primarily visual improvement                        |

An epic uses the highest priority currently present on its critical path. Priority describes urgency and impact, not implementation size.

Test infrastructure may be P0 when it is the only reliable way to verify a current P0 correctness defect. Priority describes the risk on the delivery path, not whether the issue directly changes the UI.

## Type labels

A leaf issue must normally have exactly one type label:

- `type:bug`;
- `type:feature`;
- `type:refactor`;
- `type:test`;
- `type:docs`;
- `type:chore`.

Epics use the `epic` label and do not require a `type:*` label.

## Area labels

An issue may have one or two area labels:

- `area:runtime` — rendering lifecycle, reactivity, and Lit runtime;
- `area:entities` — entity resolution, registries, metadata, values, and formatting;
- `area:controls` — buttons, selectors, dropdowns, and service execution;
- `area:actions` — Lovelace tap, hold, double-tap, confirmation, and navigation actions;
- `area:layout` — responsive layout, Sections behavior, rows, and styling;
- `area:editor` — visual editor, selectors, schemas, and configuration UX;
- `area:compatibility` — Home Assistant or integration compatibility;
- `area:vendor` — vendor- or model-specific compatibility profiles;
- `area:ci-release` — CI, dependencies, HACS, release, and publishing;
- `area:testing` — test harnesses, fixtures, browser and HA tests, and quality gates.

More than two area labels usually indicates that the issue should be split.

## Exceptional status labels

Use status labels only when the normal Project lifecycle is insufficient:

- `status:needs-info` — required environment, configuration, or diagnostics are missing;
- `status:needs-reproduction` — the behavior has not yet been reproduced;
- `status:blocked` — progress is blocked by a documented issue or external change.

Use GitHub's native close reasons for completed, duplicate, and not-planned issues instead of labels.

## Supporting labels

- `source:upstream` — derived from historical upstream issues or pull requests;
- `breaking-change` — may require a configuration migration or incompatible behavior change;
- `good first issue` — isolated and documented work suitable for a new contributor;
- `help wanted` — maintainer requests implementation help or device-specific evidence.

Do not create a label for every vacuum vendor until there are enough active issues to justify that taxonomy. Use `area:vendor` and name the verified integration or model in the issue body.

## Milestones

The initial release milestones are declared in `.github/milestones.json`:

- **v4.6.3 — Runtime correctness** — correctness fixes with no intended configuration break;
- **v4.7.0 — Entity-aware rows and controls** — entity-aware row model, formatting, external controls, and supporting architecture;
- **v4.8.0 — Actions and area cleaning** — standard Lovelace actions, responsive action layout, conditions, and native area cleaning.

P3 work, cross-release epics, and unverified vendor requests may remain without a milestone until there is evidence and release capacity. Do not use a generic `Backlog` milestone.

## GitHub Project configuration

Create a GitHub Project named **Xiaomi Vacuum Card Reborn Roadmap** with:

- Status field: `Inbox`, `Backlog`, `Ready`, `In progress`, `In review`, `Done`;
- Size field: `XS`, `S`, `M`, `L`, `XL`.

Priority remains label-backed and target release remains milestone-backed; do not duplicate either as a custom Project field.

Recommended views:

| View                | Configuration                                       |
| ------------------- | --------------------------------------------------- |
| Current release     | Filter by the current milestone and group by Status |
| Prioritized backlog | Filter to Backlog and Ready; sort P0 through P3     |
| Roadmap             | Group by milestone                                  |
| Compatibility       | Filter `area:compatibility` or `area:vendor`        |

Add a **Testing and quality** view filtered by `area:testing` so cross-release prerequisites are visible independently from product epics.

Project creation is a one-time owner-level GitHub operation. Repository labels, milestones, and initial issues are bootstrapped by repository workflows; Project fields and views are configured in the GitHub UI so no broad personal access token is stored in repository automation.

## Testing governance

The repository uses a layered testing strategy defined in `docs/maintainers/testing-strategy.md`:

1. static repository checks;
2. Node unit and contract tests;
3. real browser component tests with actual Lit and DOM behavior;
4. a required pinned Home Assistant smoke baseline;
5. scheduled or manually dispatched moving-channel compatibility canaries;
6. sanitized fixtures shared across appropriate layers.

Do not expand the VM harness into a fake browser or fake Home Assistant frontend. Keep it for pure contracts and move lifecycle, DOM, focus, keyboard, accessibility, and interaction behavior to real browser component tests.

Before lifecycle-sensitive runtime work is marked Ready, the issue must identify the real browser regression that proves it. Before a compatibility claim is marked Ready, it must identify the sanitized fixture and expected contract. Full HA smoke tests should remain small and prove integration boundaries rather than duplicate every component scenario.

A mutable Home Assistant channel should not be the only required pull-request baseline. Moving channels belong in canaries; the required smoke version changes through an explicit reviewed update.

## Definition of Ready

An issue may move to **Ready** only when:

- the user or technical outcome is clear;
- scope and non-goals are explicit;
- acceptance criteria are observable;
- the test plan identifies the correct test layer for each material risk;
- lifecycle or interaction changes identify a real browser component scenario;
- priority, type, area, and target milestone are assigned where applicable;
- dependencies and blockers are recorded;
- compatibility work includes an integration, model, sanitized entity fixture, and service or control contract;
- potential migration or breaking impact is documented.

## Definition of Done

An issue is done when:

- the implementation is merged into `main`;
- the pull request references `Closes #<issue>` or the issue is otherwise explicitly resolved;
- acceptance criteria are satisfied;
- tests are added at the layer that can actually observe the changed behavior, or their absence is justified;
- real browser component tests pass for lifecycle, DOM, focus, keyboard, accessibility, and interaction changes;
- the pinned Home Assistant smoke test passes for resource, editor, registry, service, WebSocket, and integration-boundary changes;
- README, contributor documentation, and changelog are updated when required;
- backward compatibility or migration behavior is verified;
- compatibility claims link to reviewed fixtures and tested expectations;
- the parent epic and Project status are updated.

## Epic rules

An epic describes an outcome and shared exit criteria. It should contain links to its leaf issues, not duplicate all implementation details.

Use native GitHub sub-issues when maintaining the backlog interactively. The bootstrap workflow also writes a Markdown checklist into each initial epic so the relationship remains visible to readers and tools that do not expose sub-issues.

Cross-release quality epics may remain without a milestone while their leaf issues are assigned to concrete release milestones.

## Upstream traceability

When work originates from the historical upstream repository:

1. list the relevant issue and pull-request URLs under `Evidence and upstream references`;
2. describe whether the fork already supersedes part of the request;
3. describe the current Home Assistant entity and service contract;
4. avoid cherry-picking vendor-specific fixes without current fixtures;
5. apply `source:upstream` to the canonical leaf issue.

## Bootstrap automation

The repository contains two manual workflows:

- **Sync labels** — creates or updates labels from `.github/labels.json` and never deletes unmanaged labels;
- **Bootstrap backlog** — invokes label synchronization, creates or updates milestones from `.github/milestones.json`, and creates or updates the initial issues declared in `.github/backlog/issues.json`.

Both workflows are intentionally manual (`workflow_dispatch`). Review and merge governance changes before running them. The backlog bootstrap searches exact issue titles across open and closed issues, so rerunning it updates canonical items rather than creating duplicates.

## Triage checklist

For each new public issue:

1. verify it belongs to the card rather than the Home Assistant integration;
2. remove or request removal of secrets and private data;
3. reproduce or apply `status:needs-reproduction`;
4. consolidate duplicates into a canonical issue;
5. assign priority, type, and area;
6. identify whether the risk needs contract, component, HA smoke, or compatibility-fixture coverage;
7. place accepted but incomplete work in Backlog;
8. move to Ready only after the Definition of Ready is met.
