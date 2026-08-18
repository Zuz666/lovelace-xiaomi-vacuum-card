import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const readText = (relativePath) => readFile(path.join(repositoryRoot, relativePath), "utf8");

const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

const normalizeWhitespace = (value) => value.replace(/\s+/g, " ");

const assertUnique = (values, description) => {
  assert.equal(
    new Set(values).size,
    values.length,
    `${description} must be unique: ${values.join(", ")}`,
  );
};

const workflowTriggerKeys = (workflow, name) => {
  const triggerBlock = workflow.match(/^on:\n([\s\S]*?)^permissions:/m);
  assert.ok(triggerBlock, `${name} must have an on block before permissions`);

  const triggerPattern = /^ {2}(?:"([^"]+)"|'([^']+)'|([A-Za-z_][A-Za-z0-9_]*)):/gm;
  return [...triggerBlock[1].matchAll(triggerPattern)].map(
    (match) => match[1] ?? match[2] ?? match[3],
  );
};

const assertAllowedWorkflowTriggers = (workflow, name, allowedTriggers) => {
  assert.deepEqual(
    workflowTriggerKeys(workflow, name).sort(),
    [...allowedTriggers].sort(),
    `${name} has an automatic or unsupported trigger`,
  );
};

const workflowPermissionBlocks = (workflow, name) => {
  const lines = workflow.split("\n");
  const blocks = [];

  for (let index = 0; index < lines.length; index += 1) {
    const header = lines[index].match(/^(\s*)permissions:\s*(.*)$/);
    if (!header) continue;

    const indent = header[1].length;
    const scalar = header[2].trim();
    const entries = [];

    if (scalar) {
      blocks.push({ entries, indent, scalar });
      continue;
    }

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const line = lines[cursor];
      if (!line.trim() || line.trimStart().startsWith("#")) continue;

      const lineIndent = line.match(/^\s*/)[0].length;
      if (lineIndent <= indent) break;

      assert.equal(
        lineIndent,
        indent + 2,
        `${name} has a nested or malformed permissions entry: ${line.trim()}`,
      );

      const entry = line.trim().match(/^([A-Za-z0-9_-]+):\s*([A-Za-z0-9_-]+)$/);
      assert.ok(entry, `${name} has an invalid permissions entry: ${line.trim()}`);
      entries.push({ access: entry[2], scope: entry[1] });
    }

    blocks.push({ entries, indent, scalar: null });
  }

  assert.ok(blocks.length > 0, `${name} must declare permissions`);
  return blocks;
};

const assertAllowedWorkflowPermissions = (workflow, name) => {
  const allowed = new Map([
    ["contents", "read"],
    ["issues", "write"],
  ]);
  const blocks = workflowPermissionBlocks(workflow, name);

  for (const block of blocks) {
    assert.equal(block.scalar, null, `${name} must not use scalar permissions shortcuts`);
    assert.ok(block.entries.length > 0, `${name} has an empty permissions block`);
    assertUnique(
      block.entries.map((entry) => entry.scope),
      `${name} permission scopes`,
    );

    for (const { access, scope } of block.entries) {
      assert.ok(allowed.has(scope), `${name} requests disallowed permission scope ${scope}`);
      assert.equal(
        access,
        allowed.get(scope),
        `${name} requests disallowed ${scope}: ${access}`,
      );
    }
  }

  const workflowLevel = blocks.filter((block) => block.indent === 0);
  assert.equal(workflowLevel.length, 1, `${name} must have one workflow-level permissions block`);
  assert.deepEqual(
    workflowLevel[0].entries
      .map((entry) => `${entry.scope}:${entry.access}`)
      .sort(),
    ["contents:read", "issues:write"],
    `${name} workflow-level permissions must match the complete allowlist`,
  );
};

const assertMainBranchMutationGuard = (workflow, name, guardedJob) => {
  assert.ok(workflow.includes("validate-ref:"), `${name} must define a ref-validation job`);
  assert.ok(workflow.includes("name: Require main branch"), `${name} must name the main guard`);
  assert.ok(
    workflow.includes('if [ "${GITHUB_REF}" != "refs/heads/main" ]; then'),
    `${name} must compare GITHUB_REF with refs/heads/main`,
  );
  assert.ok(workflow.includes("exit 1"), `${name} non-main guard must fail, not skip`);

  const normalized = normalizeWhitespace(workflow);
  assert.ok(
    normalized.includes(`${guardedJob}: name:`) &&
      normalized.includes(`${guardedJob}: name:`) &&
      new RegExp(`${guardedJob}:.*?needs: validate-ref`).test(normalized),
    `${name} mutation job ${guardedJob} must depend on validate-ref`,
  );
};

const workflowUses = (workflow) =>
  [...workflow.matchAll(/^\s*uses:\s*([^\s#]+)/gm)].map((match) => match[1]);

const workflowApiPayloads = (workflow) => {
  const lines = workflow.split("\n");
  const payloads = [];

  for (let index = 0; index < lines.length; index += 1) {
    const apiCall = lines[index].match(/gh api --method (POST|PATCH) "([^"]+)"/);
    if (!apiCall) continue;

    const payloadLine = lines
      .slice(Math.max(0, index - 16), index)
      .reverse()
      .find((line) => /^'\{.*\}' \|$/.test(line.trim()));

    assert.ok(payloadLine, `Missing jq payload for ${apiCall[1]} ${apiCall[2]}`);
    payloads.push({
      endpoint: apiCall[2],
      method: apiCall[1],
      payload: payloadLine.trim(),
    });
  }

  return payloads;
};

const requireWorkflowApiPayload = (payloads, method, endpoint) => {
  const matches = payloads.filter(
    (payload) => payload.method === method && payload.endpoint === endpoint,
  );

  assert.equal(matches.length, 1, `Expected one ${method} payload for ${endpoint}`);
  return matches[0].payload;
};

test("managed labels use valid unique names, colors, and descriptions", async () => {
  const labels = await readJson(".github/labels.json");

  assert.ok(Array.isArray(labels) && labels.length > 0);
  assertUnique(
    labels.map((label) => label.name),
    "Label names",
  );

  for (const label of labels) {
    assert.match(label.name, /^\S(?:.*\S)?$/, `Invalid label name: ${label.name}`);
    assert.ok(label.name.length <= 50, `Label name exceeds 50 characters: ${label.name}`);
    assert.match(label.color, /^[0-9A-F]{6}$/, `Invalid label color for ${label.name}`);
    assert.equal(typeof label.description, "string");
    assert.ok(
      label.description.length <= 100,
      `Label description exceeds 100 characters: ${label.name}`,
    );
  }
});

test("milestone declarations have unique stable keys and titles", async () => {
  const milestones = await readJson(".github/milestones.json");

  assert.ok(Array.isArray(milestones) && milestones.length > 0);
  assertUnique(
    milestones.map((milestone) => milestone.key),
    "Milestone keys",
  );
  assertUnique(
    milestones.map((milestone) => milestone.title),
    "Milestone titles",
  );

  for (const milestone of milestones) {
    assert.match(milestone.key, /^[a-z0-9-]+$/);
    assert.ok(milestone.title.trim());
    assert.ok(milestone.description.trim());
  }
});

test("initial backlog references declared labels, milestones, bodies, and issue keys", async () => {
  const [labels, milestones, issues] = await Promise.all([
    readJson(".github/labels.json"),
    readJson(".github/milestones.json"),
    readJson(".github/backlog/issues.json"),
  ]);

  const labelNames = new Set(labels.map((label) => label.name));
  const milestoneKeys = new Set(milestones.map((milestone) => milestone.key));
  const issueKeys = new Set(issues.map((issue) => issue.key));

  assert.ok(Array.isArray(issues) && issues.length > 0);
  assertUnique(
    issues.map((issue) => issue.key),
    "Issue keys",
  );
  assertUnique(
    issues.map((issue) => issue.title),
    "Issue titles",
  );

  for (const issue of issues) {
    assert.match(issue.key, /^[a-z0-9-]+$/);
    assert.ok(issue.title.trim());
    assert.ok(issue.body_file.startsWith(".github/backlog/"));
    assert.ok(issue.body_file.endsWith(".md"));
    assert.ok(Array.isArray(issue.labels) && issue.labels.length > 0);

    for (const label of issue.labels) {
      assert.ok(labelNames.has(label), `${issue.key} references undeclared label ${label}`);
    }

    if (issue.milestone !== null) {
      assert.ok(
        milestoneKeys.has(issue.milestone),
        `${issue.key} references undeclared milestone ${issue.milestone}`,
      );
    }

    const body = await readText(issue.body_file);
    assert.ok(body.trim(), `${issue.body_file} must not be empty`);

    for (const match of body.matchAll(/\{\{issue:([a-z0-9-]+)\}\}/g)) {
      assert.ok(
        issueKeys.has(match[1]),
        `${issue.body_file} references unknown issue key ${match[1]}`,
      );
    }
  }
});

test("managed leaf labels preserve upstream and breaking-change traceability", async () => {
  const issues = await readJson(".github/backlog/issues.json");

  for (const issue of issues) {
    if (issue.labels.includes("epic")) continue;

    const body = await readText(issue.body_file);
    const originatedUpstream =
      body.includes("github.com/benct/lovelace-xiaomi-vacuum-card/issues/") ||
      body.includes("github.com/benct/lovelace-xiaomi-vacuum-card/pull/");
    const breakingRisk = /Breaking change:\s*(Potential|Yes)\b/.test(body);

    if (originatedUpstream) {
      assert.ok(
        issue.labels.includes("source:upstream"),
        `${issue.key} cites upstream origin without source:upstream`,
      );
    }

    if (breakingRisk) {
      assert.ok(
        issue.labels.includes("breaking-change"),
        `${issue.key} declares breaking risk without breaking-change`,
      );
    }
  }
});

test("action epic keeps feature priority separate from shared test prerequisites", async () => {
  const issues = await readJson(".github/backlog/issues.json");
  const epic = issues.find((issue) => issue.key === "epic-actions-area-cleaning");

  assert.ok(epic, "Action and area-cleaning epic must be declared");
  assert.ok(epic.labels.includes("priority:P1"), "Action epic should remain next-minor P1 work");

  const body = await readText(epic.body_file);
  assert.ok(body.includes("## Shared external prerequisites"));
  assert.ok(body.includes("do not automatically promote every downstream epic"));
  assert.ok(body.includes("The component harness is P0 because"));
});

test("canonical maintainer templates contain required planning and label guidance", async () => {
  const workItem = await readText(".github/ISSUE_TEMPLATE/work_item.md");
  const epic = await readText(".github/ISSUE_TEMPLATE/epic.md");
  const normalizedWorkItem = normalizeWhitespace(workItem);
  const normalizedEpic = normalizeWhitespace(epic);

  for (const heading of [
    "## Problem",
    "## Evidence and upstream references",
    "## Scope",
    "## Non-goals",
    "## Proposed behavior",
    "## Acceptance criteria",
    "## Test plan",
    "## Compatibility and migration",
    "## Dependencies",
    "## Release impact",
  ]) {
    assert.ok(workItem.includes(heading), `Work item template is missing ${heading}`);
  }

  for (const testLayer of [
    "Node unit or contract tests",
    "Real browser component tests",
    "Pinned Home Assistant smoke test",
    "Shared sanitized fixtures",
    "Test-layer rationale",
  ]) {
    assert.ok(workItem.includes(testLayer), `Work item template is missing ${testLayer}`);
  }

  for (const metadataRule of [
    "exactly one `priority:*` label",
    "exactly one `type:*` label",
    "one or two `area:*` labels",
  ]) {
    assert.ok(
      normalizedWorkItem.includes(metadataRule),
      `Work item template is missing ${metadataRule}`,
    );
  }

  for (const heading of [
    "## Outcome",
    "## Why this matters",
    "## Scope",
    "## Non-goals",
    "## Child issues",
    "## Exit criteria",
    "## Release plan",
  ]) {
    assert.ok(epic.includes(heading), `Epic template is missing ${heading}`);
  }

  for (const metadataRule of [
    "one `priority:*` label",
    "one or two `area:*` labels",
    "do not require a `type:*` label",
  ]) {
    assert.ok(normalizedEpic.includes(metadataRule), `Epic template is missing ${metadataRule}`);
  }
});

test("bootstrap guide scopes issue bodies and enforces the main merge gate", async () => {
  const guide = await readText(".github/backlog/bootstrap-guide.md");

  for (const requirement of [
    "referenced by `body_file` in `issues.json`",
    "feature branch",
    "pull request targeting `main`",
    "required CI checks to pass",
    "Merge the reviewed pull request into `main`",
    "workflow manually from `main`",
    "every `{{issue:<key>}}` reference resolves to a declared key",
    "every `body_file` exists",
  ]) {
    assert.ok(guide.includes(requirement), `Bootstrap guide is missing ${requirement}`);
  }
});

test("testing strategy declares target and interim quality gates", async () => {
  const [labels, issues, strategy, governance, testing, reactiveIssue] = await Promise.all([
    readJson(".github/labels.json"),
    readJson(".github/backlog/issues.json"),
    readText("docs/maintainers/testing-strategy.md"),
    readText("docs/maintainers/backlog-governance.md"),
    readText("TESTING.md"),
    readText(".github/backlog/p0-reactive-external-entities.md"),
  ]);

  const labelNames = new Set(labels.map((label) => label.name));
  const issueKeys = new Set(issues.map((issue) => issue.key));

  assert.ok(labelNames.has("area:testing"), "Testing work requires area:testing");

  for (const key of [
    "epic-testing-architecture",
    "p0-real-lit-component-tests",
    "p1-reproducible-ha-smoke",
    "p1-entity-fixture-matrix",
  ]) {
    assert.ok(issueKeys.has(key), `Testing backlog is missing ${key}`);
  }

  for (const heading of [
    "## Decision",
    "## Current test system",
    "## Findings and risks",
    "## Target test architecture",
    "## Quality gates by change type",
    "## Interim rules before target layers exist",
    "### Interim Home Assistant smoke rule",
    "## Required sequence before major development",
    "## CI recommendations",
    "## Backlog mapping",
  ]) {
    assert.ok(strategy.includes(heading), `Testing strategy is missing ${heading}`);
  }

  for (const requirement of [
    "### Interim quality gates",
    "### Target quality gates",
    "resolved Home Assistant image identifier or digest",
    "immutable digest-pinned smoke test passes",
  ]) {
    assert.ok(governance.includes(requirement), `Backlog governance is missing ${requirement}`);
  }

  assert.ok(testing.includes("### Interim smoke rule"));
  assert.ok(testing.includes("### Target smoke rule"));
  assert.ok(testing.includes("@sha256:<digest>"));
  assert.ok(
    reactiveIssue.includes("{{issue:p0-real-lit-component-tests}}"),
    "External-entity reactivity must depend on the real Lit component harness",
  );
});

test("test-foundation issue contracts remain implementation-ready", async () => {
  const [battery, nativeVacuum, component, fixtures, smoke] = await Promise.all([
    readText(".github/backlog/p0-device-aware-battery.md"),
    readText(".github/backlog/p0-native-vacuum-state-features.md"),
    readText(".github/backlog/p0-real-lit-component-tests.md"),
    readText(".github/backlog/p1-entity-fixture-matrix.md"),
    readText(".github/backlog/p1-reproducible-ha-smoke.md"),
  ]);

  for (const requirement of [
    "## Proposed behavior",
    "### Home Assistant registry input contract",
    "getRegistrySnapshot(hass)",
    "actual `hass` object assigned to the mounted card",
    "production-shaped registry fixture",
  ]) {
    assert.ok(battery.includes(requirement), `Battery issue is missing ${requirement}`);
  }

  assert.ok(!nativeVacuum.includes("| `vacuum.turn_on`"));
  assert.ok(!nativeVacuum.includes("| `vacuum.turn_off`"));
  assert.ok(nativeVacuum.includes("### Legacy toggle-service compatibility"));
  assert.ok(nativeVacuum.includes("must therefore not infer modern automatic capability"));

  assert.ok(component.includes("Replacing only a referenced external sensor state updates"));
  assert.ok(component.includes("the regression test passes after the runtime fix"));

  assert.ok(fixtures.includes('"schema_version": 1'));
  assert.ok(fixtures.includes('"supported_features": 4096'));
  assert.ok(fixtures.includes("legacy-attribute-vacuum-no-state-feature"));
  assert.ok(fixtures.includes("reject missing and unknown future schema versions"));

  assert.ok(smoke.includes("@sha256:<digest>"));
  assert.ok(smoke.includes("rejects tag-only references"));
  assert.ok(smoke.includes("semantic version tags"));
});

test("workflow trigger allowlist rejects quoted automatic triggers", () => {
  const workflow = `on:
  "push":
  'workflow_dispatch':
permissions:
  contents: read
`;

  assert.throws(
    () => assertAllowedWorkflowTriggers(workflow, "Quoted trigger fixture", ["workflow_dispatch"]),
    /automatic or unsupported trigger/,
  );
});

test("workflow permission allowlist rejects extra or elevated scopes", () => {
  const workflow = `on:
  workflow_dispatch:
permissions:
  contents: read
  issues: write
jobs:
  mutate:
    permissions:
      contents: write
      pull-requests: write
`;

  assert.throws(
    () => assertAllowedWorkflowPermissions(workflow, "Unsafe permission fixture"),
    /disallowed permission|disallowed .*: write/,
  );
});

test("bootstrap workflows use main guards, allowed triggers, permissions, and pinned actions", async () => {
  const [syncLabels, bootstrapBacklog] = await Promise.all([
    readText(".github/workflows/sync-labels.yml"),
    readText(".github/workflows/bootstrap-backlog.yml"),
  ]);

  const workflows = [
    {
      guardedJob: "sync-labels",
      name: "Sync labels",
      workflow: syncLabels,
      allowedTriggers: ["workflow_call", "workflow_dispatch"],
    },
    {
      guardedJob: "sync-labels",
      name: "Bootstrap backlog",
      workflow: bootstrapBacklog,
      allowedTriggers: ["workflow_dispatch"],
    },
  ];

  for (const { allowedTriggers, guardedJob, name, workflow } of workflows) {
    assertAllowedWorkflowTriggers(workflow, name, allowedTriggers);
    assertAllowedWorkflowPermissions(workflow, name);
    assertMainBranchMutationGuard(workflow, name, guardedJob);
    assert.ok(
      !workflow.includes("pull_request_target"),
      `${name} must not use pull_request_target`,
    );
    assert.ok(!workflow.includes("secrets."), `${name} must not require a stored personal token`);
    assert.ok(
      workflow.includes("persist-credentials: false"),
      `${name} checkout must not persist credentials`,
    );

    for (const uses of workflowUses(workflow)) {
      if (uses.startsWith("./")) continue;
      assert.match(
        uses,
        /^[^@\s]+@[0-9a-f]{40}$/,
        `${name} external action must be pinned to a full commit SHA: ${uses}`,
      );
    }
  }
});

test("backlog bootstrap preserves milestone and issue state by command", async () => {
  const bootstrap = await readText(".github/workflows/bootstrap-backlog.yml");
  const payloads = workflowApiPayloads(bootstrap);

  const milestoneCreate = requireWorkflowApiPayload(
    payloads,
    "POST",
    "repos/${GITHUB_REPOSITORY}/milestones",
  );
  const milestoneUpdate = requireWorkflowApiPayload(
    payloads,
    "PATCH",
    "repos/${GITHUB_REPOSITORY}/milestones/${number}",
  );
  const issueCreate = requireWorkflowApiPayload(
    payloads,
    "POST",
    "repos/${GITHUB_REPOSITORY}/issues",
  );
  const issueUpdate = requireWorkflowApiPayload(
    payloads,
    "PATCH",
    "repos/${GITHUB_REPOSITORY}/issues/${number}",
  );

  assert.match(milestoneCreate, /state: "open"/, "Milestone creation must set open state");

  for (const [name, payload] of [
    ["milestone update", milestoneUpdate],
    ["issue creation", issueCreate],
    ["issue reconciliation", issueUpdate],
  ]) {
    assert.doesNotMatch(payload, /state: "open"/, `${name} must not set open state`);
  }
});

test("backlog bootstrap reconciles issues only by managed marker", async () => {
  const bootstrap = await readText(".github/workflows/bootstrap-backlog.yml");

  assert.ok(
    bootstrap.includes("contains($marker)"),
    "Managed issues must be discovered by their stable marker",
  );
  assert.ok(
    bootstrap.includes("Refusing to adopt unmarked issue"),
    "Unmarked title collisions must stop reconciliation",
  );
  assert.ok(
    bootstrap.includes("Multiple issues contain the managed marker"),
    "Duplicate managed markers must stop reconciliation",
  );
  assert.ok(
    bootstrap.includes("printf '%s\\n\\n' \"${marker}\""),
    "New issues must contain their marker from the first API call",
  );
  assert.ok(
    bootstrap.includes("--json number,title,body"),
    "Issue discovery must read bodies before selecting a managed issue",
  );
});
