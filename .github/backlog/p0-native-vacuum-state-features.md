## Problem

The default status row reads the legacy `status` attribute, while modern Home Assistant `StateVacuumEntity` integrations expose the canonical activity in the entity state (`cleaning`, `docked`, `idle`, `paused`, `returning`, or `error`). This can render `Unavailable` for otherwise valid vacuum entities.

Default action buttons are also rendered from static card and vendor presets without consistently evaluating `supported_features` and the current activity. The card can therefore offer actions that the entity does not support or that are not meaningful in its current state.

## Evidence and upstream references

- Upstream issue(s): https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/78, https://github.com/benct/lovelace-xiaomi-vacuum-card/issues/123
- Upstream pull request(s): N/A
- Home Assistant change or documentation: https://developers.home-assistant.io/docs/core/entity/vacuum/ and https://github.com/home-assistant/frontend/blob/dev/src/data/vacuum.ts
- Current fork behavior: the default status row uses `key: status`; default action availability is primarily configuration-driven.
- Reproduction, fixture, or diagnostic evidence: use a modern vacuum entity whose state is `docked` and which has no `attributes.status`; the default status row renders unavailable until manually remapped to `key: state`.

## Scope

- Resolve the default status from the main vacuum entity state.
- Preserve `attributes.status` as a legacy fallback where useful.
- Introduce automatic action availability based on `supported_features` and current vacuum activity.
- Define safe hidden or disabled behavior for Start, Pause, Stop, Return to Base, Locate, and Spot Clean.
- Preserve explicit user overrides and legacy vendor mappings.
- Add regression fixtures for modern and legacy entity shapes.

## Non-goals

- Replacing button configuration with the full Lovelace action model.
- Adding room or area cleaning controls.
- Adding new vendor presets.
- Inferring undocumented capabilities from manufacturer names.

## Proposed behavior

The default `status` row displays the localized or formatted main state of the configured `vacuum.*` entity. If a legacy integration provides a meaningful `attributes.status`, it may be used only as a documented fallback or explicit override.

Default buttons use an automatic availability mode:

- unsupported feature: hidden or disabled according to the agreed card policy;
- unavailable entity: no service call is dispatched;
- Start: unavailable while already cleaning;
- Stop: unavailable while docked, off, or idle;
- Return to Base: unavailable while already returning and when the feature is unsupported;
- Pause, Locate, and Spot Clean: unavailable when their feature is unsupported.

Explicit row or button configuration remains authoritative and can opt out of automatic presentation where compatibility requires it.

## Acceptance criteria

- [ ] The default status row renders the main vacuum state without requiring `key: state`.
- [ ] A legacy `attributes.status` source remains available through documented fallback or explicit configuration.
- [ ] Each default vacuum action evaluates the corresponding Home Assistant feature flag.
- [ ] State-dependent actions are hidden or disabled consistently according to the approved policy.
- [ ] Clicking an unavailable or unsupported action never calls a Home Assistant service.
- [ ] Explicit user button configuration and legacy vendor service mappings continue to work.
- [ ] Fixtures cover at least modern Roborock-like, Eufy/robovac-like, and legacy attribute-based entity shapes.

## Test plan

- [ ] Unit tests for status source precedence
- [ ] Unit tests for every supported feature flag used by default buttons
- [ ] Unit tests for state-dependent Start, Stop, and Return behavior
- [ ] Regression test for upstream issue #123 behavior
- [ ] Home Assistant smoke test for visible and unavailable button states
- [ ] Existing unit, lint, formatting, and smoke suites pass

## Compatibility and migration

- Minimum or targeted Home Assistant version: all currently supported versions, optimized for modern `StateVacuumEntity`
- Existing configuration impact: default status becomes correct for modern entities; explicit overrides remain unchanged
- Deprecations: possible future de-emphasis of implicit legacy `attributes.status`
- Breaking change: Potential presentation change for integrations that expose both state and a different legacy status attribute

## Dependencies

- Blocked by: none
- Blocks: standard Lovelace action support; native area-cleaning controls
- Related epic: {{issue:epic-modern-ha-entities}}

## Release impact

- Target milestone: v4.6.3 — Runtime correctness
- Changelog entry required: Yes
- Documentation update required: Yes, document status precedence and automatic action availability
- HACS or release asset impact: canonical `dist/xiaomi-vacuum-card.js` changes; asset name remains unchanged
