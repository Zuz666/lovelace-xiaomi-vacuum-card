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

test("buttons_state_aware: defaults to true and can be disabled", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  card.setConfig({ entity: "vacuum.xiaomi" });
  assert.equal(card.config.buttons_state_aware, true);

  card.setConfig({ entity: "vacuum.xiaomi", buttons_state_aware: false });
  assert.equal(card.config.buttons_state_aware, false);
});

test("buttons_disabled_opacity: sets custom CSS variable in background style", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  card.setConfig({ entity: "vacuum.xiaomi", buttons_disabled_opacity: 0.75 });
  assert.equal(card.config.buttons_disabled_opacity, 0.75);
  assert.match(card.config.styles.background, /--xvc-disabled-opacity:\s*0\.75;/);

  // Backward compatibility with disabled_opacity
  card.setConfig({ entity: "vacuum.xiaomi", disabled_opacity: 0.8 });
  assert.equal(card.config.buttons_disabled_opacity, 0.8);
  assert.match(card.config.styles.background, /--xvc-disabled-opacity:\s*0\.8;/);
});

test("buttons_disabled_opacity: clamps values between 0 and 1", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  card.setConfig({ entity: "vacuum.xiaomi", buttons_disabled_opacity: 1.5 });
  assert.equal(card.config.buttons_disabled_opacity, 1);
  assert.match(card.config.styles.background, /--xvc-disabled-opacity:\s*1;/);

  card.setConfig({ entity: "vacuum.xiaomi", buttons_disabled_opacity: -0.2 });
  assert.equal(card.config.buttons_disabled_opacity, 0);
  assert.match(card.config.styles.background, /--xvc-disabled-opacity:\s*0;/);
});

test("disabled_opacity: ignores infinite or non-finite values", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  card.setConfig({ entity: "vacuum.xiaomi", disabled_opacity: Infinity });
  assert.equal(card.config.disabled_opacity, undefined);
  assert.doesNotMatch(card.config.styles.background, /--xvc-disabled-opacity:/);

  card.setConfig({ entity: "vacuum.xiaomi", disabled_opacity: -Infinity });
  assert.equal(card.config.disabled_opacity, undefined);
  assert.doesNotMatch(card.config.styles.background, /--xvc-disabled-opacity:/);

  card.setConfig({ entity: "vacuum.xiaomi", disabled_opacity: "Infinity" });
  assert.equal(card.config.disabled_opacity, undefined);
  assert.doesNotMatch(card.config.styles.background, /--xvc-disabled-opacity:/);

  card.setConfig({ entity: "vacuum.xiaomi", disabled_opacity: "-Infinity" });
  assert.equal(card.config.disabled_opacity, undefined);
  assert.doesNotMatch(card.config.styles.background, /--xvc-disabled-opacity:/);
});

test("buttons_disabled_opacity: ignores infinite or non-finite values", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  card.setConfig({ entity: "vacuum.xiaomi", buttons_disabled_opacity: Infinity });
  assert.equal(card.config.buttons_disabled_opacity, undefined);
  assert.doesNotMatch(card.config.styles.background, /--xvc-disabled-opacity:/);

  card.setConfig({ entity: "vacuum.xiaomi", buttons_disabled_opacity: -Infinity });
  assert.equal(card.config.buttons_disabled_opacity, undefined);
  assert.doesNotMatch(card.config.styles.background, /--xvc-disabled-opacity:/);

  card.setConfig({ entity: "vacuum.xiaomi", buttons_disabled_opacity: "Infinity" });
  assert.equal(card.config.buttons_disabled_opacity, undefined);
  assert.doesNotMatch(card.config.styles.background, /--xvc-disabled-opacity:/);

  card.setConfig({ entity: "vacuum.xiaomi", buttons_disabled_opacity: "-Infinity" });
  assert.equal(card.config.buttons_disabled_opacity, undefined);
  assert.doesNotMatch(card.config.styles.background, /--xvc-disabled-opacity:/);
});

test("updateImageStyles preserves buttons_disabled_opacity CSS variable", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  card.setConfig({ entity: "vacuum.xiaomi", buttons_disabled_opacity: 0.6 });
  assert.match(card.config.styles.background, /--xvc-disabled-opacity:\s*0\.6;/);

  card.config.image = "/local/vacuum_new.png";
  card.updateImageStyles();
  assert.match(card.config.styles.background, /--xvc-disabled-opacity:\s*0\.6;/);
  assert.match(
    card.config.styles.background,
    /background-image: url\("\/local\/vacuum_new\.png"\)/,
  );
});
