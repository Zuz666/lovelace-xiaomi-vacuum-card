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

test("buttons_mode: defaults to adaptive and supports compact and always_active", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  card.setConfig({ entity: "vacuum.xiaomi" });
  assert.equal(card.config.buttons_mode, "adaptive");
  assert.equal(card.config.buttons_state_aware, true);

  card.setConfig({ entity: "vacuum.xiaomi", buttons_mode: "compact" });
  assert.equal(card.config.buttons_mode, "compact");
  assert.equal(card.config.buttons_state_aware, true);

  card.setConfig({ entity: "vacuum.xiaomi", buttons_mode: "always_active" });
  assert.equal(card.config.buttons_mode, "always_active");
  assert.equal(card.config.buttons_state_aware, false);

  // Backward compatibility with buttons_state_aware: false
  card.setConfig({ entity: "vacuum.xiaomi", buttons_state_aware: false });
  assert.equal(card.config.buttons_mode, "always_active");
  assert.equal(card.config.buttons_state_aware, false);
});

test("scrim: defaults to auto and evaluates correctly with or without image", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  // Without image, auto scrim is inactive
  card.setConfig({ entity: "vacuum.xiaomi" });
  assert.equal(card.config.scrim, "auto");
  assert.equal(card.isScrimActive(), false);

  // With image, auto scrim is active
  card.setConfig({ entity: "vacuum.xiaomi", image: "/local/vacuum.png" });
  assert.equal(card.config.scrim, "auto");
  assert.equal(card.isScrimActive(), true);

  // Explicit scrim: true forces scrim even without image
  card.setConfig({ entity: "vacuum.xiaomi", scrim: true });
  assert.equal(card.config.scrim, "true");
  assert.equal(card.isScrimActive(), true);

  // Explicit scrim: false disables scrim even with image
  card.setConfig({ entity: "vacuum.xiaomi", image: "/local/vacuum.png", scrim: false });
  assert.equal(card.config.scrim, "false");
  assert.equal(card.isScrimActive(), false);

  // If buttons are hidden, scrim is not active
  card.setConfig({ entity: "vacuum.xiaomi", image: "/local/vacuum.png", buttons: false });
  assert.equal(card.isScrimActive(), false);

  // Unsafe image URL does not activate auto scrim
  card.setConfig({ entity: "vacuum.xiaomi", image: "javascript:alert(1)" });
  assert.equal(card.hasImage(), false);
  assert.equal(card.isScrimActive(), false);
});

test("scrim: true without image sets icon style to white for contrast", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  card.setConfig({ entity: "vacuum.xiaomi", scrim: true });
  assert.equal(card.config.styles.icon, "color: white;");

  card.setConfig({ entity: "vacuum.xiaomi", scrim: false });
  assert.match(card.config.styles.icon, /--state-icon-color/);
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

test("buttons_disabled_opacity: remains undefined when not specified or invalid (falling back to CSS default 0.38)", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  card.setConfig({ entity: "vacuum.xiaomi" });
  assert.equal(card.config.buttons_disabled_opacity, undefined);
  assert.doesNotMatch(card.config.styles.background, /--xvc-disabled-opacity:/);

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

test("buttons_disabled_opacity: falls back to legacy disabled_opacity when buttons_disabled_opacity is invalid", async () => {
  const { Card } = await loadCard();
  const card = new Card();

  card.setConfig({
    entity: "vacuum.xiaomi",
    buttons_disabled_opacity: "invalid",
    disabled_opacity: 0.7,
  });
  assert.equal(card.config.buttons_disabled_opacity, 0.7);
  assert.match(card.config.styles.background, /--xvc-disabled-opacity:\s*0\.7;/);
});
