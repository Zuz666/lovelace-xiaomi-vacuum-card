import assert from "node:assert/strict";
import test from "node:test";

import { createHass, loadCard, toHost } from "./helpers/card-harness.mjs";

test("registers card and editor custom elements", async () => {
  const { Card, Editor, registry } = await loadCard();

  assert.equal(registry.get("xiaomi-vacuum-card"), Card);
  assert.equal(registry.get("xiaomi-vacuum-card-editor"), Editor);
});

test("registers Home Assistant card picker metadata", async () => {
  const { customCards } = await loadCard();
  const metadata = customCards.find((card) => card.type === "xiaomi-vacuum-card");

  assert.ok(metadata);
  assert.equal(metadata.preview, true);
  assert.equal(metadata.name, "Xiaomi Vacuum Card Reborn");
  assert.deepEqual(toHost(metadata.getEntitySuggestion({}, "vacuum.xiaomi")), {
    config: { type: "custom:xiaomi-vacuum-card", entity: "vacuum.xiaomi" },
  });
  assert.equal(metadata.getEntitySuggestion({}, "sensor.xiaomi"), null);
});

test("getStubConfig uses first vacuum entity", async () => {
  const { Card } = await loadCard();
  const hass = createHass({
    states: {
      "sensor.battery": { entity_id: "sensor.battery" },
      "vacuum.kitchen": { entity_id: "vacuum.kitchen" },
      "vacuum.bedroom": { entity_id: "vacuum.bedroom" },
    },
  });

  assert.deepEqual(toHost(Card.getStubConfig(hass)), { entity: "vacuum.kitchen" });
});

test("getConfigForm exposes vacuum entity selector and image upload selector", async () => {
  const { Card } = await loadCard();
  const schema = toHost(Card.getConfigForm()).schema;
  const entity = schema.find((field) => field.name === "entity");
  const image = schema.find((field) => field.name === "image");

  assert.equal(entity.required, true);
  assert.deepEqual(entity.selector, { entity: { filter: { domain: "vacuum" } } });
  assert.deepEqual(image.selector, {
    media: {
      accept: ["image/*"],
      clearable: true,
      hide_content_type: true,
      image_upload: true,
    },
  });
});

test("getGridOptions returns default grid options", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  card.setConfig({ entity: "vacuum.xiaomi" });

  assert.deepEqual(toHost(card.getGridOptions()), {
    columns: 6,
    min_columns: 3,
    max_columns: 12,
    rows: 4,
    min_rows: 2,
  });
});
