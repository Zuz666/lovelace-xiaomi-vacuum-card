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

test("bootstrap workflows remain manual and least-privileged", async () => {
  const [syncLabels, bootstrapBacklog] = await Promise.all([
    readText(".github/workflows/sync-labels.yml"),
    readText(".github/workflows/bootstrap-backlog.yml"),
  ]);

  for (const [name, workflow] of [
    ["Sync labels", syncLabels],
    ["Bootstrap backlog", bootstrapBacklog],
  ]) {
    assert.ok(workflow.includes("workflow_dispatch:"), `${name} must be manually dispatchable`);
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
  }
});
