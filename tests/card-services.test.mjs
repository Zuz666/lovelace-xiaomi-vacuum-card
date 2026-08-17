import assert from "node:assert/strict";
import test from "node:test";

import { createHass, loadCard } from "./helpers/card-harness.mjs";

test("handleChange calls configured vacuum service with entity_id and fan_speed", async () => {
  const { Card } = await loadCard();
  const card = new Card();
  const hass = createHass({
    states: {
      "vacuum.xiaomi": {
        attributes: { fan_speed: "Silent" },
        entity_id: "vacuum.xiaomi",
        state: "docked",
      },
    },
  });

  card.setConfig({ entity: "vacuum.xiaomi" });
  card.hass = hass;
  card.handleChange("Turbo", "fan_speed", "vacuum.set_fan_speed");

  assert.deepEqual(hass.calls.services, [
    {
      domain: "vacuum",
      service: "set_fan_speed",
      data: { entity_id: "vacuum.xiaomi", fan_speed: "Turbo" },
    },
  ]);
});

test("media-source images call Home Assistant resolve_media", async () => {
  const { Card } = await loadCard();
  const card = new Card();
  const mediaContentId = "media-source://media_source/local/vacuum.png";
  const hass = createHass({
    states: {
      "vacuum.xiaomi": {
        attributes: {},
        entity_id: "vacuum.xiaomi",
        state: "docked",
      },
    },
    wsResult: { url: "/api/media_source_proxy/vacuum.png" },
  });

  card.setConfig({ entity: "vacuum.xiaomi", image: mediaContentId });
  card.hass = hass;
  await Promise.resolve();

  assert.deepEqual(hass.calls.ws, [
    {
      media_content_id: mediaContentId,
      type: "media_source/resolve_media",
    },
  ]);
});

test("editor-to-click: editor serializes dynamic button, click subscribes once and executes service", async () => {
  const { calls: harnessCalls, Card, Editor } = await loadCard();
  const editor = new Editor();
  const hass = createHass({
    states: {
      "vacuum.xiaomi": {
        attributes: {},
        entity_id: "vacuum.xiaomi",
        state: "docked",
      },
    },
    subscribeEvent: {
      result: { entity_id: "vacuum.wrong", fan_speed: "Standard" },
    },
  });

  editor.hass = hass;
  editor.setConfig({ entity: "vacuum.xiaomi" });

  editor.addCustomRow("buttons");
  const customIndex = editor._model.buttons.findIndex((b) => b.custom);
  assert.ok(customIndex >= 0);
  const customButtonId = editor._model.buttons[customIndex].id;

  editor.updateServiceDataMode(customIndex, "dynamic");
  editor.updateRow("buttons", customIndex, {
    detail: {
      value: {
        icon: "mdi:fan-auto",
        label: "Use selected fan speed",
        service: "vacuum.set_fan_speed",
        service_data_template:
          '{{ {"fan_speed": states("input_select.vacuum_fan_speed")} | tojson }}',
      },
    },
  });

  const lastEvent = harnessCalls.events[harnessCalls.events.length - 1];
  assert.equal(lastEvent.type, "config-changed");
  const generatedConfig = lastEvent.detail.config;

  assert.equal(generatedConfig.buttons[customButtonId].service_data_mode, "dynamic");
  assert.equal(
    generatedConfig.buttons[customButtonId].service_data_template,
    '{{ {"fan_speed": states("input_select.vacuum_fan_speed")} | tojson }}',
  );

  const card = new Card();
  card.setConfig(generatedConfig);
  card.hass = hass;

  const renderedButton = card.renderButton(card.config.buttons[customButtonId]);

  assert.ok(renderedButton);
  const clickHandler = renderedButton.values.find((val) => typeof val === "function");
  assert.ok(clickHandler, "Click handler must be bound");

  await clickHandler();

  assert.equal(hass.calls.ws.length, 0, "callWS must not be used for render_template");
  assert.equal(hass.calls.subscriptions.length, 1);
  assert.deepEqual(hass.calls.subscriptions[0].message, {
    report_errors: true,
    template: '{{ {"fan_speed": states("input_select.vacuum_fan_speed")} | tojson }}',
    type: "render_template",
  });
  assert.deepEqual(hass.calls.subscriptions[0].options, { resubscribe: false });
  assert.equal(hass.calls.unsubscribes, 1);

  assert.deepEqual(hass.calls.services, [
    {
      data: {
        entity_id: "vacuum.xiaomi",
        fan_speed: "Standard",
      },
      domain: "vacuum",
      service: "set_fan_speed",
    },
  ]);
});

test("synchronous-event-before-unsubscribe-Promise race resolves and unsubs once", async () => {
  const { Card } = await loadCard();
  const card = new Card();
  const hass = createHass({
    states: {
      "vacuum.xiaomi": {
        attributes: {},
        entity_id: "vacuum.xiaomi",
        state: "docked",
      },
    },
    subscribeEvent: { result: '{"power": "max"}' },
    syncCallback: true,
  });

  card.setConfig({ entity: "vacuum.xiaomi" });
  card.hass = hass;

  await card.callService("vacuum.start", "{{ template }}");

  assert.equal(hass.calls.ws.length, 0);
  assert.equal(hass.calls.subscriptions.length, 1);
  assert.equal(hass.calls.unsubscribes, 1);
  assert.deepEqual(hass.calls.services, [
    {
      data: {
        entity_id: "vacuum.xiaomi",
        power: "max",
      },
      domain: "vacuum",
      service: "start",
    },
  ]);
});

test("template subscription error logs and suppresses service call", async () => {
  const { calls: harnessCalls, Card } = await loadCard();
  const card = new Card();
  const hass = createHass({
    states: {
      "vacuum.xiaomi": {
        attributes: {},
        entity_id: "vacuum.xiaomi",
        state: "docked",
      },
    },
    subscribeError: "TemplateSyntaxError: unexpected char",
  });

  card.setConfig({ entity: "vacuum.xiaomi" });
  card.hass = hass;

  await card.callService("vacuum.start", "{{ invalid }}");

  assert.equal(hass.calls.services.length, 0);
  assert.equal(hass.calls.unsubscribes, 1);
  const errorLog = harnessCalls.console.find((c) =>
    c.args.some((a) => String(a).includes("[xiaomi-vacuum-card]")),
  );
  assert.ok(errorLog, "Must log error with [xiaomi-vacuum-card] prefix");
});

test("malformed JSON in template result logs and suppresses service call", async () => {
  const { calls: harnessCalls, Card } = await loadCard();
  const card = new Card();
  const hass = createHass({
    states: {
      "vacuum.xiaomi": {
        attributes: {},
        entity_id: "vacuum.xiaomi",
        state: "docked",
      },
    },
    subscribeEvent: { result: "NOT_JSON" },
  });

  card.setConfig({ entity: "vacuum.xiaomi" });
  card.hass = hass;

  await card.callService("vacuum.start", "{{ template }}");

  assert.equal(hass.calls.services.length, 0);
  assert.equal(hass.calls.unsubscribes, 1);
  const errorLog = harnessCalls.console.find((c) =>
    c.args.some((a) => String(a).includes("[xiaomi-vacuum-card]")),
  );
  assert.ok(errorLog);
});

test("null template result logs and suppresses service call", async () => {
  const { calls: harnessCalls, Card } = await loadCard();
  const card = new Card();
  const hass = createHass({
    states: {
      "vacuum.xiaomi": {
        attributes: {},
        entity_id: "vacuum.xiaomi",
        state: "docked",
      },
    },
    subscribeEvent: { result: "null" },
  });

  card.setConfig({ entity: "vacuum.xiaomi" });
  card.hass = hass;

  await card.callService("vacuum.start", "{{ template }}");

  assert.equal(hass.calls.services.length, 0);
  assert.equal(hass.calls.unsubscribes, 1);
  const errorLog = harnessCalls.console.find((c) =>
    c.args.some((a) => String(a).includes("[xiaomi-vacuum-card]")),
  );
  assert.ok(errorLog);
});

test("array template result logs and suppresses service call", async () => {
  const { calls: harnessCalls, Card } = await loadCard();
  const card = new Card();
  const hass = createHass({
    states: {
      "vacuum.xiaomi": {
        attributes: {},
        entity_id: "vacuum.xiaomi",
        state: "docked",
      },
    },
    subscribeEvent: { result: '["item1", "item2"]' },
  });

  card.setConfig({ entity: "vacuum.xiaomi" });
  card.hass = hass;

  await card.callService("vacuum.start", "{{ template }}");

  assert.equal(hass.calls.services.length, 0);
  assert.equal(hass.calls.unsubscribes, 1);
  const errorLog = harnessCalls.console.find((c) =>
    c.args.some((a) => String(a).includes("[xiaomi-vacuum-card]")),
  );
  assert.ok(errorLog);
});

test("unsubscribe failure logs cleanup error but does not block service call", async () => {
  const { calls: harnessCalls, Card } = await loadCard();
  const card = new Card();
  const hass = createHass({
    states: {
      "vacuum.xiaomi": {
        attributes: {},
        entity_id: "vacuum.xiaomi",
        state: "docked",
      },
    },
    subscribeEvent: { result: '{"speed": "gentle"}' },
    unsubscribeReject: new Error("network disconnected"),
  });

  card.setConfig({ entity: "vacuum.xiaomi" });
  card.hass = hass;

  await card.callService("vacuum.start", "{{ template }}");

  assert.deepEqual(hass.calls.services, [
    {
      data: {
        entity_id: "vacuum.xiaomi",
        speed: "gentle",
      },
      domain: "vacuum",
      service: "start",
    },
  ]);
  const errorLog = harnessCalls.console.find((c) =>
    c.args.some((a) =>
      String(a).includes("[xiaomi-vacuum-card] Error during template unsubscribe"),
    ),
  );
  assert.ok(errorLog);
});
