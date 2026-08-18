import { test, expect } from "@playwright/test";
import {
  mountEditor,
  createDefaultVacuumState,
  getRecordedConfigChanges,
} from "./helpers/component-harness.mjs";

test.describe("Card Editor Lifecycle & Event Dispatch", () => {
  test("mounts editor in real DOM and renders configuration sections", async ({ page }) => {
    const vacuumState = createDefaultVacuumState({
      entityId: "vacuum.test_vacuum",
    });

    const { editorLocator } = await mountEditor(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.test_vacuum",
        name: "My Vacuum",
      },
      hass: {
        states: {
          "vacuum.test_vacuum": vacuumState,
        },
      },
    });

    // Verify editor root element is rendered
    await expect(editorLocator.locator(".editor")).toBeVisible();

    // Verify all 5 top-level expansion panel section headers are rendered
    const topLevelPanels = editorLocator.locator(".editor > ha-expansion-panel");
    await expect(topLevelPanels).toHaveCount(5);

    await expect(topLevelPanels.nth(0)).toContainText("Basic");
    await expect(topLevelPanels.nth(1)).toContainText("Visibility");
    await expect(topLevelPanels.nth(2)).toContainText("State");
    await expect(topLevelPanels.nth(3)).toContainText("Attributes");
    await expect(topLevelPanels.nth(4)).toContainText("Buttons");
  });

  test("dispatches config-changed event on model modifications", async ({ page }) => {
    const vacuumState = createDefaultVacuumState({
      entityId: "vacuum.test_vacuum",
    });

    const { editorLocator } = await mountEditor(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.test_vacuum",
        name: "My Vacuum",
      },
      hass: {
        states: {
          "vacuum.test_vacuum": vacuumState,
        },
      },
    });

    // Programmatically trigger a custom row addition via editor methods
    await page.evaluate(() => {
      window.__activeEditor.addCustomRow("attributes");
    });

    const configChanges = await getRecordedConfigChanges(page);
    expect(configChanges.length).toBeGreaterThan(0);

    const latestConfig = configChanges[configChanges.length - 1];
    expect(latestConfig).toMatchObject({
      entity: "vacuum.test_vacuum",
      name: "My Vacuum",
    });
    expect(latestConfig.attributes).toHaveProperty("custom_attribute");
  });
});
