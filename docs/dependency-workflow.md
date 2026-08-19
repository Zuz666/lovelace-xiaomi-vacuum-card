# Dependency Workflow

This document defines the dependency management lifecycle, review procedures, and merge standards for automated update pull requests (such as Dependabot PRs) and manual dependency upgrades in **Xiaomi Vacuum Card Reborn** (`Zuz666/lovelace-xiaomi-vacuum-card`).

## Architectural Context

- **Zero Runtime Dependencies**: The distributed client card (`dist/xiaomi-vacuum-card.js`) is an ES module executed directly in the browser by Home Assistant Lovelace. It consumes Home Assistant's Lit globals (`window.LitElement`) and contains **no** bundled npm runtime dependencies.
- **Development Tooling Only**: All npm packages in `package.json` are declared under `devDependencies` (linters, formatters, test runners, and browser automation tools).
- **GitHub Actions Dependencies**: Workflows under `.github/workflows/` consume versioned GitHub Actions for CI, HACS validation, and automated releases.

Because runtime card code is unbundled and free of npm runtime dependencies, dependency updates are focused on developer ergonomics, CI reliability, test stability, and repository security.

---

## Dependency Categories

### 1. Developer Tooling (`package.json`)

| Package                           | Purpose                                              |
| --------------------------------- | ---------------------------------------------------- |
| `eslint`, `@eslint/js`, `globals` | JavaScript linting and syntax consistency            |
| `prettier`                        | Code formatting for JS, JSON, YAML, and Markdown     |
| `markdownlint-cli2`               | Markdown linting across docs and specs               |
| `@playwright/test`                | Browser end-to-end smoke testing with Home Assistant |

### 2. Transitive Lockfile Dependencies (`package-lock.json`)

Deep sub-dependencies of our developer tooling (e.g. `brace-expansion`, `js-yaml`). These are regularly updated by Dependabot to address upstream bug fixes and security advisories (GHSA / CVE).

### 3. GitHub Actions (`.github/workflows/*.yml`)

Pre-built actions used in CI pipelines (e.g. `actions/checkout`, `actions/setup-node`, `github/codeql-action`, `hacs/action`).

---

## Automated Update Mechanism (Dependabot)

The repository uses GitHub Dependabot to automate dependency maintenance:

- **Grouped Version Updates**: Dev dependencies are grouped into manageable batches (e.g. `npm_and_yarn`) to prevent PR noise.
- **Security Vulnerability Fixes**: High and critical security advisories automatically trigger targeted update PRs.
- **Actions Updates**: Workflow action updates are tracked to keep CI actions on secure and supported versions.
- **Labels**: Automated pull requests for both npm and GitHub Actions are tagged with `dependencies`, `type:chore`, and `area:ci-release`. Flat ecosystem-specific labels (such as `javascript` or `github-actions`) are not used. Priority labels are not assigned statically to all Dependabot PRs; maintainers assign `priority:P0` or `priority:P1` manually during triage when required (e.g. for urgent security advisories), ensuring routine tooling updates and critical vulnerability fixes do not receive the same default priority.

---

## Step-by-Step Review and Triage Lifecycle

When an automated dependency PR (like PR #20) is opened, follow this checklist to inspect, verify, and merge it safely.

### Step 1: Inspect PR Scope & Changelog

1. Open the pull request on GitHub or view it via the CLI:

   ```bash
   gh pr view <PR_NUMBER>
   ```

2. Review the packages being updated:
   - Identify whether the update touches direct `devDependencies`, transitive `package-lock.json` packages, or GitHub Actions.
   - Read the changelog and release notes included in the Dependabot PR description.
   - Identify whether the update is a **patch/minor** update (typically backwards-compatible) or a **major** update (may introduce breaking changes or deprecated options).
   - If the PR resolves a security advisory, note the referenced CVE / GHSA identifier.

### Step 2: Verify CI Checks and Automated Reviews

Every dependency PR must pass all standard automated checks before merging:

1. **GitHub Actions CI (`.github/workflows/ci.yml`)**:
   - `checks`: Verifies syntax (`node --check dist/xiaomi-vacuum-card.js`), version consistency, JS linting, Markdown linting, formatting, and unit tests.
   - `ha-smoke`: Boots a containerized Home Assistant instance and executes Playwright browser tests.
2. **HACS Validation (`.github/workflows/validate.yml`)**:
   - `validate-hacs`: Validates repository structure against HACS standards.
3. **GitHub CodeQL (`.github/workflows/codeql.yml`)**:
   - `Analyze (actions)`: Scans GitHub Actions workflow definitions for security misconfigurations.
   - `Analyze (javascript-typescript)`: Performs deep static analysis on JS/TS code for security vulnerabilities.
4. **CodeRabbit Review**:
   - Check CodeRabbit feedback for any security flags, deprecation warnings, or workflow permission concerns.

If all checks pass and the update is a standard patch/minor or transitive vulnerability fix, the PR can proceed directly to merge.

### Step 3: Local Verification (When Required)

Perform local testing if:

- The update is a **major version bump** of a direct tool (e.g., ESLint major version, Prettier major version, Playwright major version).
- CI checks fail or report lint/format regressions.
- You need to verify that a security advisory is completely resolved locally.

To verify locally:

```bash
# 1. Fetch and checkout the PR branch
gh pr checkout <PR_NUMBER>

# 2. Perform a clean dependency installation
npm ci

# 3. Run the full validation suite
npm run check

# 4. For Playwright or browser-related updates, run smoke tests
npm run test:ha-smoke

# 5. Check npm vulnerability status
npm audit
```

If a formatter or linter update introduces new stylistic rules, apply formatting using `npm run format` and verify with `npm run check`.

### Step 4: Handle Stale Branches & Merge Conflicts

When other pull requests merge into `main` before a Dependabot PR is merged, the PR status may transition to `BEHIND` `main` or show merge conflicts in `package-lock.json`.

**Recommended actions:**

1. **Rebase via comment**:
   Comment `@dependabot rebase` on the pull request. Dependabot will automatically rebase its branch onto the latest `main` commit and re-run all CI checks.
2. **Recreate if modified**:
   If the branch has conflicting manual commits or corrupted lockfiles, comment `@dependabot recreate` to regenerate the PR from scratch.
3. **Avoid direct manual push**:
   Do not push direct manual commits to Dependabot branches unless you intend to take over the branch. Dependabot may overwrite manual commits unless properly coordinated.

### Step 5: Merge Decision & Changelog Policy

1. **Prerequisites for merging**:
   - All CI checks (`checks`, `ha-smoke`, `validate-hacs`) are passing (`[ok]`).
   - Merge state is clean and up to date with `main`.
   - CodeRabbit review has no blocking issues.
2. **Merge Method**:
   - Use **Squash and merge** with a Conventional Commit message matching the update scope:
     - `chore(deps-dev): bump <package> from X.Y.Z to A.B.C`
     - `chore(deps): update github actions`
3. **Changelog Standards**:
   - **Internal devDependencies and CI updates**: Do **not** add an entry to `CHANGELOG.md`. Tooling updates do not affect end-user card behavior or HACS installations.
   - **Developer requirement changes**: If a dependency update alters contributor prerequisites (for example, raising the minimum Node.js runtime version), record the change under `## [Unreleased]` -> `### Changed` in `CHANGELOG.md`.

---

## Dependabot Commands Reference

You can interact with Dependabot directly by commenting on any Dependabot pull request:

| Command                                     | Action                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| `@dependabot rebase`                        | Rebases the PR branch onto the latest base branch (`main`) and re-triggers CI. |
| `@dependabot recreate`                      | Recreates the PR from scratch, discarding any conflicting edits.               |
| `@dependabot squash and merge`              | Merges the PR using the repository's squash merge strategy once checks pass.   |
| `@dependabot cancel merge`                  | Cancels a previously requested automated merge.                                |
| `@dependabot show <name> ignore conditions` | Displays all active ignore conditions for the specified package.               |
| `@dependabot ignore this major version`     | Closes the PR and ignores future major version updates for the package.        |
| `@dependabot ignore this minor version`     | Closes the PR and ignores future minor version updates for the package.        |
| `@dependabot ignore this dependency`        | Closes the PR and ignores all future updates for this dependency.              |

---

## Troubleshooting Common Issues

### Issue: New Prettier / ESLint Version Causes Formatting Failures

1. Checkout the branch: `gh pr checkout <PR_NUMBER>`.
2. Run formatting fixer: `npm run format`.
3. Verify all checks pass: `npm run check`.
4. Commit formatting adjustments: `git commit -am "style: format repository with updated prettier"` and push.

### Issue: Transitive Dependency Security Alert Won't Auto-Resolve

1. Update your local npm lockfile: `npm update <package-name> --package-lock-only`.
2. Audit vulnerabilities: `npm audit`.
3. Ensure tests pass: `npm run check`.
4. Commit the updated `package-lock.json`.

### Issue: Playwright Browser Download Failure in CI

1. Check if `@playwright/test` was bumped to a version requiring newer browser binaries.
2. Ensure `.github/workflows/ci.yml` retains `npx playwright install chromium`.
3. Verify local smoke test passes: `npm run test:ha-smoke`.
