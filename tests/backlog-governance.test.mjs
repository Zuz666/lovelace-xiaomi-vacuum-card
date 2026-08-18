import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const readText = (relativePath) => readFile(path.join(repositoryRoot, relativePath), "utf8");

const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

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

  return [...triggerBlock[1].matchAll(/^  ([A-Za-z_][A-Za-z0-9_]*):/gm)].map(
    (match) => match[1],
  );
};

const workflowUses = (workflow) =>
  [...workflow.matchAll(/^\s*uses:\s*([^\s#]+)/gm)].map((match) => match[1]);

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

test("canonical maintainer templates contain required planning sections", async () => {
  const workItem = await readText(".github/ISSUE_TEMPLATE/work_item.md");
  const epic = await readText(".github/ISSUE_TEMPLATE/epic.md");

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
});

test("testing strategy and critical test backlog remain declared", async () => {
  const [labels, issues, strategy, reactiveIssue] = await Promise.all([
    readJson(".github/labels.json"),
    readJson(".github/backlog/issues.json"),
    readText("docs/maintainers/testing-strategy.md"),
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
    "## Required sequence before major development",
    "## CI recommendations",
    "## Backlog mapping",
  ]) {
    assert.ok(strategy.includes(heading), `Testing strategy is missing ${heading}`);
  }

  assert.ok(
    reactiveIssue.includes("{{issue:p0-real-lit-component-tests}}"),
    "External-entity reactivity must depend on the real Lit component harness",
  );
});

test("bootstrap workflows use only allowed manual triggers and pinned external actions", async () => {
  const [syncLabels, bootstrapBacklog] = await Promise.all([
    readText(".github/workflows/sync-labels.yml"),
    readText(".github/workflows/bootstrap-backlog.yml"),
  ]);

  const workflows = [
    {
      name: "Sync labels",
      workflow: syncLabels,
      allowedTriggers: ["workflow_call", "workflow_dispatch"],
    },
    {
      name: "Bootstrap backlog",
      workflow: bootstrapBacklog,
      allowedTriggers: ["workflow_dispatch"],
    },
  ];

  for (const { name, workflow, allowedTriggers } of workflows) {
    assert.deepEqual(
      workflowTriggerKeys(workflow, name).sort(),
      [...allowedTriggers].sort(),
      `${name} has an automatic or unsupported trigger`,
    );
    assert.ok(
      workflow.includes("contents: read"),
      `${name} must use read-only contents permission`,
    );
    assert.ok(workflow.includes("issues: write"), `${name} requires issues write permission`);
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

test("backlog bootstrap preserves milestone state and reconciles issues by marker", async () => {
  const bootstrap = await readText(".github/workflows/bootstrap-backlog.yml");

  assert.equal(
    (bootstrap.match(/state: "open"/g) || []).length,
    1,
    "Only milestone creation may set state to open",
  );
  assert.ok(
    bootstrap.includes('contains($marker)'),
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
