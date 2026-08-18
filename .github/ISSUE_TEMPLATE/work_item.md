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

- [ ] Unit or card-harness regression tests
- [ ] Home Assistant smoke test for UI, lifecycle, or integration behavior
- [ ] Manual browser or Companion App verification when applicable
- [ ] Fixtures cover affected integrations or entity shapes when applicable

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
