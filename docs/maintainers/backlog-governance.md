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

An epic uses the highest priority among its own child deliverables and blockers whose urgency is caused by that epic's outcome. Priority describes urgency and impact, not implementation size.

A shared cross-release prerequisite keeps its own independently justified priority and does not automatically promote every downstream epic that consumes it. For example, a browser test harness may be P0 because it is the only reliable way to verify a current P0 correctness defect, while a later feature epic that reuses the same harness remains P1. Promote the downstream epic only when its own deliverables or an epic-specific blocker have the higher urgency.

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
- `dependencies` — dependency-file updates on automated or manual pull requests; it supplements rather than replaces `type:chore` and `area:ci-release`;
- `good first issue` — isolated and documented work suitable for a new contributor;
- `help wanted` — maintainer requests implementation help or device-specific evidence.

A canonical leaf issue that cites historical `benct/lovelace-xiaomi-vacuum-card` issues or pull requests as the origin of its work must use `source:upstream`. If the upstream links are contextual rather than the origin, state that distinction explicitly in the body.

A leaf issue whose compatibility section says `Breaking change: Potential` or `Breaking change: Yes`, or whose default presentation or configuration behavior may change incompatibly, must use `breaking-change` until the migration risk is resolved. The label records risk for review; it does not assert that the final release will necessarily break users.

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

The target layered architecture is defined in `docs/maintainers/testing-strategy.md`:

1. static repository checks;
2. Node unit and contract tests;
3. real browser component tests with actual Lit and DOM behavior;
4. a required immutable-digest-pinned Home Assistant smoke baseline;
5. scheduled or manually dispatched moving-channel compatibility canaries;
6. sanitized fixtures shared across appropriate layers.

The component harness and digest-pinned Home Assistant baseline are target capabilities delivered by canonical backlog issues. Governance must not describe them as already available.

Do not expand the VM harness into a fake browser or fake Home Assistant frontend. Keep it for pure contracts and move lifecycle, DOM, focus, keyboard, accessibility, and interaction behavior to real browser component tests when that layer exists.

Before lifecycle-sensitive runtime work is marked Ready, the issue must identify the browser-observable regression that proves it. Before a compatibility claim is marked Ready, it must identify the sanitized fixture and expected contract. Full HA smoke tests should remain small and prove integration boundaries rather than duplicate every component scenario.

### Interim quality gates

Until the real browser component-test issue is complete:

- planned lifecycle-heavy work remains blocked when the component layer is the only reliable test seam;
- an urgent maintenance, security, or compatibility fix may proceed only with targeted Home Assistant smoke coverage that observes the user-visible behavior and a linked issue recording the missing component regression;
- the VM harness must not be expanded to simulate Lit or DOM behavior.

Until the reproducible Home Assistant smoke issue is complete:

- the existing required `ha-smoke` check using the current configured image must pass for resource, editor, registry, service, WebSocket, and integration-boundary changes;
- pull-request evidence must record the resolved Home Assistant image identifier or digest reported by Docker or the workflow, not merely the mutable source tag;
- a failure caused by a newly moved `stable` tag must be triaged as baseline drift rather than silently waived;
- the immutable digest-pinned baseline is not yet a satisfiable requirement and therefore is not required for interim Done status.

### Target quality gates

After the component-test backlog item is complete, real browser component coverage is mandatory for lifecycle, DOM, focus, keyboard, availability, accessibility, and interaction changes.

After the reproducible smoke backlog item is complete, the required Home Assistant smoke job must run an immutable `@sha256:` image reference. Moving `stable`, `beta`, and development channels belong only in non-blocking canaries; the required digest changes through an explicit reviewed pull request.

## Definition of Ready

An issue may move to **Ready** only when:

- the user or technical outcome is clear;
- scope and non-goals are explicit;
- acceptance criteria are observable;
- the test plan identifies the correct currently available or explicitly prerequisite test layer for each material risk;
- lifecycle or interaction changes identify a real browser scenario, with the component-harness dependency recorded when that layer is not yet available;
- priority, type, area, and target milestone are assigned where applicable;
- dependencies and blockers are recorded;
- compatibility work includes an integration, model, sanitized entity fixture, and service or control contract;
- potential migration or breaking impact is documented and labelled where applicable.

## Definition of Done

An issue is done when:

- the implementation is merged into `main`;
- the pull request references `Closes #<issue>` or the issue is otherwise explicitly resolved;
- acceptance criteria are satisfied;
- tests are added at the layer that can actually observe the changed behavior, or their absence is justified;
- lifecycle, DOM, focus, keyboard, accessibility, and interaction changes satisfy the applicable component rule: the real browser component tests pass after that layer exists, or the interim targeted-smoke exception and linked missing-regression issue are documented before it exists;
- resource, editor, registry, service, WebSocket, and integration-boundary changes satisfy the applicable HA smoke rule: before the pinned-baseline issue is complete, the current required smoke test passes and its resolved image identifier is recorded; afterward, the immutable digest-pinned smoke test passes;
- README, contributor documentation, and changelog are updated when required;
- backward compatibility or migration behavior is verified;
- compatibility claims link to reviewed fixtures and tested expectations;
- managed backlog source files (the manifest-declared `body_file` entries from `.github/backlog/issues.json`) and parent epics are updated with completed checkboxes in the pull request, and the **Bootstrap backlog** workflow is rerun after merge into `main`;
- the parent epic and Project status are updated.

## Epic rules

An epic describes an outcome and shared exit criteria. It should contain links to its leaf issues, not duplicate all implementation details.

Use native GitHub sub-issues when maintaining the backlog interactively. The bootstrap workflow also writes a Markdown checklist into each initial epic so the relationship remains visible to readers and tools that do not expose sub-issues.

Cross-release quality epics may remain without a milestone while their leaf issues are assigned to concrete release milestones.

Shared external prerequisites should be listed separately from child deliverables. Their independent priority does not automatically set the downstream epic priority unless the prerequisite's urgency is caused by that epic's outcome.

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

Both workflows are intentionally limited to `workflow_dispatch`; the label workflow additionally allows `workflow_call` so the backlog workflow can reuse it. Each workflow hard-fails unless `github.ref` is exactly `refs/heads/main`, preventing repository metadata from being mutated using unmerged feature-branch declarations.

External Actions are pinned to full commit SHAs, checkout credentials are not persisted, and workflow- and job-level permissions are restricted to the allowlist `contents: read` and `issues: write`. Governance tests reject any additional scope or stronger access level.

The stable manifest key is the identity of a managed issue. Generated issue bodies contain a marker of the form `<!-- managed-by: .github/backlog/issues.json key=<key> -->`. Reruns locate issues by this marker, never by title alone. A same-title unmarked issue or duplicate marker stops the workflow and requires explicit maintainer resolution instead of authorizing an overwrite.

A missing issue is created with its marker in the initial body before references are reconciled. Existing marked issues have their title, body, labels, and milestone reconciled from the repository declarations. Existing milestone titles and descriptions are reconciled without changing whether a milestone is open or closed. The workflows never close issues, reopen milestones, or delete unmanaged labels.

Changing a manifest key changes identity and must be treated as an explicit migration. Review and merge governance changes into `main` with passing CI before running either workflow from `main`.

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
