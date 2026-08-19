import { test, expect } from "@playwright/test";
import {
  mountCard,
  updateCardHass,
  updateEntityState,
  getRecordedServiceCalls,
  createDefaultVacuumState,
} from "./helpers/component-harness.mjs";

const VACUUM_FEATURES = {
  TURN_ON: 1,
  TURN_OFF: 2,
  PAUSE: 4,
  STOP: 8,
  RETURN_HOME: 16,
  FAN_SPEED: 32,
  STATUS: 128,
  SEND_COMMAND: 256,
  LOCATE: 512,
  CLEAN_SPOT: 1024,
  MAP: 2048,
  STATE: 4096,
  START: 8192,
  CLEAN_AREA: 16384,
};

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

    // Transition state from docked -> cleaning
    await updateEntityState(page, "vacuum.roborock_s7", {
      state: "cleaning",
    });
    await expect(statusRow).toContainText("Cleaning");

    // Transition state from cleaning -> returning
    await updateEntityState(page, "vacuum.roborock_s7", {
      state: "returning",
    });
    await expect(statusRow).toContainText("Returning");
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

    // Pause -> disabled (can only pause when cleaning)
    await expect(pauseBtn).toHaveAttribute("disabled", "");
    await expect(pauseBtn).toHaveAttribute("aria-disabled", "true");
    await expect(pauseBtn).toHaveAttribute("tabindex", "-1");

    // Stop -> disabled (docked)
    await expect(stopBtn).toHaveAttribute("disabled", "");
    await expect(stopBtn).toHaveAttribute("aria-disabled", "true");

    // Return to Base -> enabled
    await expect(returnBtn).not.toHaveAttribute("disabled", "");

    // Clicking disabled Pause button must NOT dispatch service
    await pauseBtn.dispatchEvent("click");
    let calls = await getRecordedServiceCalls(page);
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
      state: "cleaning",
    });

    // In 'cleaning' state:
    // Start -> disabled
    await expect(startBtn).toHaveAttribute("disabled", "");
    await expect(startBtn).toHaveAttribute("aria-disabled", "true");

    // Pause -> enabled
    await expect(pauseBtn).not.toHaveAttribute("disabled", "");
    await expect(pauseBtn).toHaveAttribute("aria-disabled", "false");

    // Stop -> enabled
    await expect(stopBtn).not.toHaveAttribute("disabled", "");

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
});
