## Summary

Describe what changed and why.

## Target

- Home Assistant versions:
- Card version or commit:
- Affected card features:

## Visual Proof

<!-- REQUIRED for UI / behavior changes. Please attach a BEFORE and AFTER that can easily tabbed/switched. Use videos for when appropriate over screenshots -->
<!-- If there is truly no visual or interaction change, write exactly: `N/A` and briefly say why. -->
<!-- For attachments NEVER add directly to the PR files (do not commit to files), use `gh image` extension or drag + drop (works for any attachment) -->

## Test Plan

- [ ] `npm run check`
- [ ] `npm run test:ha-smoke` (if UI behavior changed)
- [ ] `node --check dist/xiaomi-vacuum-card.js` (if JavaScript changed)

## HACS And Release Impact

- HACS filename/resource impact:
- Release notes needed:
- Breaking change:

## AI Disclosure

<!-- DO NOT FILL IN IF YOU ARE STABLYAI TEAM MEMBER (INTERNAL CONTRIBUTOR), IGNORE SECTION: -->
<!-- Which AI model if anyone was used, please state the details -->

## Checklist

- [ ] Conventional Commits are used for commit messages.
- [ ] Changes remain compatible with direct browser JS resource loading in Home Assistant/HACS.
- [ ] Docs/tests are updated when behavior changed.
- [ ] Managed backlog source files declared in `.github/backlog/issues.json` and related epics are updated if closing or advancing a managed item.
- [ ] Automated code review (CodeRabbit) and security scanning (CodeQL) reviewed and addressed or justified.

## Review
