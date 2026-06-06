import assert from "node:assert/strict";
import test from "node:test";

import { loadCard } from "./helpers/card-harness.mjs";

test("setConfig requires a vacuum entity", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  assert.throws(() => card.setConfig({}), /Please define an entity/);
  assert.throws(() => card.setConfig({ entity: "sensor.vacuum" }), /Please define a vacuum entity/);
});

test("setConfig rejects unknown vendors", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  assert.throws(
    () => card.setConfig({ entity: "vacuum.xiaomi", vendor: "unknown" }),
    /Please define a valid vendor/,
  );
});

test("setConfig accepts media selector image objects and stores media_content_id", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  card.setConfig({
    entity: "vacuum.xiaomi",
    image: { media_content_id: "media-source://media_source/local/vacuum.png" },
  });

  assert.equal(card.config.image, "media-source://media_source/local/vacuum.png");
});

test("unsafe image URLs are not used in background styles", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  card.setConfig({ entity: "vacuum.xiaomi", image: "javascript:alert(1)" });

  assert.equal(card.config.styles.background, "");
});

test("safe /local image URLs are used in background styles", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  card.setConfig({ entity: "vacuum.xiaomi", image: "/local/vacuum.png" });

  assert.match(card.config.styles.background, /background-image: url\("\/local\/vacuum\.png"\)/);
});
