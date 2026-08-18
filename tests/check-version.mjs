import { readFile } from "node:fs/promises";

const [packageJson, cardSource, changelog, security] = await Promise.all([
  readFile(new URL("../package.json", import.meta.url), "utf8"),
  readFile(new URL("../dist/xiaomi-vacuum-card.js", import.meta.url), "utf8"),
  readFile(new URL("../CHANGELOG.md", import.meta.url), "utf8"),
  readFile(new URL("../SECURITY.md", import.meta.url), "utf8").catch(() => null),
]);

const { version } = JSON.parse(packageJson);
const bannerMatch = cardSource.match(/%c XIAOMI-VACUUM-CARD-REBORN %c ([^ ]+) /);

if (!bannerMatch) {
  throw new Error("Unable to find XIAOMI-VACUUM-CARD-REBORN version banner");
}

const bannerVersion = bannerMatch[1];

if (version !== bannerVersion) {
  throw new Error(`Version mismatch: package.json ${version} != banner ${bannerVersion}`);
}

const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const versionHeadingRegex = new RegExp(
  `^##\\s+\\[?${escapedVersion}\\]?(?:\\s+-\\s+\\d{4}-\\d{2}-\\d{2})?\\b`,
  "m",
);

if (!versionHeadingRegex.test(changelog)) {
  throw new Error(
    `Version mismatch: CHANGELOG.md is missing release entry for version ${version} (expected "## [${version}] - YYYY-MM-DD")`,
  );
}

const linkRefRegex = new RegExp(`^\\[${escapedVersion}\\]:\\s+https://github\\.com/`, "m");
if (!linkRefRegex.test(changelog)) {
  throw new Error(
    `Version mismatch: CHANGELOG.md is missing comparison link reference for [${version}] at bottom of file`,
  );
}

if (security) {
  const versionParts = version.split(".");
  const currentMinorLine = `${versionParts[0]}.${versionParts[1]}.x`;
  const escapedMinorLine = currentMinorLine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const securityTableRegex = new RegExp(
    `\\|\\s*\`?${escapedMinorLine}\`?\\s*\\|\\s*:white_check_mark:\\s*\\|`,
    "m",
  );
  if (!securityTableRegex.test(security)) {
    throw new Error(
      `Version mismatch: SECURITY.md Supported Versions table does not mark \`${currentMinorLine}\` as supported (:white_check_mark:)`,
    );
  }
}
