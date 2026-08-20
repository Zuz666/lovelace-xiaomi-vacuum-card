import assert from "node:assert/strict";
import test from "node:test";

import { createHass, loadCard, VACUUM_FEATURES } from "./helpers/card-harness.mjs";

test("status resolution: modern vacuum state is resolved by default without key: state or attributes.status (upstream #123)", async () => {
  const { Card } = await loadCard();
  const card = new Card();
  const hass = createHass({
    states: {
      "vacuum.roborock_s7": {
        attributes: {
          friendly_name: "Roborock S7",
        },
        entity_id: "vacuum.roborock_s7",
        state: "docked",
      },
    },
  });

  card.setConfig({ entity: "vacuum.roborock_s7" });
  card.hass = hass;

  const source = card.resolveAttributeSource(card.config.state.status);
  assert.equal(source.rawValue, "docked");

  const rendered = card.renderAttribute(card.config.state.status);
  assert.ok(rendered);
  const text = rendered.values.find(
    (v) => typeof v === "string" && (v.includes("Docked") || v.includes("docked")),
  );
  assert.ok(
    text,
    `Rendered status attribute must contain Docked or docked, got: ${JSON.stringify(rendered.values)}`,
  );
});

test("status resolution: explicit entity overrides main vacuum state and attributes", async () => {
  const { Card } = await loadCard();
  const card = new Card();
  const hass = createHass({
    states: {
      "sensor.custom_vacuum_status": {
        attributes: {},
        entity_id: "sensor.custom_vacuum_status",
        state: "Custom Status",
      },
      "vacuum.roborock_s7": {
        attributes: { status: "Legacy Status" },
        entity_id: "vacuum.roborock_s7",
        state: "docked",
      },
    },
  });

  card.setConfig({
    entity: "vacuum.roborock_s7",
    state: {
      status: {
        entity: "sensor.custom_vacuum_status",
      },
    },
  });
  card.hass = hass;

  const source = card.resolveAttributeSource(card.config.state.status);
  assert.equal(source.rawValue, "Custom Status");
});

test("status resolution: legacy attributes.status is used as fallback when state is absent", async () => {
  const { Card } = await loadCard();
  const card = new Card();
  const hass = createHass({
    states: {
      "vacuum.legacy_vacuum": {
        attributes: { status: "Charging at Dock" },
        entity_id: "vacuum.legacy_vacuum",
        state: null,
      },
    },
  });

  card.setConfig({ entity: "vacuum.legacy_vacuum" });
  card.hass = hass;

  const source = card.resolveAttributeSource(card.config.state.status);
  assert.equal(source.rawValue, "Charging at Dock");
});

test("status resolution: unavailable state remains selected and renders unavailable without falling back", async () => {
  const { Card } = await loadCard();
  const hass = {
    ...createHass({
      states: {
        "vacuum.roborock_s7": {
          attributes: { status: "Stale Legacy Status" },
          entity_id: "vacuum.roborock_s7",
          state: "unavailable",
        },
      },
    }),
    localize: (key) => (key === "state.default.unavailable" ? "Unavailable" : key),
  };
  const card = new Card();
  card.setConfig({ entity: "vacuum.roborock_s7" });
  card.hass = hass;

  const source = card.resolveAttributeSource(card.config.state.status);
  assert.equal(source.rawValue, "unavailable");

  const rendered = card.renderAttribute(card.config.state.status);
  assert.ok(rendered);
  const text = rendered.values.find((v) => typeof v === "string" && v.includes("Unavailable"));
  assert.ok(
    text,
    `Rendered status attribute must contain Unavailable, got: ${JSON.stringify(rendered.values)}`,
  );
});

test("capability mapping: modern vacuum services map to expected feature bitmasks", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  assert.equal(card.getRequiredFeatureForService("vacuum.start"), VACUUM_FEATURES.START);
  assert.equal(card.getRequiredFeatureForService("vacuum.pause"), VACUUM_FEATURES.PAUSE);
  assert.equal(card.getRequiredFeatureForService("vacuum.stop"), VACUUM_FEATURES.STOP);
  assert.equal(
    card.getRequiredFeatureForService("vacuum.return_to_base"),
    VACUUM_FEATURES.RETURN_HOME,
  );
  assert.equal(card.getRequiredFeatureForService("vacuum.locate"), VACUUM_FEATURES.LOCATE);
  assert.equal(card.getRequiredFeatureForService("vacuum.clean_spot"), VACUUM_FEATURES.CLEAN_SPOT);
});

test("capability mapping: deprecated toggle services do not infer modern automatic features", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  assert.equal(card.getRequiredFeatureForService("vacuum.turn_on"), undefined);
  assert.equal(card.getRequiredFeatureForService("vacuum.turn_off"), undefined);
  assert.equal(card.getRequiredFeatureForService("custom.service"), undefined);
});

test("vendor mapping: Pause button with vacuum.stop derives STOP feature flag", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  const pauseButton = {
    id: "pause",
    service: "vacuum.stop",
  };

  const feature = card.getRequiredFeatureForButton(pauseButton);
  assert.equal(feature, VACUUM_FEATURES.STOP);
});

test("action presentation: unsupported automatic action is hidden (absent from DOM)", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  // Vacuum supports START, PAUSE, RETURN_HOME, but lacks LOCATE (512) and CLEAN_SPOT (1024)
  const supported =
    VACUUM_FEATURES.STATE |
    VACUUM_FEATURES.START |
    VACUUM_FEATURES.PAUSE |
    VACUUM_FEATURES.RETURN_HOME;
  const hass = createHass({
    states: {
      "vacuum.minimal": {
        attributes: { supported_features: supported },
        entity_id: "vacuum.minimal",
        state: "docked",
      },
    },
  });

  card.setConfig({ entity: "vacuum.minimal" });
  card.hass = hass;

  const locateButton = card.config.buttons.locate;
  const locateEval = card.evaluateButton(locateButton);
  assert.equal(locateEval.visible, false);
  assert.equal(card.renderButton(Object.assign({ id: "locate" }, locateButton)), null);

  const startButton = card.config.buttons.start;
  const startEval = card.evaluateButton(startButton);
  assert.equal(startEval.visible, true);
  assert.equal(startEval.disabled, false);
  assert.ok(card.renderButton(Object.assign({ id: "start" }, startButton)) !== null);
});

test("action presentation: show: false is unconditionally hidden even when supported", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  const supported = VACUUM_FEATURES.STATE | VACUUM_FEATURES.START | VACUUM_FEATURES.LOCATE;
  const hass = createHass({
    states: {
      "vacuum.test": {
        attributes: { supported_features: supported },
        entity_id: "vacuum.test",
        state: "docked",
      },
    },
  });

  card.setConfig({
    entity: "vacuum.test",
    buttons: {
      start: { show: false },
    },
  });
  card.hass = hass;

  const startEval = card.evaluateButton(card.config.buttons.start);
  assert.equal(startEval.visible, false);
  assert.equal(card.renderButton(Object.assign({ id: "start" }, card.config.buttons.start)), null);
});

test("action presentation: show: true bypasses feature check but enforces state and availability guards", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  // Entity has 0 supported_features (legacy incomplete integration)
  const hass = createHass({
    states: {
      "vacuum.legacy_incomplete": {
        attributes: { supported_features: 0 },
        entity_id: "vacuum.legacy_incomplete",
        state: "cleaning",
      },
    },
  });

  card.setConfig({
    entity: "vacuum.legacy_incomplete",
    buttons: {
      start: { show: true },
      pause: { show: true },
    },
  });
  card.hass = hass;

  // Start is forced visible, but disabled because state is 'cleaning'
  const startEval = card.evaluateButton(card.config.buttons.start);
  assert.equal(startEval.visible, true);
  assert.equal(startEval.disabled, true);

  // Pause is forced visible and enabled because state is 'cleaning'
  const pauseEval = card.evaluateButton(card.config.buttons.pause);
  assert.equal(pauseEval.visible, true);
  assert.equal(pauseEval.disabled, false);
});
test("action presentation: custom buttons default to visible even with recognized services without capabilities", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  const hass = createHass({
    states: {
      "vacuum.custom_test": {
        attributes: { supported_features: 0 },
        entity_id: "vacuum.custom_test",
        state: "docked",
      },
    },
  });

  card.setConfig({
    entity: "vacuum.custom_test",
    buttons: {
      custom_spot: {
        service: "vacuum.clean_spot",
        icon: "mdi:broom",
      },
      custom_unrecognized: {
        service: "custom_domain.clean",
        icon: "mdi:vacuum",
      },
      custom_auto_spot: {
        service: "vacuum.clean_spot",
        icon: "mdi:broom",
        show: "auto",
      },
    },
  });
  card.hass = hass;

  // Custom button with recognized service defaults to visible
  const customSpotEval = card.evaluateButton(card.config.buttons.custom_spot);
  assert.equal(customSpotEval.visible, true);
  assert.equal(customSpotEval.disabled, false);

  // Custom button with unrecognized service defaults to visible
  const customUnrecognizedEval = card.evaluateButton(card.config.buttons.custom_unrecognized);
  assert.equal(customUnrecognizedEval.visible, true);
  assert.equal(customUnrecognizedEval.disabled, false);

  // Custom button with recognized service and show: 'auto' participates in capability filtering (hidden)
  const customAutoSpotEval = card.evaluateButton(card.config.buttons.custom_auto_spot);
  assert.equal(customAutoSpotEval.visible, false);
});

test("action presentation: buttons_state_aware: false renders all buttons enabled and callable in legacy mode", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  const hass = createHass({
    states: {
      "vacuum.legacy_test": {
        attributes: { supported_features: 0 },
        entity_id: "vacuum.legacy_test",
        state: "cleaning",
      },
    },
  });

  card.setConfig({
    entity: "vacuum.legacy_test",
    buttons_state_aware: false,
  });
  card.hass = hass;

  // In cleaning state with 0 features, all buttons are visible, enabled, and callable
  const startEval = card.evaluateButton(card.config.buttons.start);
  assert.equal(startEval.visible, true);
  assert.equal(startEval.disabled, false);
  assert.equal(startEval.callable, true);

  const pauseEval = card.evaluateButton(card.config.buttons.pause);
  assert.equal(pauseEval.visible, true);
  assert.equal(pauseEval.disabled, false);
  assert.equal(pauseEval.callable, true);

  const stopEval = card.evaluateButton(card.config.buttons.stop);
  assert.equal(stopEval.visible, true);
  assert.equal(stopEval.disabled, false);
  assert.equal(stopEval.callable, true);

  await card.callActionButton(card.config.buttons.start);
  assert.deepEqual(hass.calls.services, [
    {
      domain: "vacuum",
      service: "start",
      data: { entity_id: "vacuum.legacy_test" },
    },
  ]);
});

test("action presentation: user-supplied id or custom in button config cannot override computed keys", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  card.setConfig({
    entity: "vacuum.override_test",
    buttons: {
      start: {
        id: "malicious_spoofed_id",
        custom: true,
      },
      custom_action: {
        id: "start",
        custom: false,
      },
    },
  });

  assert.equal(card.config.buttons.start.id, "start");
  assert.equal(card.config.buttons.start.custom, false);
  assert.equal(card.config.buttons.custom_action.id, "custom_action");
  assert.equal(card.config.buttons.custom_action.custom, true);
});

test("action presentation: table-driven matrix for every action and activity state", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  // Entity supports all features
  const allFeatures =
    VACUUM_FEATURES.START |
    VACUUM_FEATURES.PAUSE |
    VACUUM_FEATURES.STOP |
    VACUUM_FEATURES.RETURN_HOME |
    VACUUM_FEATURES.LOCATE |
    VACUUM_FEATURES.CLEAN_SPOT;

  const statesToTest = [
    "docked",
    "cleaning",
    "paused",
    "idle",
    "returning",
    "error",
    "on",
    "off",
    "unavailable",
    "unknown",
  ];

  // Expected disabled states for each action when supported_features has all flags:
  const expectedDisabled = {
    start: ["cleaning", "on", "unavailable", "unknown"],
    pause: ["docked", "idle", "paused", "returning", "error", "off", "unavailable", "unknown"], // only cleaning and on are enabled
    stop: ["docked", "off", "idle", "unavailable", "unknown"],
    return: ["returning", "unavailable", "unknown"],
    locate: ["unavailable", "unknown"],
    spot: ["unavailable", "unknown"],
  };

  for (const currentState of statesToTest) {
    const hass = createHass({
      states: {
        "vacuum.matrix": {
          attributes: { supported_features: allFeatures },
          entity_id: "vacuum.matrix",
          state: currentState,
        },
      },
    });

    card.setConfig({ entity: "vacuum.matrix" });
    card.hass = hass;

    for (const [actionId, disabledStates] of Object.entries(expectedDisabled)) {
      const buttonConfig = card.config.buttons[actionId];
      assert.ok(buttonConfig, `Default config must define button ${actionId}`);
      const result = card.evaluateButton(Object.assign({ id: actionId }, buttonConfig));
      assert.equal(
        result.visible,
        true,
        `Action ${actionId} should be visible in state ${currentState}`,
      );
      const shouldBeDisabled = disabledStates.includes(currentState);
      assert.equal(
        result.disabled,
        shouldBeDisabled,
        `Action ${actionId} disabled expected ${shouldBeDisabled} but got ${result.disabled} in state ${currentState}`,
      );
    }
  }
});

test("dispatch guard: re-evaluates state and blocks service call when action is disabled", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  const allFeatures =
    VACUUM_FEATURES.START |
    VACUUM_FEATURES.PAUSE |
    VACUUM_FEATURES.STOP |
    VACUUM_FEATURES.RETURN_HOME;

  const entityState = {
    attributes: { supported_features: allFeatures },
    entity_id: "vacuum.guarded",
    state: "docked", // Initially docked -> Start is enabled
  };

  const hass = createHass({
    states: {
      "vacuum.guarded": { ...entityState },
    },
  });

  card.setConfig({ entity: "vacuum.guarded" });
  card.hass = hass;

  // Verify that Start is initially evaluated as enabled at render time
  const initialEval = card.evaluateButton(card.config.buttons.start);
  assert.equal(initialEval.visible, true);
  assert.equal(initialEval.disabled, false);
  assert.equal(initialEval.callable, true);

  // State transitions from docked -> cleaning before user click / dispatch completes
  card.hass = {
    ...hass,
    states: {
      "vacuum.guarded": {
        ...entityState,
        state: "cleaning", // Start becomes disabled while cleaning
      },
    },
  };

  // Attempting to dispatch the previously enabled Start action must be blocked by runtime guard
  await card.callActionButton(card.config.buttons.start);

  assert.deepEqual(
    hass.calls.services,
    [],
    "Service call should not be dispatched for blocked action after state transition",
  );
});

test("dispatch guard: re-evaluates capability and blocks service call when feature is unsupported", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  // Initially has STOP feature
  const initialFeatures =
    VACUUM_FEATURES.START | VACUUM_FEATURES.STOP | VACUUM_FEATURES.RETURN_HOME;

  const entityState = {
    attributes: { supported_features: initialFeatures },
    entity_id: "vacuum.guarded",
    state: "cleaning", // Stop is enabled while cleaning
  };

  const hass = createHass({
    states: {
      "vacuum.guarded": { ...entityState },
    },
  });

  card.setConfig({ entity: "vacuum.guarded" });
  card.hass = hass;

  // Verify Stop is initially evaluated as enabled at render time
  const initialEval = card.evaluateButton(card.config.buttons.stop);
  assert.equal(initialEval.visible, true);
  assert.equal(initialEval.disabled, false);
  assert.equal(initialEval.callable, true);

  // Capability loses STOP feature before click dispatch
  const featuresWithoutStop = VACUUM_FEATURES.START | VACUUM_FEATURES.RETURN_HOME;
  card.hass = {
    ...hass,
    states: {
      "vacuum.guarded": {
        ...entityState,
        attributes: { supported_features: featuresWithoutStop },
      },
    },
  };

  // Stop is now unsupported -> dispatch must be blocked by runtime guard
  await card.callActionButton(card.config.buttons.stop);

  assert.deepEqual(
    hass.calls.services,
    [],
    "Service call should not be dispatched when feature is unsupported after capability transition",
  );
});

test("dispatch guard: allows service call when action is enabled and valid", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  const allFeatures = VACUUM_FEATURES.START | VACUUM_FEATURES.RETURN_HOME;

  const hass = createHass({
    states: {
      "vacuum.guarded": {
        attributes: { supported_features: allFeatures },
        entity_id: "vacuum.guarded",
        state: "docked", // Start is enabled while docked
      },
    },
  });

  card.setConfig({ entity: "vacuum.guarded" });
  card.hass = hass;

  await card.callActionButton(card.config.buttons.start);

  assert.deepEqual(hass.calls.services, [
    {
      domain: "vacuum",
      service: "start",
      data: { entity_id: "vacuum.guarded" },
    },
  ]);
});

test("legacy compatibility: vendor preset with vacuum.turn_on dispatches when entity is available", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  const hass = createHass({
    states: {
      "vacuum.deebot": {
        attributes: { supported_features: 0 },
        entity_id: "vacuum.deebot",
        state: "docked",
      },
    },
  });

  card.setConfig({ entity: "vacuum.deebot", vendor: "deebot" });
  card.hass = hass;

  // Deebot maps start to vacuum.turn_on
  const startButton = card.config.buttons.start;
  assert.equal(startButton.service, "vacuum.turn_on");

  const startEval = card.evaluateButton(startButton);
  assert.equal(startEval.visible, true);
  assert.equal(startEval.disabled, false);

  await card.callActionButton(startButton);

  assert.deepEqual(hass.calls.services, [
    {
      domain: "vacuum",
      service: "turn_on",
      data: { entity_id: "vacuum.deebot" },
    },
  ]);
});

test("legacy compatibility: vendor preset robovac hides stop and forces spot visible", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  const hass = createHass({
    states: {
      "vacuum.eufy_robovac": {
        attributes: { supported_features: 0 },
        entity_id: "vacuum.eufy_robovac",
        state: "docked",
      },
    },
  });

  card.setConfig({ entity: "vacuum.eufy_robovac", vendor: "robovac" });
  card.hass = hass;

  // Robovac preset hides stop
  const stopButton = card.config.buttons.stop;
  const stopEval = card.evaluateButton(stopButton);
  assert.equal(stopEval.visible, false);

  // Robovac preset forces spot visible (show: true)
  const spotButton = card.config.buttons.spot;
  assert.equal(spotButton.show, true);
  const spotEval = card.evaluateButton(spotButton);
  assert.equal(spotEval.visible, true);
  assert.equal(spotEval.disabled, false);

  await card.callActionButton(spotButton);

  assert.deepEqual(hass.calls.services, [
    {
      domain: "vacuum",
      service: "clean_spot",
      data: { entity_id: "vacuum.eufy_robovac" },
    },
  ]);
});
