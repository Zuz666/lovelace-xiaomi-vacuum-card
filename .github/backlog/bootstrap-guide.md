# Backlog Bootstrap Guide

This directory contains the versioned source for the repository's initial canonical backlog.

## Files

- `issues.json` declares stable issue keys, canonical titles, body files, labels, and milestone keys.
- Each sibling Markdown file is the canonical body source for one bootstrapped issue.
- `.github/milestones.json` declares milestone keys, titles, and descriptions.
- `.github/labels.json` declares the managed label taxonomy.
- `docs/maintainers/testing-strategy.md` records the test-system review, target layers, and pre-development quality gates referenced by the testing backlog.

The initial bootstrap contains five epics and seven implementation or design work items. Later backlog additions should be created only when their scope, dependencies, acceptance criteria, and release intent are sufficiently clear.

## Creating or reconciling the backlog

After these files are merged into the default branch, run the **Bootstrap backlog** workflow manually from GitHub Actions.

The workflow:

1. creates or updates managed labels;
2. creates missing milestones by exact title and updates existing milestone metadata without changing open or closed state;
3. identifies managed issues by the stable marker derived from the manifest key;
4. refuses to adopt an unmarked issue merely because its title matches a managed title;
5. creates missing issues with their marker present from the first API call;
6. resolves `{{issue:<key>}}` references to real `#<number>` links;
7. reconciles only the marked issue's canonical title, body, labels, and milestone.

The workflow never closes issues, never reopens closed milestones, and never deletes unmanaged labels.

## Managed issue identity

Every generated issue begins with a marker such as:

```html
<!-- managed-by: .github/backlog/issues.json key=p0-real-lit-component-tests -->
```

The manifest `key` and this marker are the durable identity. The issue title is managed metadata and may be reconciled, but title equality alone never authorizes an update.

If an existing unmarked issue has the same title, the workflow stops instead of overwriting it. To adopt an existing issue intentionally, add the exact marker for the chosen manifest key to that issue body after reviewing the full managed body, labels, milestone, and overwrite behavior. Duplicate markers also stop the workflow and must be resolved manually.

## Editing managed issues

Treat the Markdown files in this directory as the source of truth for managed issue bodies. Submit body, label, milestone, key, or title changes through a pull request and rerun **Bootstrap backlog** after merge.

Use issue comments for discussion and implementation updates; the workflow does not modify comments.

Managed issue bodies may locally disable markdownlint rule `MD034` so exact upstream and Home Assistant source URLs remain directly reusable when the workflow publishes the issue. All other Markdown rules continue to apply.

## Adding another item

1. Start from `.github/ISSUE_TEMPLATE/work_item.md` or `.github/ISSUE_TEMPLATE/epic.md`.
2. Remove front matter and instructional comments.
3. Save the body as a Markdown file in this directory.
4. Add a unique, durable key and canonical title to `issues.json`.
5. Reference other managed issues with `{{issue:<key>}}`.
6. Validate that every label exists in `.github/labels.json` and every milestone key exists in `.github/milestones.json`.
7. Open a pull request and run the bootstrap workflow only after merge.

Changing a key changes managed identity and must be treated as a migration. Do not casually rename keys after issues have been created.

For lifecycle, priority, Definition of Ready, Definition of Done, and GitHub Project rules, see `docs/maintainers/backlog-governance.md`.

For test-layer responsibilities and the required sequence before major runtime development, see `docs/maintainers/testing-strategy.md`.
