import { readFile } from "node:fs/promises";

const [packageJson, cardSource] = await Promise.all([
  readFile(new URL("../package.json", import.meta.url), "utf8"),
  readFile(new URL("../dist/xiaomi-vacuum-card.js", import.meta.url), "utf8"),
]);

const { version } = JSON.parse(packageJson);
const bannerMatch = cardSource.match(/%c XIAOMI-VACUUM-CARD %c ([^ ]+) /);

if (!bannerMatch) {
  throw new Error("Unable to find XIAOMI-VACUUM-CARD version banner");
}

const bannerVersion = bannerMatch[1];

if (version !== bannerVersion) {
  throw new Error(`Version mismatch: package.json ${version} != banner ${bannerVersion}`);
}
