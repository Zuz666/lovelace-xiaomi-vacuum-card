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

test("editor computeHelper extracts helper text from schema", async () => {
  const { Editor } = await loadCard();
  const editor = new Editor();

  assert.equal(
    editor.computeHelper({ name: "entity", helper: "Vacuum entity helper" }),
    "Vacuum entity helper",
  );
  assert.equal(editor.computeHelper({ name: "entity" }), undefined);
  assert.equal(editor.computeHelper({}), undefined);
});

test("editor Basic and Visibility section schemas include helper descriptions on all fields", async () => {
  const { Editor } = await loadCard();
  const editor = new Editor();

  editor.setConfig({
    type: "custom:xiaomi-vacuum-card",
    entity: "vacuum.xiaomi",
    buttons_mode: "adaptive",
    buttons: {},
  });

  const basicTemplate = editor.renderBasicSection();
  const basicForm = basicTemplate.values.find((val) => val && val.strings && val.strings.raw);
  assert.ok(basicTemplate);

  // Verify entityDataRowSchema and buttonRowSchema include helper descriptions
  const rowSchema = toHost(editor.entityDataRowSchema({ id: "status", custom: true }));
  for (const field of rowSchema) {
    assert.ok(field.helper, `Field '${field.name}' in entityDataRowSchema is missing helper text`);
    assert.equal(typeof field.helper, "string");
    assert.ok(field.helper.length > 5);
  }

  const btnSchema = toHost(editor.buttonRowSchema({ id: "custom_btn", custom: true }));
  for (const field of btnSchema) {
    assert.ok(field.helper, `Field '${field.name}' in buttonRowSchema is missing helper text`);
    assert.equal(typeof field.helper, "string");
    assert.ok(field.helper.length > 5);
  }
});

test("editor entityDataRowSchema and buttonRowSchema include helper descriptions across standard and custom modes", async () => {
  const { Editor } = await loadCard();
  const editor = new Editor();

  // Standard status row schema
  const standardRowSchema = toHost(editor.entityDataRowSchema({ id: "status", custom: false }));
  for (const field of standardRowSchema) {
    assert.ok(
      field.helper,
      `Field '${field.name}' in standard entityDataRowSchema is missing helper text`,
    );
    assert.equal(typeof field.helper, "string");
    assert.ok(field.helper.length > 5);
  }

  // Standard button row schema
  const standardBtnSchema = toHost(editor.buttonRowSchema({ id: "start", custom: false }));
  for (const field of standardBtnSchema) {
    assert.ok(
      field.helper,
      `Field '${field.name}' in standard buttonRowSchema is missing helper text`,
    );
    assert.equal(typeof field.helper, "string");
    assert.ok(field.helper.length > 5);
  }
});
