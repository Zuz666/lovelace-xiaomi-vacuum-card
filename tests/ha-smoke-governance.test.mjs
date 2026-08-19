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

export const HA_IMMUTABLE_IMAGE_PATTERN =
  /^ghcr\.io\/home-assistant\/home-assistant@sha256:[0-9a-f]{64}$/;

export const HA_BASELINE_RELEASE_PATTERN = /^\d{4}\.\d+\.\d+(?:b\d+)?$/;

export const EXPECTED_BASELINE_RELEASE = "2026.6.1";
export const EXPECTED_BASELINE_DIGEST =
  "ghcr.io/home-assistant/home-assistant@sha256:59aa8824955c9db491b75d2eebe42bd68494f80c2ec69ec0d66d9dae37d37514";
export function validateHomeAssistantBaselineImage(imageReference) {
  if (typeof imageReference !== "string" || !imageReference.trim()) {
    throw new Error("Home Assistant baseline image reference must be a non-empty string");
  }

  const trimmed = imageReference.trim();

  if (!trimmed.startsWith("ghcr.io/home-assistant/home-assistant@sha256:")) {
    if (trimmed.includes(":stable") || trimmed.includes(":beta") || trimmed.includes(":dev")) {
      throw new Error(
        `Mutable channel tag is prohibited for required smoke baseline: ${imageReference}`,
      );
    }

    if (trimmed.includes(":") && !trimmed.includes("@sha256:")) {
      throw new Error(
        `Tag-only or release-tag reference is prohibited for required smoke baseline: ${imageReference}`,
      );
    }

    throw new Error(
      `Home Assistant baseline image must use ghcr.io/home-assistant/home-assistant@sha256:<digest>: ${imageReference}`,
    );
  }

  if (!HA_IMMUTABLE_IMAGE_PATTERN.test(trimmed)) {
    throw new Error(
      `Home Assistant baseline image digest must be exactly 64 lowercase hex characters: ${imageReference}`,
    );
  }

  return true;
}

const extractHaSmokeEnv = (workflowText) => {
  const haSmokeJobMatch = workflowText.match(/ha-smoke:\s*\n[\s\S]*?env:\s*\n([\s\S]*?)steps:/);
  if (!haSmokeJobMatch) {
    throw new Error("Could not find ha-smoke job env block in workflow");
  }

  const envBlock = haSmokeJobMatch[1];
  const imageMatch = envBlock.match(/HA_IMAGE:\s*["']?([^"'\r\n]+)["']?/);
  const releaseMatch = envBlock.match(/HA_BASELINE_RELEASE:\s*["']?([^"'\r\n]+)["']?/);

  return {
    image: imageMatch ? imageMatch[1].trim() : null,
    release: releaseMatch ? releaseMatch[1].trim() : null,
  };
};

const assertStrictContentsReadPermissions = (workflowText, workflowName) => {
  const permissionsMatch = workflowText.match(/^permissions:\s*\n([\s\S]*?)(?=\n[A-Za-z_]|$)/m);
  assert.ok(permissionsMatch, `${workflowName} must define top-level permissions block`);

  const lines = permissionsMatch[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  assert.deepEqual(
    lines,
    ["contents: read"],
    `${workflowName} permissions must strictly be 'contents: read' with no extra or elevated scopes: ${lines.join(", ")}`,
  );
};

test("validateHomeAssistantBaselineImage accepts valid immutable sha256 reference", () => {
  const validDigest =
    "ghcr.io/home-assistant/home-assistant@sha256:59aa8824955c9db491b75d2eebe42bd68494f80c2ec69ec0d66d9dae37d37514";

  assert.equal(validateHomeAssistantBaselineImage(validDigest), true);
});

test("validateHomeAssistantBaselineImage rejects tag-only and mutable references", () => {
  const rejectedReferences = [
    "ghcr.io/home-assistant/home-assistant:stable",
    "ghcr.io/home-assistant/home-assistant:beta",
    "ghcr.io/home-assistant/home-assistant:dev",
    "ghcr.io/home-assistant/home-assistant:2026.6.1",
    "ghcr.io/home-assistant/home-assistant:latest",
    "homeassistant/home-assistant:stable",
    "homeassistant/home-assistant:2026.6.1",
    "ghcr.io/home-assistant/home-assistant",
  ];

  for (const ref of rejectedReferences) {
    assert.throws(
      () => validateHomeAssistantBaselineImage(ref),
      /prohibited|must use|tag-only/i,
      `Should reject mutable/tag reference: ${ref}`,
    );
  }
});

test("validateHomeAssistantBaselineImage rejects malformed digests, casing, and tag-plus-digest", () => {
  const malformedReferences = [
    "ghcr.io/home-assistant/home-assistant@sha256:short",
    "ghcr.io/home-assistant/home-assistant@sha256:59aa8824",
    "ghcr.io/home-assistant/home-assistant@sha256:59AA8824955C9DB491B75D2EEBE42BD68494F80C2EC69EC0D66D9DAE37D37514",
    "ghcr.io/home-assistant/home-assistant:stable@sha256:59aa8824955c9db491b75d2eebe42bd68494f80c2ec69ec0d66d9dae37d37514",
    "ghcr.io/home-assistant/core@sha256:59aa8824955c9db491b75d2eebe42bd68494f80c2ec69ec0d66d9dae37d37514",
    "",
    null,
    undefined,
  ];

  for (const ref of malformedReferences) {
    assert.throws(
      () => validateHomeAssistantBaselineImage(ref),
      /must|digest|lowercase|non-empty|prohibited/i,
      `Should reject malformed reference: ${ref}`,
    );
  }
});

test("required CI ha-smoke job uses pinned digest and recorded release", async () => {
  const ciWorkflow = await readText(".github/workflows/ci.yml");
  const { image, release } = extractHaSmokeEnv(ciWorkflow);

  assert.ok(image, "ci.yml ha-smoke job must define HA_IMAGE");
  assert.ok(release, "ci.yml ha-smoke job must define HA_BASELINE_RELEASE");

  assert.equal(
    release,
    EXPECTED_BASELINE_RELEASE,
    `ci.yml HA_BASELINE_RELEASE must equal expected baseline release ${EXPECTED_BASELINE_RELEASE}: ${release}`,
  );
  assert.equal(
    image,
    EXPECTED_BASELINE_DIGEST,
    `ci.yml HA_IMAGE must equal expected baseline digest ${EXPECTED_BASELINE_DIGEST}: ${image}`,
  );

  assert.equal(
    validateHomeAssistantBaselineImage(image),
    true,
    `ci.yml HA_IMAGE must be a valid immutable sha256 reference: ${image}`,
  );

  assert.match(
    release,
    HA_BASELINE_RELEASE_PATTERN,
    `ci.yml HA_BASELINE_RELEASE must match release pattern: ${release}`,
  );
});

test("ci.yml has pull-request concurrency cancellation, artifact upload, and container cleanup", async () => {
  const ciWorkflow = await readText(".github/workflows/ci.yml");
  assertStrictContentsReadPermissions(ciWorkflow, "ci.yml");
  assert.doesNotMatch(ciWorkflow, /secrets\./, "ci.yml must not require personal access tokens");

  assert.match(
    ciWorkflow,
    /concurrency:\s*\n\s*group:\s*\${{\s*github\.workflow\s*}}/,
    "ci.yml must configure workflow concurrency group",
  );
  assert.match(
    ciWorkflow,
    /cancel-in-progress:\s*\${{\s*github\.event_name\s*==\s*['"]pull_request['"]\s*}}/,
    "ci.yml must cancel in-progress runs on pull requests",
  );

  assert.match(
    ciWorkflow,
    /name:\s*Capture Home Assistant logs\s*\n\s*if:\s*always\(\)\s*\n\s*run:\s*\|\s*\n\s*docker logs ha-smoke > ha-smoke\.log/,
    "ci.yml must capture HA logs on always() condition",
  );
  assert.match(
    ciWorkflow,
    /name:\s*Upload Home Assistant logs on failure\s*\n\s*if:\s*failure\(\)\s*\n\s*uses:\s*actions\/upload-artifact@[0-9a-f]{40}[\s\S]*?path:\s*ha-smoke\.log/,
    "ci.yml must upload ha-smoke.log on failure() condition",
  );
  assert.match(
    ciWorkflow,
    /name:\s*Upload Playwright artifacts on failure\s*\n\s*if:\s*failure\(\)\s*\n\s*uses:\s*actions\/upload-artifact@[0-9a-f]{40}[\s\S]*?path:\s*\|\s*\n\s*playwright-report\/\s*\n\s*test-results\//,
    "ci.yml must upload playwright-report and test-results on failure() condition",
  );
  assert.match(
    ciWorkflow,
    /name:\s*Add smoke test summary\s*\n\s*if:\s*always\(\)[\s\S]*?\$\{?HA_BASELINE_RELEASE\}?[\s\S]*?\$\{?HA_IMAGE\}?[\s\S]*?npm run test:ha-smoke/,
    "ci.yml must write summary with baseline release, digest, and scenario on always() condition",
  );
  assert.match(
    ciWorkflow,
    /name:\s*Stop and remove Home Assistant container\s*\n\s*if:\s*always\(\)\s*\n\s*run:\s*\|\s*\n\s*docker rm -f ha-smoke/,
    "ci.yml must force-remove ha-smoke container on always() condition",
  );
  const actionMatches = [...ciWorkflow.matchAll(/uses:\s*([^@\s]+)@([^\s#]+)/g)];
  for (const match of actionMatches) {
    const actionName = match[1];
    const ref = match[2];
    assert.match(
      ref,
      /^[0-9a-f]{40}$/,
      `External action ${actionName} in ci.yml must be pinned to full commit SHA: ${ref}`,
    );
  }
});

test("ha-canary.yml exists with allowed triggers, permissions, and failure handling", async () => {
  const canaryWorkflow = await readText(".github/workflows/ha-canary.yml");

  assert.match(
    canaryWorkflow,
    /name:\s*Home Assistant Canary/,
    "ha-canary.yml must be named Home Assistant Canary",
  );
  assert.match(
    canaryWorkflow,
    /schedule:\s*\n\s*-\s*cron:/,
    "ha-canary.yml must configure scheduled trigger",
  );
  assert.match(
    canaryWorkflow,
    /workflow_dispatch:/,
    "ha-canary.yml must configure workflow_dispatch trigger",
  );
  assert.doesNotMatch(
    canaryWorkflow,
    /pull_request/,
    "ha-canary.yml must not run on pull_request to keep PR checks deterministic",
  );

  assertStrictContentsReadPermissions(canaryWorkflow, "ha-canary.yml");
  assert.doesNotMatch(
    canaryWorkflow,
    /secrets\./,
    "ha-canary.yml must not require personal access tokens",
  );

  assert.ok(
    canaryWorkflow.includes("canary-smoke (${{ matrix.channel }})"),
    "ha-canary.yml must use distinct job names for each channel",
  );
  assert.ok(
    canaryWorkflow.includes("Upload Home Assistant logs on failure"),
    "ha-canary.yml must upload HA logs on failure",
  );
  assert.ok(
    canaryWorkflow.includes("Add canary summary"),
    "ha-canary.yml must write canary summary",
  );
  assert.match(
    canaryWorkflow,
    /name:\s*Add canary summary\s*\n\s*if:\s*always\(\)[\s\S]*?npm run test:ha-smoke/,
    "ha-canary.yml must report scenario npm run test:ha-smoke in summary",
  );
  assert.match(
    canaryWorkflow,
    /docker rm -f "ha-canary-\${{\s*matrix\.channel\s*}}"/,
    "ha-canary.yml must force-remove canary containers on cleanup",
  );

  const actionMatches = [...canaryWorkflow.matchAll(/uses:\s*([^@\s]+)@([^\s#]+)/g)];
  for (const match of actionMatches) {
    const actionName = match[1];
    const ref = match[2];
    assert.match(
      ref,
      /^[0-9a-f]{40}$/,
      `External action ${actionName} in ha-canary.yml must be pinned to full commit SHA: ${ref}`,
    );
  }
});

test("playwright.config.mjs configures diagnostic retention and HTML reporter", async () => {
  const playwrightConfig = await readText("playwright.config.mjs");

  assert.ok(
    playwrightConfig.includes('trace: "retain-on-failure"'),
    "Playwright config must retain traces on failure",
  );
  assert.ok(
    playwrightConfig.includes('screenshot: "only-on-failure"'),
    "Playwright config must capture screenshots on failure",
  );
  assert.ok(
    playwrightConfig.includes('video: "retain-on-failure"'),
    "Playwright config must retain videos on failure",
  );
  assert.ok(playwrightConfig.includes('"html"'), "Playwright config must configure HTML reporter");
});
