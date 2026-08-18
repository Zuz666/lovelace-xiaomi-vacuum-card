import { test, expect } from "@playwright/test";
import {
  mountCard,
  createDefaultVacuumState,
  getRecordedServiceCalls,
} from "./helpers/component-harness.mjs";

test.describe("ARIA Combobox & Keyboard Interaction", () => {
  test("renders accessible combobox button with correct ARIA attributes", async ({ page }) => {
    const vacuumState = createDefaultVacuumState({
      entityId: "vacuum.test_vacuum",
      fanSpeed: "Standard",
      fanSpeedList: ["Silent", "Standard", "Turbo", "Max"],
    });

    const { cardLocator } = await mountCard(page, {
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

    const comboboxBtn = cardLocator.locator('button[role="combobox"]');
    await expect(comboboxBtn).toBeVisible();
    await expect(comboboxBtn).toHaveAttribute("aria-haspopup", "listbox");
    await expect(comboboxBtn).toHaveAttribute("aria-expanded", "false");
    await expect(comboboxBtn).toContainText("Standard");

    // Listbox is initially not present in DOM
    await expect(cardLocator.locator('[role="listbox"]')).toHaveCount(0);
  });

  test("opens listbox on click and commits selection with service call", async ({ page }) => {
    const vacuumState = createDefaultVacuumState({
      entityId: "vacuum.test_vacuum",
      fanSpeed: "Standard",
      fanSpeedList: ["Silent", "Standard", "Turbo", "Max"],
    });

    const { cardLocator } = await mountCard(page, {
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

    const comboboxBtn = cardLocator.locator('button[role="combobox"]');
    await comboboxBtn.click();

    // Verify listbox is now open and has all options
    await expect(comboboxBtn).toHaveAttribute("aria-expanded", "true");
    const listbox = cardLocator.locator('[role="listbox"]');
    await expect(listbox).toBeVisible();

    const options = cardLocator.locator('[role="option"]');
    await expect(options).toHaveCount(4);
    await expect(options.nth(0)).toContainText("Silent");
    await expect(options.nth(1)).toContainText("Standard");
    await expect(options.nth(2)).toContainText("Turbo");
    await expect(options.nth(3)).toContainText("Max");

    // Standard option should be marked as selected
    await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");

    // Click "Turbo" option
    await options.nth(2).click();

    // Listbox should close
    await expect(comboboxBtn).toHaveAttribute("aria-expanded", "false");
    await expect(cardLocator.locator('[role="listbox"]')).toHaveCount(0);

    // Verify service call was dispatched
    const calls = await getRecordedServiceCalls(page);
    expect(calls).toContainEqual(
      expect.objectContaining({
        domain: "vacuum",
        service: "set_fan_speed",
        data: {
          entity_id: "vacuum.test_vacuum",
          fan_speed: "Turbo",
        },
      }),
    );
  });

  test("supports keyboard navigation and Enter selection", async ({ page }) => {
    const vacuumState = createDefaultVacuumState({
      entityId: "vacuum.test_vacuum",
      fanSpeed: "Standard",
      fanSpeedList: ["Silent", "Standard", "Turbo", "Max"],
    });

    const { cardLocator } = await mountCard(page, {
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

    const comboboxBtn = cardLocator.locator('button[role="combobox"]');
    await comboboxBtn.focus();

    // Press Enter to open listbox
    await page.keyboard.press("Enter");
    await expect(comboboxBtn).toHaveAttribute("aria-expanded", "true");

    // Navigate to next option (Turbo)
    await page.keyboard.press("ArrowDown");
    const activeOption = cardLocator.locator('[role="option"][active]');
    await expect(activeOption).toContainText("Turbo");

    // Select with Enter
    await page.keyboard.press("Enter");

    // Listbox closes
    await expect(comboboxBtn).toHaveAttribute("aria-expanded", "false");

    const calls = await getRecordedServiceCalls(page);
    expect(calls).toContainEqual(
      expect.objectContaining({
        domain: "vacuum",
        service: "set_fan_speed",
        data: {
          entity_id: "vacuum.test_vacuum",
          fan_speed: "Turbo",
        },
      }),
    );
  });

  test("closes listbox on Escape without committing change", async ({ page }) => {
    const vacuumState = createDefaultVacuumState({
      entityId: "vacuum.test_vacuum",
      fanSpeed: "Standard",
      fanSpeedList: ["Silent", "Standard", "Turbo", "Max"],
    });

    const { cardLocator } = await mountCard(page, {
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

    const comboboxBtn = cardLocator.locator('button[role="combobox"]');
    await comboboxBtn.click();
    await expect(comboboxBtn).toHaveAttribute("aria-expanded", "true");

    // Press Escape
    await page.keyboard.press("Escape");

    await expect(comboboxBtn).toHaveAttribute("aria-expanded", "false");
    await expect(cardLocator.locator('[role="listbox"]')).toHaveCount(0);

    // No service calls dispatched
    const calls = await getRecordedServiceCalls(page);
    expect(calls.filter((c) => c.service === "set_fan_speed")).toHaveLength(0);
  });
});
