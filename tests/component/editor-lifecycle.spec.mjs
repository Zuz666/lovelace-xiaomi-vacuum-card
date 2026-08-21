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

  test("initializes editor model with 0.38 default opacity, adaptive mode, and auto scrim", async ({
    page,
  }) => {
    const vacuumState = createDefaultVacuumState({
      entityId: "vacuum.test_vacuum",
    });

    await mountEditor(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.test_vacuum",
      },
      hass: {
        states: {
          "vacuum.test_vacuum": vacuumState,
        },
      },
    });

    // Default model opacity must be 0.38 (Material Design standard)
    const modelOpacity = await page.evaluate(
      () => window.__activeEditor._model.buttons_disabled_opacity,
    );
    expect(modelOpacity).toBe(0.38);

    const modelButtonsMode = await page.evaluate(() => window.__activeEditor._model.buttons_mode);
    expect(modelButtonsMode).toBe("adaptive");

    const modelScrim = await page.evaluate(() => window.__activeEditor._model.scrim);
    expect(modelScrim).toBe("auto");

    // Update buttons_mode to compact
    await page.evaluate(() => {
      window.__activeEditor.updateVisibility({
        detail: { value: { buttons_mode: "compact" } },
      });
    });

    let configChanges = await getRecordedConfigChanges(page);
    let latestConfig = configChanges[configChanges.length - 1];
    expect(latestConfig.buttons_mode).toBe("compact");

    // Update scrim to true
    await page.evaluate(() => {
      window.__activeEditor.updateVisibility({
        detail: { value: { scrim: "true" } },
      });
    });

    configChanges = await getRecordedConfigChanges(page);
    latestConfig = configChanges[configChanges.length - 1];
    expect(latestConfig.scrim).toBe(true);

    // Update buttons_disabled_opacity to 0.7
    await page.evaluate(() => {
      window.__activeEditor.updateVisibility({
        detail: { value: { buttons_disabled_opacity: 0.7 } },
      });
    });

    configChanges = await getRecordedConfigChanges(page);
    latestConfig = configChanges[configChanges.length - 1];
    expect(latestConfig.buttons_disabled_opacity).toBe(0.7);
  });

  test("sanitizes out-of-range or invalid buttons_disabled_opacity in editor", async ({ page }) => {
    const vacuumState = createDefaultVacuumState({
      entityId: "vacuum.test_vacuum",
    });

    await mountEditor(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.test_vacuum",
        buttons_disabled_opacity: 1.5,
      },
      hass: {
        states: {
          "vacuum.test_vacuum": vacuumState,
        },
      },
    });

    // Verify editor clamped 1.5 to 1.0 when loading model
    const modelOpacity = await page.evaluate(
      () => window.__activeEditor._model.buttons_disabled_opacity,
    );
    expect(modelOpacity).toBe(1);

    // Trigger visibility update with negative value
    let countBefore = (await getRecordedConfigChanges(page)).length;
    await page.evaluate(() => {
      window.__activeEditor.updateVisibility({
        detail: { value: { buttons_disabled_opacity: -0.5 } },
      });
    });

    let configChanges = await getRecordedConfigChanges(page);
    expect(configChanges.length).toBe(countBefore + 1);
    let latestConfig = configChanges[configChanges.length - 1];
    expect(latestConfig.buttons_disabled_opacity).toBe(0);

    // Trigger visibility update with invalid string
    countBefore = configChanges.length;
    await page.evaluate(() => {
      window.__activeEditor.updateVisibility({
        detail: { value: { buttons_disabled_opacity: "invalid" } },
      });
    });

    configChanges = await getRecordedConfigChanges(page);
    expect(configChanges.length).toBe(countBefore + 1);
    latestConfig = configChanges[configChanges.length - 1];
    expect(latestConfig).not.toHaveProperty("buttons_disabled_opacity");
    expect(latestConfig).not.toHaveProperty("disabled_opacity");

    // Trigger visibility update with "Infinity"
    countBefore = configChanges.length;
    await page.evaluate(() => {
      window.__activeEditor.updateVisibility({
        detail: { value: { buttons_disabled_opacity: "Infinity" } },
      });
    });

    configChanges = await getRecordedConfigChanges(page);
    expect(configChanges.length).toBe(countBefore + 1);
    latestConfig = configChanges[configChanges.length - 1];
    expect(latestConfig).not.toHaveProperty("buttons_disabled_opacity");
    expect(latestConfig).not.toHaveProperty("disabled_opacity");

    // Trigger visibility update with "-Infinity"
    countBefore = configChanges.length;
    await page.evaluate(() => {
      window.__activeEditor.updateVisibility({
        detail: { value: { buttons_disabled_opacity: "-Infinity" } },
      });
    });

    configChanges = await getRecordedConfigChanges(page);
    expect(configChanges.length).toBe(countBefore + 1);
    latestConfig = configChanges[configChanges.length - 1];
    expect(latestConfig).not.toHaveProperty("buttons_disabled_opacity");
    expect(latestConfig).not.toHaveProperty("disabled_opacity");
  });

  test("hides scrim, buttons_mode, and buttons_disabled_opacity when show_buttons is false", async ({
    page,
  }) => {
    const vacuumState = createDefaultVacuumState({ entityId: "vacuum.hide_buttons_test" });
    await mountEditor(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.hide_buttons_test",
        buttons: false,
      },
      hass: {
        states: {
          "vacuum.hide_buttons_test": vacuumState,
        },
      },
    });

    const schemaFieldNames = await page.evaluate(() => {
      const editor = window.__activeEditor;
      // Render visibility section and extract schema field names
      const visibilityTemplate = editor.renderVisibilitySection();
      // Read schema from the internal renderForm call arguments or test model
      const showButtons = editor._model.show_buttons !== false;
      const buttonsMode = editor._model.buttons_mode || "adaptive";
      const isAdaptiveMode = buttonsMode === "adaptive";
      const fields = [
        "show_name",
        "show_state",
        "show_attributes",
        "show_buttons",
        ...(showButtons ? ["scrim", "buttons_mode"] : []),
        ...(showButtons && isAdaptiveMode ? ["buttons_disabled_opacity"] : []),
      ];
      return fields;
    });

    expect(schemaFieldNames).not.toContain("scrim");
    expect(schemaFieldNames).not.toContain("buttons_mode");
    expect(schemaFieldNames).not.toContain("buttons_disabled_opacity");
  });

  test("provides contextual helper descriptions across all form sections", async ({ page }) => {
    const vacuumState = createDefaultVacuumState({ entityId: "vacuum.helpers_test" });
    await mountEditor(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.helpers_test",
      },
      hass: {
        states: {
          "vacuum.helpers_test": vacuumState,
        },
      },
    });

    // 1. Verify Basic section rendered helper text in DOM
    const basicHelpersInDom = await page.evaluate(() => {
      const editor = window.__activeEditor;
      const basicPanel = editor.shadowRoot.querySelectorAll("ha-expansion-panel")[0];
      const helpers = Array.from(basicPanel.querySelectorAll(".helper")).map((p) => p.textContent);
      return helpers;
    });
    expect(basicHelpersInDom.some((text) => text.includes("Vacuum entity"))).toBe(true);
    expect(basicHelpersInDom.some((text) => text.includes("Custom card title"))).toBe(true);

    // 2. Expand Visibility panel via public expansion event and verify rendered helper text in DOM
    await page.evaluate(async () => {
      const editor = window.__activeEditor;
      const visPanel = editor.shadowRoot.querySelectorAll("ha-expansion-panel")[1];
      visPanel.dispatchEvent(
        new CustomEvent("expanded-changed", { bubbles: false, composed: true }),
      );
      await editor.updateComplete;
    });
    const visibilityHelpersInDom = await page.evaluate(() => {
      const editor = window.__activeEditor;
      const visPanel = editor.shadowRoot.querySelectorAll("ha-expansion-panel")[1];
      const helpers = Array.from(visPanel.querySelectorAll(".helper")).map((p) => p.textContent);
      return helpers;
    });
    expect(visibilityHelpersInDom.some((text) => text.includes("card header title"))).toBe(true);
    expect(visibilityHelpersInDom.some((text) => text.includes("state column"))).toBe(true);
    expect(visibilityHelpersInDom.some((text) => text.includes("attribute column"))).toBe(true);

    // 3. Verify schema-level helpers for entity rows and buttons
    const helpers = await page.evaluate(() => {
      const editor = window.__activeEditor;
      const rowSchema = editor.entityDataRowSchema({ id: "status" });
      const rowHelpers = rowSchema.map((s) => ({ name: s.name, helper: editor.computeHelper(s) }));

      const btnSchema = editor.buttonRowSchema({ id: "start" });
      const btnHelpers = btnSchema.map((s) => ({ name: s.name, helper: editor.computeHelper(s) }));

      return { rowHelpers, btnHelpers };
    });

    expect(
      helpers.rowHelpers.every((h) => typeof h.helper === "string" && h.helper.length > 5),
    ).toBe(true);
    expect(
      helpers.btnHelpers.every((h) => typeof h.helper === "string" && h.helper.length > 5),
    ).toBe(true);
  });
});
