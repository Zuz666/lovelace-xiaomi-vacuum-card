import { test, expect } from "@playwright/test";
import { mountCard } from "./helpers/component-harness.mjs";
import { loadFixture, fixtureToHass } from "../fixtures/loader.mjs";

test.describe("Fixture-Driven Scenarios Matrix", () => {
  test("scenario: modern-separated-battery renders status, separated battery, and capability-aware actions", async ({
    page,
  }) => {
    const fixture = loadFixture("modern-separated-battery");
    const hass = fixtureToHass(fixture);

    const { cardLocator } = await mountCard(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: fixture.vacuum_entity_id,
      },
      hass,
    });

    // Verify status and battery values rendered in the real DOM
    await expect(cardLocator.locator(".grid-left")).toContainText("Docked");
    await expect(cardLocator.locator(".grid-left")).toContainText("88%");
    // Verify action button presentation and disabled states
    const startBtn = cardLocator.locator("ha-icon-button[label='Start']");
    const pauseBtn = cardLocator.locator("ha-icon-button[label='Pause']");
    const stopBtn = cardLocator.locator("ha-icon-button[label='Stop']");
    const returnBtn = cardLocator.locator("ha-icon-button[label='Return to Base']");

    await expect(startBtn).toBeVisible();
    await expect(startBtn).not.toHaveAttribute("disabled", "");

    await expect(pauseBtn).toBeVisible();
    await expect(pauseBtn).toHaveAttribute("disabled", "");
    await expect(pauseBtn).toHaveCSS("opacity", "0.38");

    await expect(stopBtn).toBeVisible();
    await expect(stopBtn).toHaveAttribute("disabled", "");

    await expect(returnBtn).toBeVisible();
    await expect(returnBtn).not.toHaveAttribute("disabled", "");

    // Verify keyboard interaction triggers service call
    await startBtn.focus();
    await page.keyboard.press("Enter");
    const serviceCalls = await page.evaluate(() => window.__componentHarness.serviceCalls);
    expect(serviceCalls.length).toBe(1);
    expect(serviceCalls[0]).toMatchObject({
      domain: "vacuum",
      service: "start",
      data: { entity_id: fixture.vacuum_entity_id },
    });
  });

  test("scenario: legacy-attribute-vacuum renders status and battery from legacy attributes", async ({
    page,
  }) => {
    const fixture = loadFixture("legacy-attribute-vacuum");
    const hass = fixtureToHass(fixture);

    const { cardLocator } = await mountCard(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: fixture.vacuum_entity_id,
      },
      hass,
    });
    await expect(cardLocator.locator(".grid-left")).toContainText("Docked");
    await expect(cardLocator.locator(".grid-left")).toContainText("65%");
    // With supported_features: 0, modern automatic actions are hidden
    await expect(cardLocator.locator("ha-icon-button[label='Start']")).toHaveCount(0);
    await expect(cardLocator.locator("ha-icon-button[label='Pause']")).toHaveCount(0);
    await expect(cardLocator.locator("ha-icon-button[label='Stop']")).toHaveCount(0);
  });

  test("scenario: unavailable-battery-sensor renders localized unavailable without crashing", async ({
    page,
  }) => {
    const fixture = loadFixture("unavailable-battery-sensor");
    const hass = fixtureToHass(fixture);

    const { cardLocator } = await mountCard(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: fixture.vacuum_entity_id,
      },
      hass,
    });

    await expect(cardLocator.locator(".grid-left")).toContainText("Cleaning");
    await expect(cardLocator.locator(".grid-left")).toContainText("Unavailable");
  });

  test("scenario: partial-capabilities-vacuum renders only supported actions in DOM", async ({
    page,
  }) => {
    const fixture = loadFixture("partial-capabilities-vacuum");
    const hass = fixtureToHass(fixture);

    const { cardLocator } = await mountCard(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: fixture.vacuum_entity_id,
      },
      hass,
    });

    // Start is supported but disabled during cleaning
    const startBtn = cardLocator.locator("ha-icon-button[label='Start']");
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toHaveAttribute("disabled", "");

    // Return to base is supported and enabled
    const returnBtn = cardLocator.locator("ha-icon-button[label='Return to Base']");
    await expect(returnBtn).toBeVisible();
    await expect(returnBtn).not.toHaveAttribute("disabled", "");

    // Pause, Stop, Clean Spot are absent from DOM because feature bits are missing
    await expect(cardLocator.locator("ha-icon-button[label='Pause']")).toHaveCount(0);
    await expect(cardLocator.locator("ha-icon-button[label='Stop']")).toHaveCount(0);
    await expect(cardLocator.locator("ha-icon-button[label='Clean Spot']")).toHaveCount(0);
  });

  test("scenario: same-device-discovered-battery resolves renamed sensor via device registry", async ({
    page,
  }) => {
    const fixture = loadFixture("same-device-discovered-battery");
    const hass = fixtureToHass(fixture);

    const { cardLocator } = await mountCard(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: fixture.vacuum_entity_id,
      },
      hass,
    });

    await expect(cardLocator.locator(".grid-left")).toContainText("Docked");
    await expect(cardLocator.locator(".grid-left")).toContainText("94%");
  });
});
