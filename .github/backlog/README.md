# Declarative Backlog Bootstrap

This directory contains the versioned source for the repository's initial canonical backlog.

## Files

- `issues.json` declares issue keys, exact titles, body files, labels, and milestone keys.
- Each sibling Markdown file is the canonical body source for one bootstrapped issue.
- `.github/milestones.json` declares milestone keys, titles, and descriptions.
- `.github/labels.json` declares the managed label taxonomy.
- `docs/maintainers/testing-strategy.md` records the test-system review, target layers, and pre-development quality gates referenced by the testing backlog.

The initial bootstrap contains five epics and seven implementation or design work items. Later backlog additions should be created only when their scope, dependencies, acceptance criteria, and release intent are sufficiently clear.

## Creating or reconciling the backlog

After these files are merged into the default branch, run the **Bootstrap backlog** workflow manually from GitHub Actions.

The workflow:

1. creates or updates managed labels;
2. creates or updates milestones by exact title;
3. finds issues by exact title or creates them when absent;
4. resolves `{{issue:<key>}}` references to real `#<number>` links;
5. reconciles the managed issue title, body, labels, and milestone.

The workflow never closes issues and never deletes unmanaged labels.

## Editing managed issues

Bootstrapped issue bodies contain a `managed-by` marker. Treat the Markdown files in this directory as the source of truth for the managed portion of those issue bodies. Submit body, label, or milestone changes through a pull request and rerun **Bootstrap backlog** after merge.

Use issue comments for discussion and implementation updates; the workflow does not modify comments.

Managed issue bodies may locally disable markdownlint rule `MD034` so exact upstream and Home Assistant source URLs remain directly reusable when the workflow publishes the issue. All other Markdown rules continue to apply.

## Adding another item

1. Start from `.github/ISSUE_TEMPLATE/work_item.md` or `.github/ISSUE_TEMPLATE/epic.md`.
2. Remove front matter and instructional comments.
3. Save the body as a Markdown file in this directory.
4. Add a unique key and exact title to `issues.json`.
5. Reference other managed issues with `{{issue:<key>}}`.
6. Validate that every label exists in `.github/labels.json` and every milestone key exists in `.github/milestones.json`.
7. Open a pull request and run the bootstrap workflow only after merge.

For lifecycle, priority, Definition of Ready, Definition of Done, and GitHub Project rules, see `docs/maintainers/backlog-governance.md`.

For test-layer responsibilities and the required sequence before major runtime development, see `docs/maintainers/testing-strategy.md`.
