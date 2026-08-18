import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("CHANGELOG.md adheres to Keep a Changelog conventions", async () => {
  const rawChangelog = await readFile(new URL("../CHANGELOG.md", import.meta.url), "utf8");
  const changelog = rawChangelog.replace(/\r\n/g, "\n");

  assert.ok(changelog.startsWith("# Changelog\n"), "Must start with # Changelog");
  assert.ok(changelog.includes("## [Unreleased]"), "Must include ## [Unreleased] section");
  assert.ok(
    changelog.includes("The format is based on [Keep a Changelog]"),
    "Must reference Keep a Changelog standard",
  );
});

test("CHANGELOG.md contains release sections and link references for recent versions", async () => {
  const changelog = await readFile(new URL("../CHANGELOG.md", import.meta.url), "utf8");
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );

  const currentVersion = packageJson.version;
  const versionRegex = new RegExp(
    `##\\s+\\[${currentVersion.replace(/\./g, "\\.")}\\]\\s+-\\s+\\d{4}-\\d{2}-\\d{2}`,
  );
  assert.ok(
    versionRegex.test(changelog),
    `CHANGELOG.md must contain dated header for current version ${currentVersion}`,
  );

  const linkRegex = new RegExp(
    `^\\[${currentVersion.replace(/\./g, "\\.")}\\]:\\s+https://github\\.com/`,
    "m",
  );
  assert.ok(
    linkRegex.test(changelog),
    `CHANGELOG.md must contain bottom link reference for [${currentVersion}]`,
  );
});

test("Extracting release notes for a version retrieves release section content", async () => {
  const rawChangelog = await readFile(new URL("../CHANGELOG.md", import.meta.url), "utf8");
  const changelog = rawChangelog.replace(/\r\n/g, "\n");

  function extractReleaseNotes(content, version) {
    const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `(?:^|\\n)##\\s+\\[?${escaped}\\]?(?:\\s+-[^\\n]*)?\\n([\\s\\S]*?)(?=\\n##\\s+|\n\\[[^\\]]+\\]:|$)`,
    );
    const match = content.match(regex);
    return match ? match[1].trim() : "";
  }
  const notes461 = extractReleaseNotes(changelog, "4.6.1");
  assert.ok(notes461.includes("Accepted native template result objects"));
  assert.ok(notes461.includes("Merged development guide into unified `CONTRIBUTING.md`"));

  const notes460 = extractReleaseNotes(changelog, "4.6.0");
  assert.ok(notes460.includes("Support for Home Assistant 2026.6 card picker"));
  assert.ok(notes460.includes("Dynamic service templates"));
});
