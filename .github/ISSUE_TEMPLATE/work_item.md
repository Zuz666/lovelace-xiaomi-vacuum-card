---
name: Maintainer work item
about: Define an implementation-ready backlog item with scope, acceptance criteria, tests, dependencies, and release impact.
title: ""
labels: ""
assignees: ""
---

<!--
This is the canonical implementation issue template for maintainers.
Keep each leaf issue small enough to complete in one pull request or a short,
explicitly ordered sequence of pull requests. Delete instructional comments
before publishing the issue.

Before publishing, assign exactly one `priority:*` label, exactly one `type:*`
label, and one or two `area:*` labels. Assign a target milestone when applicable.
See `docs/maintainers/backlog-governance.md` for the source-of-truth rules.
-->

## Problem

<!-- What is currently incorrect, missing, risky, or unnecessarily difficult? -->

## Evidence and upstream references

<!-- Include only relevant evidence. Use N/A where a source category does not apply. -->

- Upstream issue(s):
- Upstream pull request(s):
- Home Assistant change or documentation:
- Current fork behavior:
- Reproduction, fixture, or diagnostic evidence:

## Scope

<!-- State exactly what this issue will implement. -->

## Non-goals

<!-- State what is intentionally excluded to prevent scope growth. -->

## Proposed behavior

<!-- Describe the runtime behavior, configuration contract, and user-visible result. -->

## Acceptance criteria

- [ ] The implementation satisfies the scoped behavior above.
- [ ] Existing supported YAML remains compatible, or an approved migration is documented.
- [ ] Error, unavailable, and unsupported states fail safely.
- [ ] Relevant documentation is updated.

## Test plan

<!--
Select the layers that can actually observe the material risks. Mark an item N/A
with a reason rather than checking an irrelevant test. See
`docs/maintainers/testing-strategy.md`.
-->

- [ ] Node unit or contract tests for configuration, source resolution, formatting, payloads, or error paths
- [ ] Real browser component tests for Lit lifecycle, visible DOM, focus, keyboard, availability, accessibility, or interaction behavior
- [ ] Pinned Home Assistant smoke test for resource loading, editor or registry integration, service, WebSocket, or other HA boundaries
- [ ] Shared sanitized fixtures for affected integrations, entity shapes, feature flags, or expected controls
- [ ] Manual browser or Companion App verification when automation cannot fully represent the scenario

Test-layer rationale:

<!-- Explain briefly why the selected layers can detect the regression or prove the behavior. -->

## Compatibility and migration

- Minimum or targeted Home Assistant version:
- Existing configuration impact:
- Deprecations:
- Breaking change: No / Potential / Yes

## Dependencies

- Blocked by:
- Blocks:
- Related epic:

## Release impact

- Target milestone:
- Changelog entry required: Yes / No
- Documentation update required: Yes / No
- HACS or release asset impact:
