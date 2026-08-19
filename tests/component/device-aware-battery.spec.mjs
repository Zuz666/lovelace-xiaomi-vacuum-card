import { test, expect } from "@playwright/test";
import {
  mountCard,
  updateCardHass,
  updateEntityState,
  createDefaultVacuumState,
} from "./helpers/component-harness.mjs";

test.describe("Device-Aware Battery and Charging Registry Discovery", () => {
  test("auto-discovers renamed battery sensor on the same device and updates visible DOM", async ({
    page,
  }) => {
    const vacuumState = createDefaultVacuumState({
      entityId: "vacuum.living_room_vacuum",
      status: "Docked",
    });

    const { cardLocator } = await mountCard(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.living_room_vacuum",
      },
      hass: {
        states: {
          "vacuum.living_room_vacuum": vacuumState,
          "sensor.renamed_vacuum_battery_power": {
            entity_id: "sensor.renamed_vacuum_battery_power",
            state: "84",
            attributes: { device_class: "battery" },
          },
        },
        entities: {
          "vacuum.living_room_vacuum": {
            entity_id: "vacuum.living_room_vacuum",
            device_id: "device_roborock_s7",
            platform: "roborock",
          },
          "sensor.renamed_vacuum_battery_power": {
            entity_id: "sensor.renamed_vacuum_battery_power",
            device_id: "device_roborock_s7",
            platform: "roborock",
            disabled_by: null,
            hidden_by: null,
          },
        },
        devices: {
          device_roborock_s7: {
            id: "device_roborock_s7",
            name: "Roborock S7",
          },
        },
      },
    });

    // Verify initial render discovers the renamed sensor (84%)
    const batteryRow = cardLocator.locator(".grid-left > div").filter({ hasText: /%/ });
    await expect(batteryRow).toContainText("84%");
    await expect(batteryRow.locator("ha-icon")).toHaveAttribute("icon", "mdi:battery-80");

    // Update battery state from 84 to 42
    await updateEntityState(page, "sensor.renamed_vacuum_battery_power", {
      state: "42",
      attributes: { device_class: "battery" },
    });

    // Card re-renders with new percentage and updated icon
    await expect(batteryRow).toContainText("42%");
    await expect(batteryRow.locator("ha-icon")).toHaveAttribute("icon", "mdi:battery-40");
  });

  test("auto-discovers same-device charging binary sensor and updates battery icon dynamically", async ({
    page,
  }) => {
    const vacuumState = createDefaultVacuumState({
      entityId: "vacuum.living_room_vacuum",
      status: "Docked",
    });

    const { cardLocator } = await mountCard(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.living_room_vacuum",
      },
      hass: {
        states: {
          "vacuum.living_room_vacuum": vacuumState,
          "sensor.custom_battery": {
            entity_id: "sensor.custom_battery",
            state: "73",
            attributes: { device_class: "battery" },
          },
          "binary_sensor.custom_charging": {
            entity_id: "binary_sensor.custom_charging",
            state: "off",
            attributes: { device_class: "battery_charging" },
          },
        },
        entities: {
          "vacuum.living_room_vacuum": {
            entity_id: "vacuum.living_room_vacuum",
            device_id: "device_roborock_s7",
            platform: "roborock",
          },
          "sensor.custom_battery": {
            entity_id: "sensor.custom_battery",
            device_id: "device_roborock_s7",
            platform: "roborock",
          },
          "binary_sensor.custom_charging": {
            entity_id: "binary_sensor.custom_charging",
            device_id: "device_roborock_s7",
            platform: "roborock",
          },
        },
      },
    });

    // When charging is off: icon is normal battery (mdi:battery-70)
    const batteryRow = cardLocator.locator(".grid-left > div").filter({ hasText: /%/ });
    await expect(batteryRow).toContainText("73%");
    await expect(batteryRow.locator("ha-icon")).toHaveAttribute("icon", "mdi:battery-70");

    // Turn charging ON: icon updates to charging battery (mdi:battery-charging-70)
    await updateEntityState(page, "binary_sensor.custom_charging", {
      state: "on",
      attributes: { device_class: "battery_charging" },
    });

    await expect(batteryRow.locator("ha-icon")).toHaveAttribute("icon", "mdi:battery-charging-70");

    // Turn charging OFF: icon updates back to normal battery (mdi:battery-70)
    await updateEntityState(page, "binary_sensor.custom_charging", {
      state: "off",
      attributes: { device_class: "battery_charging" },
    });

    await expect(batteryRow.locator("ha-icon")).toHaveAttribute("icon", "mdi:battery-70");
  });

  test("invalidates candidate discovery when entities registry map reference is replaced", async ({
    page,
  }) => {
    const vacuumState = createDefaultVacuumState({
      entityId: "vacuum.living_room_vacuum",
      status: "Docked",
    });

    const { cardLocator } = await mountCard(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.living_room_vacuum",
      },
      hass: {
        states: {
          "vacuum.living_room_vacuum": vacuumState,
          "sensor.battery_one": {
            entity_id: "sensor.battery_one",
            state: "65",
            attributes: { device_class: "battery" },
          },
          "sensor.battery_two": {
            entity_id: "sensor.battery_two",
            state: "95",
            attributes: { device_class: "battery" },
          },
        },
        entities: {
          "vacuum.living_room_vacuum": {
            entity_id: "vacuum.living_room_vacuum",
            device_id: "device_roborock_s7",
            platform: "roborock",
          },
          "sensor.battery_one": {
            entity_id: "sensor.battery_one",
            device_id: "device_roborock_s7",
            platform: "roborock",
          },
        },
      },
    });

    // Initially discovers battery_one (65%)
    await expect(cardLocator.locator(".grid-left")).toContainText("65%");

    // Replace entities registry map so battery_two is attached to the vacuum device instead
    await updateCardHass(page, {
      entities: {
        "vacuum.living_room_vacuum": {
          entity_id: "vacuum.living_room_vacuum",
          device_id: "device_roborock_s7",
          platform: "roborock",
        },
        "sensor.battery_two": {
          entity_id: "sensor.battery_two",
          device_id: "device_roborock_s7",
          platform: "roborock",
        },
      },
    });

    // Card invalidates discovery and renders battery_two (95%)
    await expect(cardLocator.locator(".grid-left")).toContainText("95%");
  });

  test("renders localized Unavailable when discovered battery sensor enters unavailable state without demoting to fallbacks", async ({
    page,
  }) => {
    const vacuumState = createDefaultVacuumState({
      entityId: "vacuum.living_room_vacuum",
      status: "Docked",
      attributes: {
        battery_level: 99, // Legacy attribute fallback present
      },
    });

    const { cardLocator } = await mountCard(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.living_room_vacuum",
      },
      hass: {
        states: {
          "vacuum.living_room_vacuum": vacuumState,
          "sensor.renamed_vacuum_battery": {
            entity_id: "sensor.renamed_vacuum_battery",
            state: "80",
            attributes: { device_class: "battery" },
          },
        },
        entities: {
          "vacuum.living_room_vacuum": {
            entity_id: "vacuum.living_room_vacuum",
            device_id: "device_roborock_s7",
            platform: "roborock",
          },
          "sensor.renamed_vacuum_battery": {
            entity_id: "sensor.renamed_vacuum_battery",
            device_id: "device_roborock_s7",
            platform: "roborock",
          },
        },
      },
    });

    await expect(cardLocator.locator(".grid-left")).toContainText("80%");

    // Set sensor state to "unavailable"
    await updateEntityState(page, "sensor.renamed_vacuum_battery", {
      state: "unavailable",
      attributes: { device_class: "battery" },
    });

    // Should render Unavailable and NOT fall back to legacy attribute 99%
    await expect(cardLocator.locator(".grid-left")).toContainText("Unavailable");
    await expect(cardLocator.locator(".grid-left")).not.toContainText("99%");
  });

  test("falls back to lower-priority source when discovered battery candidate becomes structurally ineligible (device_class changes)", async ({
    page,
  }) => {
    const vacuumState = createDefaultVacuumState({
      entityId: "vacuum.living_room_vacuum",
      status: "Docked",
      attributes: {
        battery_level: 55, // Legacy attribute fallback
      },
    });

    const { cardLocator } = await mountCard(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.living_room_vacuum",
      },
      hass: {
        states: {
          "vacuum.living_room_vacuum": vacuumState,
          "sensor.renamed_vacuum_battery": {
            entity_id: "sensor.renamed_vacuum_battery",
            state: "88",
            attributes: { device_class: "battery" },
          },
        },
        entities: {
          "vacuum.living_room_vacuum": {
            entity_id: "vacuum.living_room_vacuum",
            device_id: "device_roborock_s7",
            platform: "roborock",
          },
          "sensor.renamed_vacuum_battery": {
            entity_id: "sensor.renamed_vacuum_battery",
            device_id: "device_roborock_s7",
            platform: "roborock",
          },
        },
      },
    });

    // Discovered renamed sensor (88%)
    await expect(cardLocator.locator(".grid-left")).toContainText("88%");

    // Now sensor loses device_class: battery (e.g. becomes temperature sensor)
    await updateEntityState(page, "sensor.renamed_vacuum_battery", {
      state: "24",
      attributes: { device_class: "temperature" },
    });

    // Card reacts and falls back to legacy vacuum attribute (55%)
    await expect(cardLocator.locator(".grid-left")).toContainText("55%");
    await expect(cardLocator.locator(".grid-left")).not.toContainText("88%");
    await expect(cardLocator.locator(".grid-left")).not.toContainText("24%");
  });
});
