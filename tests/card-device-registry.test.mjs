import assert from "node:assert/strict";
import test from "node:test";

import { createHass, loadCard } from "./helpers/card-harness.mjs";

test("getRegistrySnapshot: extracts states, entities, and devices or defaults to null/empty", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  // Full hass object with entities and devices
  const fullHass = createHass({
    states: { "vacuum.test": { state: "docked" } },
    entities: { "vacuum.test": { device_id: "dev_1", platform: "roborock" } },
    devices: { dev_1: { id: "dev_1", name: "Roborock S7" } },
  });
  card.hass = fullHass;
  const snap1 = card.getRegistrySnapshot();
  assert.equal(snap1.states, fullHass.states);
  assert.equal(snap1.entities, fullHass.entities);
  assert.equal(snap1.devices, fullHass.devices);

  // Hass with no entities or devices
  const minimalHass = createHass({
    states: { "vacuum.test": { state: "docked" } },
  });
  card.hass = minimalHass;
  const snap2 = card.getRegistrySnapshot();
  assert.equal(snap2.states, minimalHass.states);
  assert.equal(snap2.entities, null);
  assert.equal(snap2.devices, null);

  // Null hass
  card.hass = null;
  const snap3 = card.getRegistrySnapshot();
  assert.equal(Object.keys(snap3.states).length, 0);
  assert.equal(snap3.entities, null);
  assert.equal(snap3.devices, null);
});

test("device registry discovery: auto-discovers renamed battery sensor on the same device", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  const hass = createHass({
    states: {
      "vacuum.living_room_vacuum": {
        attributes: {},
        entity_id: "vacuum.living_room_vacuum",
        state: "docked",
      },
      "sensor.custom_renamed_vacuum_power": {
        attributes: { device_class: "battery" },
        entity_id: "sensor.custom_renamed_vacuum_power",
        state: "84",
      },
    },
    entities: {
      "vacuum.living_room_vacuum": {
        device_id: "device_roborock_s7",
        entity_id: "vacuum.living_room_vacuum",
        platform: "roborock",
      },
      "sensor.custom_renamed_vacuum_power": {
        device_id: "device_roborock_s7",
        disabled_by: null,
        entity_id: "sensor.custom_renamed_vacuum_power",
        hidden_by: null,
        platform: "roborock",
      },
    },
    devices: {
      device_roborock_s7: {
        id: "device_roborock_s7",
        name: "Roborock S7",
      },
    },
  });

  card.setConfig({ entity: "vacuum.living_room_vacuum" });
  card.hass = hass;

  const discoveredId = card.resolveDiscoveredBatteryEntity();
  assert.equal(discoveredId, "sensor.custom_renamed_vacuum_power");

  const source = card.resolveAttributeSource(card.config.state.battery);
  assert.equal(source.rawValue, "84");
  assert.equal(source.isBattery, true);
  assert.equal(source.entityState.entity_id, "sensor.custom_renamed_vacuum_power");

  const rendered = card.renderAttribute(card.config.state.battery);
  const text = rendered.values.find((v) => typeof v === "string" && v.includes("84%"));
  assert.ok(text, "Rendered attribute must include discovered sensor value (84%)");
});

test("source precedence: explicit entity > same-device sensor > modern name > legacy name > vacuum attributes", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  // 1. Explicit entity present -> takes highest precedence
  const hassAll = createHass({
    states: {
      "sensor.explicit_battery": {
        attributes: { device_class: "battery" },
        entity_id: "sensor.explicit_battery",
        state: "99",
      },
      "sensor.same_device_battery": {
        attributes: { device_class: "battery" },
        entity_id: "sensor.same_device_battery",
        state: "88",
      },
      "sensor.my_vacuum_battery": {
        attributes: {},
        entity_id: "sensor.my_vacuum_battery",
        state: "77",
      },
      "sensor.my_vacuum_battery_level": {
        attributes: {},
        entity_id: "sensor.my_vacuum_battery_level",
        state: "66",
      },
      "vacuum.my_vacuum": {
        attributes: { battery: 44, battery_level: 55 },
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
    },
    entities: {
      "vacuum.my_vacuum": { device_id: "dev_1", platform: "roborock" },
      "sensor.same_device_battery": { device_id: "dev_1", platform: "roborock" },
    },
  });

  card.setConfig({
    entity: "vacuum.my_vacuum",
    state: {
      battery: {
        entity: "sensor.explicit_battery",
        key: "battery_level",
        unit: "%",
      },
    },
  });
  card.hass = hassAll;
  assert.equal(card.resolveAttributeSource(card.config.state.battery).rawValue, "99");

  // 2. Missing explicit entity falls through to same-device sensor
  card.setConfig({
    entity: "vacuum.my_vacuum",
    state: {
      battery: {
        entity: "sensor.missing_explicit_sensor",
        key: "battery_level",
        unit: "%",
      },
    },
  });
  card.hass = hassAll;
  assert.equal(card.resolveAttributeSource(card.config.state.battery).rawValue, "88");

  // 3. No explicit config -> same-device sensor overrides modern name sensor
  card.setConfig({ entity: "vacuum.my_vacuum" });
  card.hass = hassAll;
  assert.equal(card.resolveAttributeSource(card.config.state.battery).rawValue, "88");

  // 4. No same-device sensor -> modern name sensor overrides legacy name and vacuum attributes
  const hassNoDevice = createHass({
    states: {
      "sensor.my_vacuum_battery": {
        attributes: {},
        entity_id: "sensor.my_vacuum_battery",
        state: "77",
      },
      "sensor.my_vacuum_battery_level": {
        attributes: {},
        entity_id: "sensor.my_vacuum_battery_level",
        state: "66",
      },
      "vacuum.my_vacuum": {
        attributes: { battery: 44, battery_level: 55 },
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
    },
  });
  card.hass = hassNoDevice;
  assert.equal(card.resolveAttributeSource(card.config.state.battery).rawValue, "77");

  // 5. No modern name sensor -> legacy name sensor overrides vacuum attributes
  const hassLegacyName = createHass({
    states: {
      "sensor.my_vacuum_battery_level": {
        attributes: {},
        entity_id: "sensor.my_vacuum_battery_level",
        state: "66",
      },
      "vacuum.my_vacuum": {
        attributes: { battery: 44, battery_level: 55 },
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
    },
  });
  card.hass = hassLegacyName;
  assert.equal(card.resolveAttributeSource(card.config.state.battery).rawValue, "66");

  // 6. No name sensors -> vacuum battery_level attribute overrides battery attribute
  const hassAttributes = createHass({
    states: {
      "vacuum.my_vacuum": {
        attributes: { battery: 44, battery_level: 55 },
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
    },
  });
  card.hass = hassAttributes;
  assert.equal(card.resolveAttributeSource(card.config.state.battery).rawValue, 55);

  // 7. No battery_level attribute -> vacuum battery attribute is used
  const hassAttrBattery = createHass({
    states: {
      "vacuum.my_vacuum": {
        attributes: { battery: 44 },
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
    },
  });
  card.hass = hassAttrBattery;
  assert.equal(card.resolveAttributeSource(card.config.state.battery).rawValue, 44);

  // 8. No battery sources -> returns null
  const hassNone = createHass({
    states: {
      "vacuum.my_vacuum": {
        attributes: {},
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
    },
  });
  card.hass = hassNone;
  assert.equal(card.resolveAttributeSource(card.config.state.battery).rawValue, null);
});

test("same-device charging binary sensor: influences rendered battery icon", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  const createChargingHass = (chargingState, batteryState = "73") =>
    createHass({
      states: {
        "vacuum.my_vacuum": {
          attributes: {},
          entity_id: "vacuum.my_vacuum",
          state: "docked",
        },
        "sensor.my_vacuum_battery": {
          attributes: { device_class: "battery" },
          entity_id: "sensor.my_vacuum_battery",
          state: batteryState,
        },
        "binary_sensor.my_vacuum_charging": {
          attributes: { device_class: "battery_charging" },
          entity_id: "binary_sensor.my_vacuum_charging",
          state: chargingState,
        },
      },
      entities: {
        "vacuum.my_vacuum": { device_id: "dev_1", platform: "roborock" },
        "sensor.my_vacuum_battery": { device_id: "dev_1", platform: "roborock" },
        "binary_sensor.my_vacuum_charging": { device_id: "dev_1", platform: "roborock" },
      },
    });

  card.setConfig({ entity: "vacuum.my_vacuum" });

  // 1. Charging state: "on" -> mdi:battery-charging-70
  card.hass = createChargingHass("on", "73");
  const chargingSourceOn = card.resolveChargingSource();
  assert.equal(chargingSourceOn.isCharging, true);
  assert.equal(chargingSourceOn.entityId, "binary_sensor.my_vacuum_charging");
  const iconOn = card.renderIcon(card.config.state.battery);
  assert.ok(iconOn.values.includes("mdi:battery-charging-70"));

  // 2. Charging 100% -> mdi:battery-charging-100
  card.hass = createChargingHass("on", "100");
  const iconOn100 = card.renderIcon(card.config.state.battery);
  assert.ok(iconOn100.values.includes("mdi:battery-charging-100"));

  // 3. Charging 0% -> mdi:battery-charging-outline
  card.hass = createChargingHass("on", "0");
  const iconOn0 = card.renderIcon(card.config.state.battery);
  assert.ok(iconOn0.values.includes("mdi:battery-charging-outline"));

  // 4. Charging state: "off" -> mdi:battery-70
  card.hass = createChargingHass("off", "73");
  const chargingSourceOff = card.resolveChargingSource();
  assert.equal(chargingSourceOff.isCharging, false);
  const iconOff = card.renderIcon(card.config.state.battery);
  assert.ok(iconOff.values.includes("mdi:battery-70"));

  // 5. Charging state: "unavailable" -> mdi:battery-70
  card.hass = createChargingHass("unavailable", "73");
  const chargingSourceUnavailable = card.resolveChargingSource();
  assert.equal(chargingSourceUnavailable.isCharging, false);
  const iconUnavailable = card.renderIcon(card.config.state.battery);
  assert.ok(iconUnavailable.values.includes("mdi:battery-70"));
});

test("legacy charging attributes: influences rendered battery icon when binary sensor is absent", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  card.setConfig({ entity: "vacuum.my_vacuum" });

  // 1. Legacy vacuumState.attributes.battery_icon = 'mdi:battery-charging-80' with numeric battery_level
  card.hass = createHass({
    states: {
      "vacuum.my_vacuum": {
        attributes: {
          battery_level: 80,
          battery_icon: "mdi:battery-charging-80",
        },
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
    },
  });

  const chargingSource = card.resolveChargingSource();
  assert.equal(chargingSource.isCharging, true);
  const icon = card.renderIcon(card.config.state.battery);
  assert.ok(icon.values.includes("mdi:battery-charging-80"));

  // 2. Legacy vacuumState.attributes.is_charging = true
  card.hass = createHass({
    states: {
      "vacuum.my_vacuum": {
        attributes: {
          battery_level: 60,
          is_charging: true,
        },
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
    },
  });
  assert.equal(card.resolveChargingSource().isCharging, true);
  const icon60 = card.renderIcon(card.config.state.battery);
  assert.ok(icon60.values.includes("mdi:battery-charging-60"));
});

test("entity eligibility: excluded disabled, hidden, wrong-domain, wrong-device-class, or missing-state entries fall through", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  const testFallthrough = (entityRegistryOverride, stateOverride) => {
    return createHass({
      states: {
        "vacuum.my_vacuum": {
          attributes: {},
          entity_id: "vacuum.my_vacuum",
          state: "docked",
        },
        "sensor.my_vacuum_battery": {
          attributes: {},
          entity_id: "sensor.my_vacuum_battery",
          state: "50",
        },
        ...stateOverride,
      },
      entities: {
        "vacuum.my_vacuum": { device_id: "dev_1", platform: "roborock" },
        "sensor.candidate_battery": {
          device_id: "dev_1",
          platform: "roborock",
          ...entityRegistryOverride,
        },
      },
    });
  };

  card.setConfig({ entity: "vacuum.my_vacuum" });

  // 1. disabled_by: "user" -> excluded
  card.hass = testFallthrough(
    { disabled_by: "user" },
    { "sensor.candidate_battery": { attributes: { device_class: "battery" }, state: "80" } },
  );
  assert.equal(card.resolveDiscoveredBatteryEntity(), null);
  assert.equal(card.resolveAttributeSource(card.config.state.battery).rawValue, "50");

  // 2. disabled_by: "integration" -> excluded
  card.hass = testFallthrough(
    { disabled_by: "integration" },
    { "sensor.candidate_battery": { attributes: { device_class: "battery" }, state: "80" } },
  );
  assert.equal(card.resolveDiscoveredBatteryEntity(), null);

  // 3. hidden_by: "user" -> excluded
  card.hass = testFallthrough(
    { hidden_by: "user" },
    { "sensor.candidate_battery": { attributes: { device_class: "battery" }, state: "80" } },
  );
  assert.equal(card.resolveDiscoveredBatteryEntity(), null);

  // 4. display entry hidden: true -> excluded
  card.hass = testFallthrough(
    { hidden: true },
    { "sensor.candidate_battery": { attributes: { device_class: "battery" }, state: "80" } },
  );
  assert.equal(card.resolveDiscoveredBatteryEntity(), null);

  // 5. entry not in states -> excluded
  card.hass = testFallthrough({}, {});
  assert.equal(card.resolveDiscoveredBatteryEntity(), null);

  // 6. entry in states with wrong device_class -> excluded
  card.hass = testFallthrough(
    {},
    { "sensor.candidate_battery": { attributes: { device_class: "temperature" }, state: "80" } },
  );
  assert.equal(card.resolveDiscoveredBatteryEntity(), null);

  // 7. entry in states with missing device_class -> excluded
  card.hass = testFallthrough({}, { "sensor.candidate_battery": { attributes: {}, state: "80" } });
  assert.equal(card.resolveDiscoveredBatteryEntity(), null);

  // 8. entry with wrong domain (e.g. binary_sensor as battery) -> excluded
  const hassWrongDomain = createHass({
    states: {
      "vacuum.my_vacuum": {
        attributes: {},
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
      "binary_sensor.candidate_battery": {
        attributes: { device_class: "battery" },
        state: "on",
      },
      "sensor.my_vacuum_battery": { attributes: {}, state: "50" },
    },
    entities: {
      "vacuum.my_vacuum": { device_id: "dev_1", platform: "roborock" },
      "binary_sensor.candidate_battery": { device_id: "dev_1", platform: "roborock" },
    },
  });
  card.hass = hassWrongDomain;
  assert.equal(card.resolveDiscoveredBatteryEntity(), null);

  // 9. entry attached to different device -> excluded
  const hassOtherDevice = createHass({
    states: {
      "vacuum.my_vacuum": {
        attributes: {},
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
      "sensor.other_device_battery": {
        attributes: { device_class: "battery" },
        state: "80",
      },
      "sensor.my_vacuum_battery": { attributes: {}, state: "50" },
    },
    entities: {
      "vacuum.my_vacuum": { device_id: "dev_1", platform: "roborock" },
      "sensor.other_device_battery": { device_id: "dev_2", platform: "roborock" },
    },
  });
  card.hass = hassOtherDevice;
  assert.equal(card.resolveDiscoveredBatteryEntity(), null);
});

test("unavailable and unknown stability: discovered entities in unavailable/unknown state stay selected and do not fall back", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  const hassUnavailable = {
    ...createHass({
      states: {
        "vacuum.my_vacuum": {
          attributes: { battery_level: 95 },
          entity_id: "vacuum.my_vacuum",
          state: "docked",
        },
        "sensor.renamed_vacuum_battery": {
          attributes: { device_class: "battery" },
          entity_id: "sensor.renamed_vacuum_battery",
          state: "unavailable",
        },
        "sensor.my_vacuum_battery": {
          attributes: {},
          entity_id: "sensor.my_vacuum_battery",
          state: "90",
        },
      },
      entities: {
        "vacuum.my_vacuum": { device_id: "dev_1", platform: "roborock" },
        "sensor.renamed_vacuum_battery": { device_id: "dev_1", platform: "roborock" },
      },
    }),
    localize: (key) => (key === "state.default.unavailable" ? "Unavailable" : key),
  };

  card.setConfig({ entity: "vacuum.my_vacuum" });
  card.hass = hassUnavailable;

  const source = card.resolveAttributeSource(card.config.state.battery);
  assert.equal(source.rawValue, "unavailable");
  assert.equal(source.entityState.entity_id, "sensor.renamed_vacuum_battery");

  const rendered = card.renderAttribute(card.config.state.battery);
  const text = rendered.values.find((v) => typeof v === "string" && v.includes("Unavailable"));
  assert.ok(text, "Must render localized Unavailable and not fall back to 90% or 95%");

  // Unknown state
  const hassUnknown = {
    ...createHass({
      states: {
        "vacuum.my_vacuum": {
          attributes: { battery_level: 95 },
          entity_id: "vacuum.my_vacuum",
          state: "docked",
        },
        "sensor.renamed_vacuum_battery": {
          attributes: { device_class: "battery" },
          entity_id: "sensor.renamed_vacuum_battery",
          state: "unknown",
        },
      },
      entities: {
        "vacuum.my_vacuum": { device_id: "dev_1", platform: "roborock" },
        "sensor.renamed_vacuum_battery": { device_id: "dev_1", platform: "roborock" },
      },
    }),
    localize: (key) => (key === "state.default.unknown" ? "Unknown" : key),
  };

  card.hass = hassUnknown;
  const sourceUnknown = card.resolveAttributeSource(card.config.state.battery);
  assert.equal(sourceUnknown.rawValue, "unknown");
  const renderedUnknown = card.renderAttribute(card.config.state.battery);
  const textUnknown = renderedUnknown.values.find(
    (v) => typeof v === "string" && v.includes("Unknown"),
  );
  assert.ok(textUnknown, "Must render localized Unknown and not fall back");

  // Non-battery row with unavailable state
  const hassNonBatteryUnavailable = {
    ...createHass({
      states: {
        "vacuum.my_vacuum": {
          attributes: { fan_speed: "unavailable" },
          entity_id: "vacuum.my_vacuum",
          state: "docked",
        },
      },
    }),
    localize: (key) => (key === "state.default.unavailable" ? "Unavailable" : key),
  };
  card.hass = hassNonBatteryUnavailable;
  const renderedMode = card.renderAttribute(card.config.state.mode);
  const textMode = renderedMode.values.find(
    (v) => typeof v === "string" && v.includes("Unavailable"),
  );
  assert.ok(textMode, "Non-battery row must render localized Unavailable");

  // Localize returning empty string falls back to default "Unavailable"
  const hassEmptyLocalize = {
    ...createHass({
      states: {
        "vacuum.my_vacuum": {
          attributes: { battery_level: "unavailable" },
          entity_id: "vacuum.my_vacuum",
          state: "docked",
        },
      },
    }),
    localize: () => "",
  };
  card.hass = hassEmptyLocalize;
  const renderedEmpty = card.renderAttribute(card.config.state.battery);
  const textEmpty = renderedEmpty.values.find(
    (v) => typeof v === "string" && v.includes("Unavailable"),
  );
  assert.ok(textEmpty, "Must fallback to default Unavailable when localize returns empty string");
});

test("ambiguous candidate selection: prefers matching platform, sorts entity_id alphabetically, and emits sanitized diagnostic", async () => {
  const { Card, calls: harnessCalls } = await loadCard();
  const card = new Card();

  // 1. Platform preference test
  const hassPlatformPreference = createHass({
    states: {
      "vacuum.my_vacuum": {
        attributes: {},
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
      "sensor.a_template_battery": {
        attributes: { device_class: "battery" },
        entity_id: "sensor.a_template_battery",
        state: "70",
      },
      "sensor.z_roborock_battery": {
        attributes: { device_class: "battery" },
        entity_id: "sensor.z_roborock_battery",
        state: "80",
      },
    },
    entities: {
      "vacuum.my_vacuum": { device_id: "dev_1", platform: "roborock" },
      "sensor.a_template_battery": { device_id: "dev_1", platform: "template" },
      "sensor.z_roborock_battery": { device_id: "dev_1", platform: "roborock" },
    },
  });

  card.setConfig({ entity: "vacuum.my_vacuum" });
  card.hass = hassPlatformPreference;

  const selectedPlatformMatch = card.resolveDiscoveredBatteryEntity();
  assert.equal(
    selectedPlatformMatch,
    "sensor.z_roborock_battery",
    "Must prefer matching platform 'roborock' over alphabetical 'template'",
  );

  const warnings = harnessCalls.console.filter((c) => c.method === "warn");
  assert.equal(warnings.length, 1);
  const warnText = warnings[0].args.join(" ");
  assert.ok(warnText.includes("Multiple battery candidates found for vacuum.my_vacuum"));
  assert.ok(warnText.includes("sensor.z_roborock_battery"));
  assert.ok(warnText.includes("Specify 'entity' in configuration"));
  assert.ok(!warnText.includes("dev_1"), "Diagnostic must not leak internal device_id");

  // Second call for same signature should not emit duplicate warning
  card.resolveDiscoveredBatteryEntity();
  const warningsAfterSecond = harnessCalls.console.filter((c) => c.method === "warn");
  assert.equal(
    warningsAfterSecond.length,
    1,
    "Must not emit duplicate warning for same candidate signature",
  );

  // 2. Alphabetical tie-break test when platforms match
  const hassAlphabetical = createHass({
    states: {
      "vacuum.my_vacuum": {
        attributes: {},
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
      "sensor.beta_battery": {
        attributes: { device_class: "battery" },
        entity_id: "sensor.beta_battery",
        state: "85",
      },
      "sensor.alpha_battery": {
        attributes: { device_class: "battery" },
        entity_id: "sensor.alpha_battery",
        state: "85",
      },
    },
    entities: {
      "vacuum.my_vacuum": { device_id: "dev_1", platform: "roborock" },
      "sensor.beta_battery": { device_id: "dev_1", platform: "roborock" },
      "sensor.alpha_battery": { device_id: "dev_1", platform: "roborock" },
    },
  });

  const card2 = new Card();
  card2.setConfig({ entity: "vacuum.my_vacuum" });
  card2.hass = hassAlphabetical;

  const selectedAlphabetical = card2.resolveDiscoveredBatteryEntity();
  assert.equal(selectedAlphabetical, "sensor.alpha_battery");
});

test("reactive dependency tracking: includes discovered battery and charging entities and detects entity/device map replacement", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  const hass1 = createHass({
    states: {
      "vacuum.my_vacuum": {
        attributes: {},
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
      "sensor.custom_battery": {
        attributes: { device_class: "battery" },
        entity_id: "sensor.custom_battery",
        state: "80",
      },
      "binary_sensor.custom_charging": {
        attributes: { device_class: "battery_charging" },
        entity_id: "binary_sensor.custom_charging",
        state: "on",
      },
    },
    entities: {
      "vacuum.my_vacuum": { device_id: "dev_1", platform: "roborock" },
      "sensor.custom_battery": { device_id: "dev_1", platform: "roborock" },
      "binary_sensor.custom_charging": { device_id: "dev_1", platform: "roborock" },
    },
    devices: {
      dev_1: { id: "dev_1", name: "Vacuum" },
    },
  });

  card.setConfig({ entity: "vacuum.my_vacuum" });
  card.hass = hass1;

  const referenced = card.getReferencedEntities();
  assert.ok(referenced.includes("vacuum.my_vacuum"));
  assert.ok(referenced.includes("sensor.custom_battery"));
  assert.ok(referenced.includes("binary_sensor.custom_charging"));

  // shouldUpdate on battery sensor state change
  const changedProps = new Map([["_hass", hass1]]);
  const hassStateChanged = {
    ...hass1,
    states: {
      ...hass1.states,
      "sensor.custom_battery": {
        ...hass1.states["sensor.custom_battery"],
        state: "81",
      },
    },
  };
  card.hass = hassStateChanged;
  assert.equal(card.shouldUpdate(changedProps), true);

  // shouldUpdate on charging sensor state change
  const hassChargingChanged = {
    ...hass1,
    states: {
      ...hass1.states,
      "binary_sensor.custom_charging": {
        ...hass1.states["binary_sensor.custom_charging"],
        state: "off",
      },
    },
  };
  card.hass = hassChargingChanged;
  assert.equal(card.shouldUpdate(changedProps), true);

  // shouldUpdate on entities registry map replacement
  const hassEntitiesReplaced = {
    ...hass1,
    entities: {
      ...hass1.entities,
      "sensor.new_battery": {
        device_id: "dev_1",
        platform: "roborock",
      },
    },
  };
  card.hass = hassEntitiesReplaced;
  assert.equal(card.shouldUpdate(changedProps), true);

  // shouldUpdate on devices map replacement
  const hassDevicesReplaced = {
    ...hass1,
    devices: {
      dev_1: { id: "dev_1", name: "Renamed Device" },
    },
  };
  card.hass = hassDevicesReplaced;
  assert.equal(card.shouldUpdate(changedProps), true);

  // shouldUpdate when a discovered candidate's device_class changes (structural ineligibility)
  const hassCandidateIneligible = {
    ...hass1,
    states: {
      ...hass1.states,
      "sensor.custom_battery": {
        ...hass1.states["sensor.custom_battery"],
        attributes: { device_class: "temperature" },
        state: "22",
      },
    },
  };
  card.hass = hassCandidateIneligible;
  assert.equal(card.shouldUpdate(changedProps), true);

  // shouldUpdate ignores unrelated state changes
  const hassUnrelatedChanged = {
    ...hass1,
    states: {
      ...hass1.states,
      "light.living_room": {
        entity_id: "light.living_room",
        state: "on",
      },
    },
  };
  card.hass = hassUnrelatedChanged;
  assert.equal(card.shouldUpdate(changedProps), false);
});
