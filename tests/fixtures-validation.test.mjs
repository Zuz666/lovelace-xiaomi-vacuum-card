import assert from "node:assert/strict";
import test from "node:test";

import {
  loadFixture,
  loadAllFixtures,
  validateFixture,
  fixtureToHass,
  CURRENT_SCHEMA_VERSION,
  SUPPORTED_SCHEMA_VERSIONS,
} from "./fixtures/loader.mjs";
import { createHass, loadCard, toHost } from "./helpers/card-harness.mjs";

test("fixtures: all committed scenario fixtures validate cleanly", () => {
  const fixtures = loadAllFixtures();
  assert.ok(fixtures.length >= 5, `Expected at least 5 fixtures, found ${fixtures.length}`);

  const ids = new Set();
  for (const fixture of fixtures) {
    assert.equal(fixture.schema_version, CURRENT_SCHEMA_VERSION);
    assert.ok(fixture.id);
    assert.ok(!ids.has(fixture.id), `Duplicate fixture ID: ${fixture.id}`);
    ids.add(fixture.id);
  }
});

test("fixtures: rejects missing, non-integer, zero, negative, or unsupported schema_version", () => {
  assert.throws(
    () => validateFixture({ id: "missing-version", kind: "synthetic" }),
    /Missing required field 'schema_version'/,
  );

  assert.throws(
    () => validateFixture({ schema_version: "1", id: "string-version" }),
    /Invalid 'schema_version'/,
  );

  assert.throws(
    () => validateFixture({ schema_version: 0, id: "zero-version" }),
    /Invalid 'schema_version'/,
  );

  assert.throws(
    () => validateFixture({ schema_version: -1, id: "neg-version" }),
    /Invalid 'schema_version'/,
  );

  assert.throws(
    () => validateFixture({ schema_version: 999, id: "future-version" }),
    /Unsupported schema version 999/,
  );
});

test("fixtures: validates required metadata fields and primary vacuum entity in states", () => {
  assert.throws(
    () =>
      validateFixture({
        schema_version: 1,
        id: "INVALID ID",
        kind: "synthetic",
      }),
    /'id' must be a valid kebab-case string/,
  );

  assert.throws(
    () =>
      validateFixture({
        schema_version: 1,
        id: "valid-id",
        kind: "unknown-kind",
      }),
    /'kind' must be one of/,
  );

  assert.throws(
    () =>
      validateFixture({
        schema_version: 1,
        id: "valid-id",
        kind: "synthetic",
        description: "valid",
        vacuum_entity_id: "sensor.not_a_vacuum",
      }),
    /'vacuum_entity_id' must be a valid vacuum entity ID/,
  );

  assert.throws(
    () =>
      validateFixture({
        schema_version: 1,
        id: "valid-id",
        kind: "synthetic",
        description: "valid",
        vacuum_entity_id: "vacuum.test",
        states: {},
      }),
    /'states' must contain the primary vacuum entity/,
  );
});

test("fixtures: rejects sensitive data, credentials, and private IPs", () => {
  const createFixtureWithState = (attrKey, attrVal) => ({
    schema_version: 1,
    id: "privacy-test",
    kind: "synthetic",
    description: "Testing privacy validation",
    vacuum_entity_id: "vacuum.privacy_cleaner",
    states: {
      "vacuum.privacy_cleaner": {
        entity_id: "vacuum.privacy_cleaner",
        state: "docked",
        attributes: {
          [attrKey]: attrVal,
        },
      },
    },
  });

  assert.throws(
    () => validateFixture(createFixtureWithState("auth_token", "secret_token_12345")),
    /Sanitization error/,
  );

  assert.throws(
    () => validateFixture(createFixtureWithState("ip_address", "192.168.1.55")),
    /Sanitization error/,
  );
});

test("node contract: modern separated battery fixture resolves battery sensor and action evaluations", async () => {
  const { Card } = await loadCard();
  const card = new Card();
  const fixture = loadFixture("modern-separated-battery");
  const hass = createHass(fixtureToHass(fixture));

  card.setConfig({
    type: "custom:xiaomi-vacuum-card",
    entity: fixture.vacuum_entity_id,
  });
  card.hass = hass;

  // Expected actions
  if (fixture.expected && fixture.expected.actions) {
    for (const [actionId, expectedState] of Object.entries(fixture.expected.actions)) {
      const btnConfig = card.config.buttons[actionId];
      assert.ok(btnConfig, `Button '${actionId}' missing from card configuration`);
      const evaluated = card.evaluateButton(btnConfig);
      assert.equal(
        evaluated.visible,
        expectedState.visible,
        `Action '${actionId}' visible mismatch`,
      );
      assert.equal(
        evaluated.disabled,
        expectedState.disabled,
        `Action '${actionId}' disabled mismatch`,
      );
    }
  }
});

test("node contract: same-device discovered battery fixture resolves renamed battery sensor", async () => {
  const { Card } = await loadCard();
  const card = new Card();
  const fixture = loadFixture("same-device-discovered-battery");
  const hass = createHass(fixtureToHass(fixture));

  card.setConfig({
    type: "custom:xiaomi-vacuum-card",
    entity: fixture.vacuum_entity_id,
  });
  card.hass = hass;

  const batteryRow = Object.assign({ id: "battery" }, card.config.state.battery);
  const resolved = card.resolveAttributeSource(batteryRow);
  assert.equal(resolved.rawValue, "94");
});
