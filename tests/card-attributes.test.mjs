import assert from "node:assert/strict";
import test from "node:test";

import { createHass, loadCard, toHost } from "./helpers/card-harness.mjs";

test("battery resolution: explicit entity overrides modern and legacy sensors and attributes", async () => {
  const { Card } = await loadCard();
  const card = new Card();
  const hass = createHass({
    states: {
      "sensor.custom_battery": {
        attributes: {},
        entity_id: "sensor.custom_battery",
        state: "99",
      },
      "sensor.my_vacuum_battery": {
        attributes: {},
        entity_id: "sensor.my_vacuum_battery",
        state: "88",
      },
      "vacuum.my_vacuum": {
        attributes: { battery_level: 55 },
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
    },
  });

  card.setConfig({
    entity: "vacuum.my_vacuum",
    state: {
      battery: {
        entity: "sensor.custom_battery",
        key: "battery_level",
        unit: "%",
      },
    },
  });
  card.hass = hass;

  const source = card.resolveAttributeSource(card.config.state.battery);
  assert.equal(source.rawValue, "99");
  assert.equal(source.isBattery, true);

  const rendered = card.renderAttribute(card.config.state.battery);
  assert.ok(rendered);
  const text = rendered.values.find((v) => typeof v === "string" && v.includes("99%"));
  assert.ok(text, "Rendered attribute must include 99%");
});

test("battery resolution: missing explicit entity falls through to modern sensor", async () => {
  const { Card } = await loadCard();
  const card = new Card();
  const hass = createHass({
    states: {
      "sensor.my_vacuum_battery": {
        attributes: {},
        entity_id: "sensor.my_vacuum_battery",
        state: "73",
      },
      "vacuum.my_vacuum": {
        attributes: {},
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
    },
  });

  card.setConfig({
    entity: "vacuum.my_vacuum",
    state: {
      battery: {
        entity: "sensor.non_existent_battery",
        key: "battery_level",
        unit: "%",
      },
    },
  });
  card.hass = hass;

  const source = card.resolveAttributeSource(card.config.state.battery);
  assert.equal(source.rawValue, "73");
  assert.equal(source.entityState.entity_id, "sensor.my_vacuum_battery");
});

test("battery resolution: modern sensor overrides legacy sensor and attributes", async () => {
  const { Card } = await loadCard();
  const card = new Card();
  const hass = createHass({
    states: {
      "sensor.my_vacuum_battery": {
        attributes: {},
        entity_id: "sensor.my_vacuum_battery",
        state: "85",
      },
      "sensor.my_vacuum_battery_level": {
        attributes: {},
        entity_id: "sensor.my_vacuum_battery_level",
        state: "75",
      },
      "vacuum.my_vacuum": {
        attributes: { battery: 35, battery_level: 45 },
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
    },
  });

  card.setConfig({ entity: "vacuum.my_vacuum" });
  card.hass = hass;

  const source = card.resolveAttributeSource(card.config.state.battery);
  assert.equal(source.rawValue, "85");
});

test("battery resolution: legacy sensor overrides vacuum attributes", async () => {
  const { Card } = await loadCard();
  const card = new Card();
  const hass = createHass({
    states: {
      "sensor.my_vacuum_battery_level": {
        attributes: {},
        entity_id: "sensor.my_vacuum_battery_level",
        state: "65",
      },
      "vacuum.my_vacuum": {
        attributes: { battery: 25, battery_level: 45 },
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
    },
  });

  card.setConfig({ entity: "vacuum.my_vacuum" });
  card.hass = hass;

  const source = card.resolveAttributeSource(card.config.state.battery);
  assert.equal(source.rawValue, "65");
});

test("battery resolution: vacuum.attributes.battery_level overrides vacuum.attributes.battery", async () => {
  const { Card } = await loadCard();
  const card = new Card();
  const hass = createHass({
    states: {
      "vacuum.my_vacuum": {
        attributes: { battery: 20, battery_level: 50 },
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
    },
  });

  card.setConfig({ entity: "vacuum.my_vacuum" });
  card.hass = hass;

  const source = card.resolveAttributeSource(card.config.state.battery);
  assert.equal(source.rawValue, 50);
});

test("battery resolution: 0% is rendered accurately and not treated as unavailable", async () => {
  const { Card } = await loadCard();
  const card = new Card();
  const hass = createHass({
    states: {
      "sensor.my_vacuum_battery": {
        attributes: {},
        entity_id: "sensor.my_vacuum_battery",
        state: "0",
      },
      "vacuum.my_vacuum": {
        attributes: {},
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
    },
  });

  card.setConfig({ entity: "vacuum.my_vacuum" });
  card.hass = hass;

  const source = card.resolveAttributeSource(card.config.state.battery);
  assert.equal(source.rawValue, "0");

  const rendered = card.renderAttribute(card.config.state.battery);
  const text = rendered.values.find((v) => typeof v === "string" && v.includes("0%"));
  assert.ok(text, "Must render 0%");
});

test("battery resolution: missing source returns null and displays localized unavailable", async () => {
  const { Card } = await loadCard();
  const card = new Card();
  const hass = {
    ...createHass({
      states: {
        "vacuum.my_vacuum": {
          attributes: {},
          entity_id: "vacuum.my_vacuum",
          state: "docked",
        },
      },
    }),
    localize: (key) => (key === "state.default.unavailable" ? "Unavailable" : key),
  };

  card.setConfig({ entity: "vacuum.my_vacuum" });
  card.hass = hass;

  const source = card.resolveAttributeSource(card.config.state.battery);
  assert.equal(source.rawValue, null);

  const rendered = card.renderAttribute(card.config.state.battery);
  const text = rendered.values.find((v) => typeof v === "string" && v.includes("Unavailable"));
  assert.ok(text, "Must render localized Unavailable");
});

test("battery icon: external sensor icon takes highest precedence", async () => {
  const { Card } = await loadCard();
  const card = new Card();
  const hass = createHass({
    states: {
      "sensor.my_vacuum_battery": {
        attributes: { icon: "mdi:battery-charging-high" },
        entity_id: "sensor.my_vacuum_battery",
        state: "73",
      },
      "vacuum.my_vacuum": {
        attributes: { battery_icon: "mdi:battery-alert" },
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
    },
  });

  card.setConfig({ entity: "vacuum.my_vacuum" });
  card.hass = hass;

  const renderedIcon = card.renderIcon(card.config.state.battery);
  assert.ok(renderedIcon);
  assert.ok(renderedIcon.values.includes("mdi:battery-charging-high"));
});

test("battery icon: deterministic numeric buckets clamp and round correctly", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  const testCases = [
    { expected: "mdi:battery-outline", state: "0" },
    { expected: "mdi:battery-outline", state: "-5" },
    { expected: "mdi:battery-10", state: "8" },
    { expected: "mdi:battery-50", state: "46" },
    { expected: "mdi:battery-70", state: "73" },
    { expected: "mdi:battery-90", state: "94" },
    { expected: "mdi:battery", state: "97" },
    { expected: "mdi:battery", state: "100" },
    { expected: "mdi:battery", state: "120" },
  ];

  for (const { expected, state } of testCases) {
    const hass = createHass({
      states: {
        "sensor.my_vacuum_battery": {
          attributes: {},
          entity_id: "sensor.my_vacuum_battery",
          state,
        },
        "vacuum.my_vacuum": {
          attributes: {},
          entity_id: "vacuum.my_vacuum",
          state: "docked",
        },
      },
    });

    card.setConfig({ entity: "vacuum.my_vacuum" });
    card.hass = hass;

    const renderedIcon = card.renderIcon(card.config.state.battery);
    assert.ok(renderedIcon, `Icon must render for state ${state}`);
    assert.ok(
      renderedIcon.values.includes(expected),
      `State ${state} should produce ${expected}, got ${renderedIcon.values.join(", ")}`,
    );
  }
});

test("non-battery attribute resolution follows explicit entity, sensorEntity, and vacuum attribute precedence", async () => {
  const { Card } = await loadCard();
  const card = new Card();
  const hass = createHass({
    states: {
      "sensor.custom_filter": {
        attributes: {},
        entity_id: "sensor.custom_filter",
        state: "120",
      },
      "sensor.my_vacuum_filter_left": {
        attributes: {},
        entity_id: "sensor.my_vacuum_filter_left",
        state: "90",
      },
      "vacuum.my_vacuum": {
        attributes: { filter_left: 40 },
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
    },
  });

  card.setConfig({
    attributes: {
      filter_left: {
        entity: "sensor.custom_filter",
        key: "filter_left",
        unit: "h",
      },
    },
    entity: "vacuum.my_vacuum",
  });
  card.hass = hass;

  const source = card.resolveAttributeSource(card.config.attributes.filter_left);
  assert.equal(source.rawValue, "120");
  assert.equal(source.isBattery, false);
});

test("editor entityDataRowSchema: battery row restricts entity selector to sensor battery and includes icon selector", async () => {
  const { Editor } = await loadCard();
  const editor = new Editor();

  const batterySchema = editor.entityDataRowSchema({ id: "battery", key: "battery_level" });
  const entityField = batterySchema.find((f) => f.name === "entity");
  assert.deepEqual(toHost(entityField.selector), {
    entity: {
      filter: {
        device_class: "battery",
        domain: "sensor",
      },
    },
  });
  const iconField = batterySchema.find((f) => f.name === "icon");
  assert.ok(iconField, "Battery row must always include icon selector");

  const filterSchema = editor.entityDataRowSchema({ id: "filter_left", key: "filter_left" });
  const filterEntityField = filterSchema.find((f) => f.name === "entity");
  assert.deepEqual(toHost(filterEntityField.selector), { entity: {} });
});
test("render() path: id-only battery row with custom key discovers modern sensor and renders icon/percentage", async () => {
  const { Card } = await loadCard();
  const card = new Card();
  const hass = createHass({
    states: {
      "sensor.my_vacuum_battery": {
        attributes: {},
        entity_id: "sensor.my_vacuum_battery",
        state: "62",
      },
      "vacuum.my_vacuum": {
        attributes: {},
        entity_id: "vacuum.my_vacuum",
        state: "docked",
      },
    },
  });

  // User configures state.battery with a custom key that does not match standard battery keys
  card.setConfig({
    entity: "vacuum.my_vacuum",
    state: {
      battery: {
        key: "custom_unmatched_key",
        unit: "%",
      },
    },
  });
  card.hass = hass;

  const renderedCard = card.render();
  assert.ok(renderedCard);
  // Find grid template from rendered ha-card
  const gridTemplate = renderedCard.values.find(
    (val) => val && val.strings && val.strings.some((s) => s.includes('class="grid"')),
  );
  assert.ok(gridTemplate, "Card must render grid");
  const stateTemplate = gridTemplate.values.find(
    (val) => val && val.strings && val.strings.some((s) => s.includes("grid-left")),
  );
  assert.ok(stateTemplate, "Card must render state content");

  const renderedRows = stateTemplate.values[0];
  assert.ok(Array.isArray(renderedRows) && renderedRows.length > 0);

  // Find the rendered battery row among the state rows
  const batteryRow = renderedRows.find(
    (row) =>
      row && row.values && row.values.some((v) => typeof v === "string" && v.includes("62%")),
  );
  assert.ok(batteryRow, "Must find rendered battery row with 62%");

  // Check that battery icon was resolved via numeric mapping
  const batteryIcon = batteryRow.values.find(
    (val) => val && val.values && Array.isArray(val.values),
  );
  assert.ok(batteryIcon, "Battery icon must be rendered");
  assert.ok(batteryIcon.values.includes("mdi:battery-60"));
});
