import { expect, test } from "@playwright/test";

const isFaviconNoise = (message) => message.toLowerCase().includes("favicon");

test("loads the Xiaomi vacuum card in Home Assistant", async ({ page }) => {
  const fatalErrors = [];

  page.on("pageerror", (error) => {
    const message = error.message || String(error);

    if (!isFaviconNoise(message)) {
      fatalErrors.push(`pageerror: ${message}`);
    }
  });

  page.on("console", (message) => {
    if (message.type() !== "error") {
      return;
    }

    const details = [message.text(), message.location().url].filter(Boolean).join(" ");

    if (!isFaviconNoise(details)) {
      fatalErrors.push(`console error: ${details}`);
    }
  });

  await page.goto("/lovelace/smoke", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => globalThis.customElements.get("xiaomi-vacuum-card"), undefined, {
    timeout: 45_000,
  });

  await expect(page.locator("xiaomi-vacuum-card").first()).toBeAttached();
  expect(fatalErrors, fatalErrors.join("\n")).toEqual([]);
});
