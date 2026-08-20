import { test, expect } from "@playwright/test";
import {
  mountCard,
  updateCardHass,
  updateEntityState,
  getRecordedServiceCalls,
  createDefaultVacuumState,
} from "./helpers/component-harness.mjs";
import { VACUUM_FEATURES } from "../helpers/vacuum-features.mjs";

test.describe("Vacuum Activity and Action Capabilities", () => {
  test("modern vacuum in docked state without attributes.status renders Docked (upstream #123)", async ({
    page,
  }) => {
    const vacuumState = {
      entity_id: "vacuum.roborock_s7",
      state: "docked",
      attributes: {
        friendly_name: "Roborock S7",
        battery_level: 100,
      },
    };

    const { cardLocator } = await mountCard(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.roborock_s7",
      },
      hass: {
        states: {
          "vacuum.roborock_s7": vacuumState,
        },
      },
    });

    const statusRow = cardLocator.locator(".grid-left > div").first();
    await expect(statusRow).toContainText("Docked");
    await expect(statusRow).not.toContainText("legacy namespace");

    // Transition state from docked -> cleaning
    await updateEntityState(page, "vacuum.roborock_s7", {
      ...vacuumState,
      state: "cleaning",
    });
    await expect(statusRow).toContainText("Cleaning");
    await expect(statusRow).not.toContainText("legacy namespace");

    // Transition state from cleaning -> returning
    await updateEntityState(page, "vacuum.roborock_s7", {
      ...vacuumState,
      state: "returning",
    });
    await expect(statusRow).toContainText("Returning");
    await expect(statusRow).not.toContainText("legacy namespace");
  });

  test("unsupported automatic actions are absent from the DOM", async ({ page }) => {
    // Supports only START, PAUSE, RETURN_HOME (no LOCATE, no CLEAN_SPOT, no STOP)
    const supported =
      VACUUM_FEATURES.STATE |
      VACUUM_FEATURES.START |
      VACUUM_FEATURES.PAUSE |
      VACUUM_FEATURES.RETURN_HOME;

    const vacuumState = {
      entity_id: "vacuum.minimal_vacuum",
      state: "docked",
      attributes: {
        friendly_name: "Minimal Vacuum",
        supported_features: supported,
      },
    };

    const { cardLocator } = await mountCard(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.minimal_vacuum",
      },
      hass: {
        states: {
          "vacuum.minimal_vacuum": vacuumState,
        },
      },
    });

    const buttonsContainer = cardLocator.locator(".flex");
    await expect(buttonsContainer).toBeVisible();

    // Start, Pause, Return should be rendered
    await expect(buttonsContainer.locator("ha-icon-button[label='Start']")).toHaveCount(1);
    await expect(buttonsContainer.locator("ha-icon-button[label='Pause']")).toHaveCount(1);
    await expect(buttonsContainer.locator("ha-icon-button[label='Return to Base']")).toHaveCount(1);

    // Stop, Locate, Clean Spot should be completely absent from DOM
    await expect(buttonsContainer.locator("ha-icon-button[label='Stop']")).toHaveCount(0);
    await expect(buttonsContainer.locator("ha-icon-button[label='Locate']")).toHaveCount(0);
    await expect(buttonsContainer.locator("ha-icon-button[label='Clean Spot']")).toHaveCount(0);
  });

  test("state-blocked actions render disabled and prevent service calls", async ({ page }) => {
    const allFeatures =
      VACUUM_FEATURES.START |
      VACUUM_FEATURES.PAUSE |
      VACUUM_FEATURES.STOP |
      VACUUM_FEATURES.RETURN_HOME |
      VACUUM_FEATURES.LOCATE;

    const vacuumState = {
      entity_id: "vacuum.smart_cleaner",
      state: "docked",
      attributes: {
        friendly_name: "Smart Cleaner",
        supported_features: allFeatures,
      },
    };

    const { cardLocator } = await mountCard(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.smart_cleaner",
      },
      hass: {
        states: {
          "vacuum.smart_cleaner": vacuumState,
        },
      },
    });

    const startBtn = cardLocator.locator("ha-icon-button[label='Start']");
    const pauseBtn = cardLocator.locator("ha-icon-button[label='Pause']");
    const stopBtn = cardLocator.locator("ha-icon-button[label='Stop']");
    const returnBtn = cardLocator.locator("ha-icon-button[label='Return to Base']");

    // In 'docked' state:
    // Start -> enabled
    await expect(startBtn).not.toHaveAttribute("disabled", "");
    await expect(startBtn).toHaveAttribute("aria-disabled", "false");
    await expect(startBtn).toHaveAttribute("tabindex", "0");

    // Pause -> disabled (can only pause when cleaning, default opacity 0.55)
    await expect(pauseBtn).toHaveAttribute("disabled", "");
    await expect(pauseBtn).toHaveAttribute("aria-disabled", "true");
    await expect(pauseBtn).toHaveAttribute("tabindex", "-1");
    await expect(pauseBtn).toHaveCSS("opacity", "0.55");

    // Stop -> disabled (docked, default opacity 0.55)
    await expect(stopBtn).toHaveAttribute("disabled", "");
    await expect(stopBtn).toHaveAttribute("aria-disabled", "true");
    await expect(stopBtn).toHaveAttribute("tabindex", "-1");
    await expect(stopBtn).toHaveCSS("opacity", "0.55");
    // Return to Base -> enabled
    await expect(returnBtn).not.toHaveAttribute("disabled", "");
    await expect(returnBtn).toHaveAttribute("tabindex", "0");

    // Programmatic click on disabled actions must NOT dispatch service
    await pauseBtn.dispatchEvent("click");
    await stopBtn.dispatchEvent("click");
    let calls = await getRecordedServiceCalls(page);
    expect(calls).toEqual([]);

    // Pointer click on disabled actions must NOT dispatch service
    await pauseBtn.click({ force: true });
    await stopBtn.click({ force: true });
    calls = await getRecordedServiceCalls(page);
    expect(calls).toEqual([]);

    // Keyboard activation attempts on disabled actions must NOT dispatch service
    await pauseBtn.dispatchEvent("keydown", { key: "Enter" });
    await pauseBtn.dispatchEvent("keyup", { key: "Enter" });
    await pauseBtn.dispatchEvent("keydown", { key: " " });
    await pauseBtn.dispatchEvent("keyup", { key: " " });
    await stopBtn.dispatchEvent("keydown", { key: "Enter" });
    await stopBtn.dispatchEvent("keyup", { key: "Enter" });
    await stopBtn.dispatchEvent("keydown", { key: " " });
    await stopBtn.dispatchEvent("keyup", { key: " " });
    calls = await getRecordedServiceCalls(page);
    expect(calls).toEqual([]);

    // Clicking enabled Start button MUST dispatch service
    await startBtn.click();
    calls = await getRecordedServiceCalls(page);
    expect(calls).toEqual([
      expect.objectContaining({
        domain: "vacuum",
        service: "start",
        data: { entity_id: "vacuum.smart_cleaner" },
      }),
    ]);

    // Now transition state to 'cleaning'
    await updateEntityState(page, "vacuum.smart_cleaner", {
      ...vacuumState,
      state: "cleaning",
    });

    // In 'cleaning' state:
    // Start -> disabled
    await expect(startBtn).toHaveAttribute("disabled", "");
    await expect(startBtn).toHaveAttribute("aria-disabled", "true");
    await expect(startBtn).toHaveAttribute("tabindex", "-1");

    // Pointer and keyboard activation on newly disabled Start must NOT dispatch service
    await startBtn.click({ force: true });
    await startBtn.dispatchEvent("click");
    await startBtn.dispatchEvent("keydown", { key: "Enter" });
    await startBtn.dispatchEvent("keyup", { key: "Enter" });
    await startBtn.dispatchEvent("keydown", { key: " " });
    await startBtn.dispatchEvent("keyup", { key: " " });
    calls = await getRecordedServiceCalls(page);
    expect(calls).toHaveLength(1); // Only the initial start call

    // Pause -> enabled
    await expect(pauseBtn).not.toHaveAttribute("disabled", "");
    await expect(pauseBtn).toHaveAttribute("aria-disabled", "false");
    await expect(pauseBtn).toHaveAttribute("tabindex", "0");

    // Stop -> enabled
    await expect(stopBtn).not.toHaveAttribute("disabled", "");
    await expect(stopBtn).toHaveAttribute("tabindex", "0");

    // Click Pause button when cleaning
    await pauseBtn.click();
    calls = await getRecordedServiceCalls(page);
    expect(calls).toContainEqual(
      expect.objectContaining({
        domain: "vacuum",
        service: "pause",
        data: { entity_id: "vacuum.smart_cleaner" },
      }),
    );
  });

  test("explicit show: true renders action for legacy integration but preserves state guards", async ({
    page,
  }) => {
    // Entity with 0 supported features (legacy integration without flags)
    const vacuumState = {
      entity_id: "vacuum.legacy_cleaner",
      state: "docked",
      attributes: {
        friendly_name: "Legacy Cleaner",
        supported_features: 0,
      },
    };

    const { cardLocator } = await mountCard(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.legacy_cleaner",
        buttons: {
          start: { show: true },
          pause: { show: true },
        },
      },
      hass: {
        states: {
          "vacuum.legacy_cleaner": vacuumState,
        },
      },
    });

    const startBtn = cardLocator.locator("ha-icon-button[label='Start']");
    const pauseBtn = cardLocator.locator("ha-icon-button[label='Pause']");

    // Both buttons should be in the DOM due to show: true
    await expect(startBtn).toBeVisible();
    await expect(pauseBtn).toBeVisible();

    // Start is enabled in docked state
    await expect(startBtn).not.toHaveAttribute("disabled", "");

    // Pause is disabled in docked state
    await expect(pauseBtn).toHaveAttribute("disabled", "");
    await expect(pauseBtn).toHaveAttribute("aria-disabled", "true");

    // Clicking Start dispatches vacuum.start
    await startBtn.click();
    const calls = await getRecordedServiceCalls(page);
    expect(calls).toEqual([
      expect.objectContaining({
        domain: "vacuum",
        service: "start",
        data: { entity_id: "vacuum.legacy_cleaner" },
      }),
    ]);
  });

  test("disabled_opacity custom setting applies to disabled buttons in real DOM", async ({
    page,
  }) => {
    const vacuumState = {
      entity_id: "vacuum.opacity_vacuum",
      state: "docked",
      attributes: {
        friendly_name: "Opacity Test Vacuum",
        supported_features:
          VACUUM_FEATURES.START | VACUUM_FEATURES.PAUSE | VACUUM_FEATURES.RETURN_HOME,
      },
    };

    const { cardLocator } = await mountCard(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.opacity_vacuum",
        disabled_opacity: 0.8,
      },
      hass: {
        states: {
          "vacuum.opacity_vacuum": vacuumState,
        },
      },
    });

    const pauseBtn = cardLocator.locator("ha-icon-button[label='Pause']");
    await expect(pauseBtn).toHaveAttribute("disabled", "");
    await expect(pauseBtn).toHaveCSS("opacity", "0.8");
  });
});
