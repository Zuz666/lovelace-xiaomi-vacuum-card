import { test, expect } from "@playwright/test";
import {
  mountCard,
  updateEntityState,
  removeEntityState,
  createDefaultVacuumState,
  getCardRenderCount,
} from "./helpers/component-harness.mjs";

test.describe("External Entity Reactivity & Render Scenarios", () => {
  test("updates visible DOM when explicit external sensor.* changes without vacuum state change", async ({
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
        attributes: {
          filter: {
            entity: "sensor.filter_left",
            label: "Filter: ",
            unit: " h",
          },
        },
      },
      hass: {
        states: {
          "vacuum.test_vacuum": vacuumState,
          "sensor.filter_left": {
            entity_id: "sensor.filter_left",
            state: 360000, // 100 hours (Math.round(360000 / 3600))
          },
        },
      },
    });

    // Initial render displays 100 h
    await expect(cardLocator.locator(".grid-right")).toContainText("Filter: 100 h");

    // Update ONLY sensor.filter_left in hass.states while keeping vacuumState reference unchanged
    await updateEntityState(page, "sensor.filter_left", {
      state: 180000, // 50 hours (Math.round(180000 / 3600))
    });

    // Card re-renders and displays updated value
    await expect(cardLocator.locator(".grid-right")).toContainText("Filter: 50 h");
  });

  test("updates visible DOM and icon when explicit external binary_sensor.* changes without vacuum state change", async ({
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
        attributes: {
          mop: {
            entity: "binary_sensor.mop_attached",
            label: "Mop: ",
          },
        },
      },
      hass: {
        states: {
          "vacuum.test_vacuum": vacuumState,
          "binary_sensor.mop_attached": {
            entity_id: "binary_sensor.mop_attached",
            state: "off",
            attributes: {
              icon: "mdi:water-off",
            },
          },
        },
      },
    });

    await expect(cardLocator.locator(".grid-right")).toContainText("Mop: off");
    await expect(cardLocator.locator(".grid-right ha-icon")).toHaveAttribute(
      "icon",
      "mdi:water-off",
    );

    // Update ONLY binary_sensor.mop_attached in hass.states
    await updateEntityState(page, "binary_sensor.mop_attached", {
      state: "on",
      attributes: {
        icon: "mdi:water",
      },
    });

    await expect(cardLocator.locator(".grid-right")).toContainText("Mop: on");
    await expect(cardLocator.locator(".grid-right ha-icon")).toHaveAttribute("icon", "mdi:water");
  });

  test("updates battery percentage and battery icon when auto-discovered battery sensor.* changes", async ({
    page,
  }) => {
    const vacuumState = createDefaultVacuumState({
      entityId: "vacuum.test_vacuum",
      status: "Cleaning",
      // Vacuum attributes omit battery so auto-discovery is used
      attributes: {},
    });

    const { cardLocator } = await mountCard(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.test_vacuum",
      },
      hass: {
        states: {
          "vacuum.test_vacuum": vacuumState,
          "sensor.test_vacuum_battery": {
            entity_id: "sensor.test_vacuum_battery",
            state: "80",
            attributes: {},
          },
        },
      },
    });

    await expect(cardLocator.locator(".grid-left")).toContainText("80%");
    await expect(cardLocator.locator(".grid-left ha-icon").nth(1)).toHaveAttribute(
      "icon",
      "mdi:battery-80",
    );

    // Update auto-discovered battery sensor to 20%
    await updateEntityState(page, "sensor.test_vacuum_battery", {
      state: "20",
    });

    await expect(cardLocator.locator(".grid-left")).toContainText("20%");
    await expect(cardLocator.locator(".grid-left ha-icon").nth(1)).toHaveAttribute(
      "icon",
      "mdi:battery-20",
    );
  });

  test("updates card background image when referenced media-source image entity changes", async ({
    page,
  }) => {
    const vacuumState = createDefaultVacuumState({
      entityId: "vacuum.test_vacuum",
    });

    const { cardLocator } = await mountCard(page, {
      config: {
        type: "custom:xiaomi-vacuum-card",
        entity: "vacuum.test_vacuum",
        image: "media-source://image/image.test_vacuum_map",
      },
      hass: {
        states: {
          "vacuum.test_vacuum": vacuumState,
          "image.test_vacuum_map": {
            entity_id: "image.test_vacuum_map",
            state: "1",
            attributes: {
              access_token: "token_v1",
            },
          },
        },
      },
    });

    await expect(cardLocator.locator("ha-card.background")).toHaveAttribute(
      "style",
      /token=token_v1&state=1/,
    );

    // Update image entity state and token
    await updateEntityState(page, "image.test_vacuum_map", {
      state: "2",
      attributes: {
        access_token: "token_v2",
      },
    });

    await expect(cardLocator.locator("ha-card.background")).toHaveAttribute(
      "style",
      /token=token_v2&state=2/,
    );
  });

  test("renders localized unavailable text when a referenced external entity is removed", async ({
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
        attributes: {
          filter: {
            entity: "sensor.filter_left",
            label: "Filter: ",
            unit: " h",
          },
        },
      },
      hass: {
        states: {
          "vacuum.test_vacuum": vacuumState,
          "sensor.filter_left": {
            entity_id: "sensor.filter_left",
            state: 360000,
          },
        },
      },
    });

    await expect(cardLocator.locator(".grid-right")).toContainText("Filter: 100 h");

    // Remove sensor.filter_left from hass.states
    await removeEntityState(page, "sensor.filter_left");

    await expect(cardLocator.locator(".grid-right")).toContainText("Filter: Unavailable");
  });

  test("unrelated entity changes in hass.states do not trigger unnecessary card renders", async ({
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
      },
      hass: {
        states: {
          "vacuum.test_vacuum": vacuumState,
          "light.living_room": {
            entity_id: "light.living_room",
            state: "off",
          },
        },
      },
    });

    await expect(cardLocator.locator(".grid-left")).toContainText("Cleaning");
    const initialRenderCount = await getCardRenderCount(page);

    // Update an unrelated entity in hass.states
    await updateEntityState(page, "light.living_room", {
      state: "on",
      attributes: { brightness: 255 },
    });

    const afterUpdateRenderCount = await getCardRenderCount(page);
    expect(afterUpdateRenderCount).toBe(initialRenderCount);
  });
});
