import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const readText = async (relativePath) => {
  const content = await readFile(path.join(repositoryRoot, relativePath), "utf8");
  return content.replace(/\r\n/g, "\n");
};

const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

const parseDependabotUpdates = (yamlText) => {
  const lines = yamlText.replace(/\r\n/g, "\n").split("\n");
  const updates = [];
  let currentUpdate = null;
  let inLabels = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    const ecosystemMatch = line.match(/^\s*-\s*package-ecosystem:\s*"?([^"\s]+)"?/);
    if (ecosystemMatch) {
      currentUpdate = {
        ecosystem: ecosystemMatch[1],
        labels: [],
      };
      updates.push(currentUpdate);
      inLabels = false;
      continue;
    }

    if (!currentUpdate) continue;

    const labelsHeaderMatch = line.match(/^\s+labels:\s*$/);
    if (labelsHeaderMatch) {
      inLabels = true;
      continue;
    }

    if (inLabels) {
      const labelItemMatch = line.match(/^\s+-\s+"?([^"\s]+)"?\s*$/);
      if (labelItemMatch) {
        currentUpdate.labels.push(labelItemMatch[1]);
        continue;
      }
      if (trimmed.length > 0) {
        inLabels = false;
      }
    }
  }

  return updates;
};

const EXPECTED_ECOSYSTEMS = ["npm", "github-actions"];
const EXPECTED_LABELS = ["dependencies", "type:chore", "area:ci-release"];
const PROHIBITED_LABELS = ["javascript", "github-actions"];

test("dependabot.yml declares required package ecosystems with unified labels", async () => {
  const dependabotConfig = await readText(".github/dependabot.yml");
  const updates = parseDependabotUpdates(dependabotConfig);

  assert.ok(
    updates.length >= EXPECTED_ECOSYSTEMS.length,
    `dependabot.yml must declare at least ${EXPECTED_ECOSYSTEMS.length} ecosystem update blocks`,
  );

  const targetUpdates = updates.filter((update) => EXPECTED_ECOSYSTEMS.includes(update.ecosystem));
  const declaredTargetEcosystems = targetUpdates.map((update) => update.ecosystem);
  assert.deepEqual(
    declaredTargetEcosystems.sort(),
    [...EXPECTED_ECOSYSTEMS].sort(),
    `dependabot.yml must declare target ecosystems: ${EXPECTED_ECOSYSTEMS.join(", ")}`,
  );

  for (const ecosystem of EXPECTED_ECOSYSTEMS) {
    const update = targetUpdates.find((u) => u.ecosystem === ecosystem);
    assert.ok(update, `dependabot.yml missing update configuration for ${ecosystem}`);
    assert.deepEqual(
      [...update.labels].sort(),
      [...EXPECTED_LABELS].sort(),
      `dependabot.yml for ${ecosystem} must specify labels: ${EXPECTED_LABELS.join(", ")}`,
    );
  }
});

test("all labels in dependabot.yml exist in .github/labels.json", async () => {
  const [dependabotConfig, labels] = await Promise.all([
    readText(".github/dependabot.yml"),
    readJson(".github/labels.json"),
  ]);

  const declaredLabelNames = new Set(labels.map((l) => l.name));
  const updates = parseDependabotUpdates(dependabotConfig);

  for (const update of updates) {
    for (const label of update.labels) {
      assert.ok(
        declaredLabelNames.has(label),
        `Label '${label}' used in dependabot.yml (${update.ecosystem}) is not declared in .github/labels.json`,
      );
    }
  }
});

test("dependabot.yml does not use legacy ecosystem labels in label blocks", async () => {
  const dependabotConfig = await readText(".github/dependabot.yml");
  const updates = parseDependabotUpdates(dependabotConfig);

  for (const update of updates) {
    for (const prohibited of PROHIBITED_LABELS) {
      assert.ok(
        !update.labels.includes(prohibited),
        `dependabot.yml (${update.ecosystem}) must not include prohibited label '${prohibited}'`,
      );
    }
  }
});

test("dependencies label is declared in .github/labels.json with valid schema", async () => {
  const labels = await readJson(".github/labels.json");
  const depLabel = labels.find((l) => l.name === "dependencies");

  assert.ok(depLabel, "dependencies label must be declared in .github/labels.json");
  assert.equal(depLabel.color, "0366D6", "dependencies label must have color 0366D6");
  assert.ok(
    typeof depLabel.description === "string" && depLabel.description.trim().length > 0,
    "dependencies label must have non-empty description",
  );
  assert.ok(
    depLabel.description.length <= 100,
    "dependencies label description must not exceed 100 characters",
  );
});

test("backlog governance documentation specifies dependencies supporting label", async () => {
  const governanceDoc = await readText("docs/maintainers/backlog-governance.md");

  assert.ok(
    governanceDoc.includes("`dependencies`"),
    "backlog-governance.md must mention `dependencies` label",
  );
  assert.ok(
    governanceDoc.includes("`type:chore`") && governanceDoc.includes("`area:ci-release`"),
    "backlog-governance.md must explain interaction with type:chore and area:ci-release",
  );
});

test("dependency workflow documentation defines updated taxonomy and avoids legacy ecosystem labels", async () => {
  const workflowDoc = await readText("docs/dependency-workflow.md");

  assert.ok(
    workflowDoc.includes("`dependencies`"),
    "dependency-workflow.md must specify `dependencies` label",
  );
  assert.ok(
    workflowDoc.includes("`type:chore`"),
    "dependency-workflow.md must specify `type:chore` label",
  );
  assert.ok(
    workflowDoc.includes("`area:ci-release`"),
    "dependency-workflow.md must specify `area:ci-release` label",
  );
  assert.doesNotMatch(
    workflowDoc,
    /language-specific labels/i,
    "dependency-workflow.md must not promise language-specific labels",
  );
  assert.doesNotMatch(
    workflowDoc,
    /\(e\.g\.\s*`?javascript`?\)/i,
    "dependency-workflow.md must not cite javascript as a label example",
  );
});
