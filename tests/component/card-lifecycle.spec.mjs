import { test, expect } from "@playwright/test";
import {
  mountCard,
  updateCardHass,
  createDefaultVacuumState,
} from "./helpers/component-harness.mjs";

test.describe("Card Lifecycle & Reactive Rendering", () => {
  test("registers custom element and window.customCards metadata", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => window.__cardReady !== undefined);
    await page.evaluate(() => window.__cardReady);

    const isCardRegistered = await page.evaluate(() => !!customElements.get("xiaomi-vacuum-card"));
    const isEditorRegistered = await page.evaluate(
      () => !!customElements.get("xiaomi-vacuum-card-editor"),
    );
    const customCardsEntry = await page.evaluate(() =>
      window.customCards?.find((c) => c.type === "xiaomi-vacuum-card"),
    );

    expect(isCardRegistered).toBe(true);
    expect(isEditorRegistered).toBe(true);
    expect(customCardsEntry).toMatchObject({
      type: "xiaomi-vacuum-card",
      name: "Xiaomi Vacuum Card Reborn",
      preview: true,
    });
  });

  test("mounts card with real Lit lifecycle, Shadow DOM, and rendered elements", async ({
    page,
  }) => {
    const vacuumState = createDefaultVacuumState({
      entityId: "vacuum.roborock_s7",
      status: "Cleaning",
      batteryLevel: 85,
      friendlyName: "Roborock S7",
    });

    const { cardLocator } = await mountCard(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.roborock_s7",
        name: "Living Room Vacuum",
      },
      hass: {
        states: {
          "vacuum.roborock_s7": vacuumState,
        },
      },
    });

    // Check title in shadow root
    const titleLocator = cardLocator.locator(".title");
    await expect(titleLocator).toHaveText("Living Room Vacuum");

    // Check ha-card exists in shadow root
    await expect(cardLocator.locator("ha-card")).toBeVisible();

    // Check status text
    await expect(cardLocator.locator(".grid-left")).toContainText("Cleaning");

    // Check battery text
    await expect(cardLocator.locator(".grid-left")).toContainText("85%");

    // Check default buttons rendered
    const startButton = cardLocator.locator('ha-icon-button[title="Start"]');
    const pauseButton = cardLocator.locator('ha-icon-button[title="Pause"]');
    const stopButton = cardLocator.locator('ha-icon-button[title="Stop"]');
    const returnButton = cardLocator.locator('ha-icon-button[title="Return to Base"]');

    await expect(startButton).toBeVisible();
    await expect(pauseButton).toBeVisible();
    await expect(stopButton).toBeVisible();
    await expect(returnButton).toBeVisible();
  });

  test("reactively updates DOM when primary vacuum entity changes", async ({ page }) => {
    const initialVacuum = createDefaultVacuumState({
      entityId: "vacuum.roborock_s7",
      status: "Docked",
      batteryLevel: 100,
    });

    const { cardLocator } = await mountCard(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.roborock_s7",
      },
      hass: {
        states: {
          "vacuum.roborock_s7": initialVacuum,
        },
      },
    });

    await expect(cardLocator.locator(".grid-left")).toContainText("Docked");
    await expect(cardLocator.locator(".grid-left")).toContainText("100%");

    // Transition vacuum to Cleaning and 78% battery
    const updatedVacuum = createDefaultVacuumState({
      entityId: "vacuum.roborock_s7",
      state: "cleaning",
      status: "Cleaning",
      batteryLevel: 78,
    });

    await updateCardHass(page, {
      states: {
        "vacuum.roborock_s7": updatedVacuum,
      },
    });

    await expect(cardLocator.locator(".grid-left")).toContainText("Cleaning");
    await expect(cardLocator.locator(".grid-left")).toContainText("78%");
  });

  test("renders unavailable message when vacuum entity is missing", async ({ page }) => {
    const { cardLocator } = await mountCard(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.nonexistent_vacuum",
      },
      hass: {
        states: {},
      },
    });

    await expect(cardLocator.locator("ha-card")).toContainText(
      "Entity 'vacuum.nonexistent_vacuum' not available...",
    );
  });
});
