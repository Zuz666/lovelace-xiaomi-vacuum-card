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
      type: "media_source/resolve_media",
      media_content_id: mediaContentId,
    },
  ]);
});
