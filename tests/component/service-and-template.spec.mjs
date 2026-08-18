import { test, expect } from "@playwright/test";
import {
  mountCard,
  createDefaultVacuumState,
  getRecordedServiceCalls,
  emitTemplateUpdate,
} from "./helpers/component-harness.mjs";

test.describe("Service Calls & Dynamic Template Subscriptions", () => {
  test("action buttons dispatch expected Home Assistant vacuum services", async ({ page }) => {
    const vacuumState = createDefaultVacuumState({
      entityId: "vacuum.test_vacuum",
      status: "Cleaning",
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

    // Click Start button
    await cardLocator.locator('ha-icon-button[title="Start"]').click();

    // Click Pause button
    await cardLocator.locator('ha-icon-button[title="Pause"]').click();

    // Click Stop button
    await cardLocator.locator('ha-icon-button[title="Stop"]').click();

    // Click Return to Base button
    await cardLocator.locator('ha-icon-button[title="Return to Base"]').click();

    const calls = await getRecordedServiceCalls(page);
    expect(calls).toEqual([
      expect.objectContaining({
        domain: "vacuum",
        service: "start",
        data: { entity_id: "vacuum.test_vacuum" },
      }),
      expect.objectContaining({
        domain: "vacuum",
        service: "pause",
        data: { entity_id: "vacuum.test_vacuum" },
      }),
      expect.objectContaining({
        domain: "vacuum",
        service: "stop",
        data: { entity_id: "vacuum.test_vacuum" },
      }),
      expect.objectContaining({
        domain: "vacuum",
        service: "return_to_base",
        data: { entity_id: "vacuum.test_vacuum" },
      }),
    ]);
  });

  test("dynamic button evaluates template via subscribeMessage and executes service", async ({
    page,
  }) => {
    const vacuumState = createDefaultVacuumState({
      entityId: "vacuum.test_vacuum",
      status: "Cleaning",
    });

    const { cardLocator } = await mountCard(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.test_vacuum",
        buttons: {
          clean_kitchen: {
            label: "Clean Kitchen",
            icon: "mdi:silverware-fork-knife",
            service: "vacuum.send_command",
            service_data_mode: "dynamic",
            service_data_template: '{ "command": "app_segment_clean", "params": [16] }',
          },
        },
      },
      hass: {
        states: {
          "vacuum.test_vacuum": vacuumState,
        },
      },
    });

    const kitchenBtn = cardLocator.locator('ha-icon-button[title="Clean Kitchen"]');
    await expect(kitchenBtn).toBeVisible();

    // Click button to initiate template evaluation
    const clickPromise = kitchenBtn.click();

    // Emit template result from WebSocket connection
    await emitTemplateUpdate(page, '{ "command": "app_segment_clean", "params": [16] }');
    await clickPromise;

    // Verify service call with parsed JSON payload
    await expect
      .poll(async () => getRecordedServiceCalls(page))
      .toContainEqual(
        expect.objectContaining({
          domain: "vacuum",
          service: "send_command",
          data: {
            entity_id: "vacuum.test_vacuum",
            command: "app_segment_clean",
            params: [16],
          },
        }),
      );
  });
});
