import { test, expect } from "@playwright/test";
import {
  mountCard,
  updateEntityState,
  createDefaultVacuumState,
  getCardRenderCount,
} from "./helpers/component-harness.mjs";

test.describe("External Entity Reactivity & Render Scenarios", () => {
  /**
   * Regression Reproduction Scenario for Issue #32:
   *
   * Problem:
   * When an external sensor (e.g. `sensor.filter_left`) referenced in card configuration
   * is updated in Home Assistant's `hass.states`, but the primary vacuum entity state object
   * reference is unchanged, the card's `shouldUpdate()` currently returns `false` and Lit
   * does not re-render the card.
   *
   * Current behavior (before Issue #32 fix):
   * The visible DOM remains stale (still shows the initial "Filter: 100 h" instead of "Filter: 50 h").
   *
   * Target behavior (after Issue #32 fix):
   * Replacing only the referenced external sensor state updates the card's visible DOM.
   */
  test("demonstrates stale external-entity behavior on external state change (reproduces #32 defect)", async ({
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
            state: 360000, // 100 hours (computed as Math.round(360000 / 3600))
          },
        },
      },
    });

    // Initial render displays 100 h
    await expect(cardLocator.locator(".grid-right")).toContainText("Filter: 100 h");

    // Update ONLY sensor.filter_left in hass.states while keeping vacuumState reference unchanged
    await updateEntityState(page, "sensor.filter_left", {
      state: 180000, // 50 hours (computed as Math.round(180000 / 3600))
    });

    // Observe current runtime limitation: the card does NOT update the visible DOM
    // Under the current runtime (without #32), the DOM still contains the stale 100 h.
    // When Issue #32 implements reactive dependency tracking, this expectation will be updated to:
    // await expect(cardLocator.locator(".grid-right")).toContainText("Filter: 50 h");
    const gridText = await cardLocator.locator(".grid-right").textContent();
    expect(gridText).toContain("Filter: 100 h");
    expect(gridText).not.toContain("Filter: 50 h");
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

  test("renders localized unavailable text when external attribute entity is missing", async ({
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
          main_brush: {
            entity: "sensor.missing_brush_sensor",
            label: "Main Brush: ",
            unit: " h",
          },
        },
      },
      hass: {
        states: {
          "vacuum.test_vacuum": vacuumState,
        },
      },
    });

    await expect(cardLocator.locator(".grid-right")).toContainText("Main Brush: Unavailable");
  });
});
