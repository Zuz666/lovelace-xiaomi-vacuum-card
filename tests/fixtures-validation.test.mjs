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

test("fixtures: rejects sensitive data, credentials, opaque tokens, MAC addresses, and private IPs", () => {
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

  // Opaque tokens and credential keys
  assert.throws(
    () => validateFixture(createFixtureWithState("auth_token", "opaque_value_xyz")),
    /Sanitization error/,
  );
  assert.throws(
    () => validateFixture(createFixtureWithState("api_key", "custom_key_abc")),
    /Sanitization error/,
  );
  assert.throws(
    () => validateFixture(createFixtureWithState("password", "unencrypted_pwd")),
    /Sanitization error/,
  );

  // MAC addresses
  assert.throws(
    () => validateFixture(createFixtureWithState("mac_address", "00:1A:2B:3C:4D:5E")),
    /Sanitization error/,
  );
  assert.throws(
    () => validateFixture(createFixtureWithState("device_mac", "aa-bb-cc-dd-ee-ff")),
    /Sanitization error/,
  );

  // Private IPs
  assert.throws(
    () => validateFixture(createFixtureWithState("ip_address", "192.168.1.55")),
    /Sanitization error/,
  );
  assert.throws(
    () => validateFixture(createFixtureWithState("local_ip", "10.0.0.12")),
    /Sanitization error/,
  );
  assert.throws(
    () => validateFixture(createFixtureWithState("host", "172.20.0.5")),
    /Sanitization error/,
  );
});

test("fixtures: loadFixture rejects filename and fixture ID mismatch", async () => {
  assert.throws(() => loadFixture("nonexistent-fixture-file"), /Fixture file not found/);

  const fs = await import("node:fs");
  const path = await import("node:path");
  const { FIXTURES_DIR } = await import("./fixtures/loader.mjs");
  const tempPath = path.join(FIXTURES_DIR, "temp-mismatch-test.json");

  try {
    fs.writeFileSync(
      tempPath,
      JSON.stringify({
        schema_version: 1,
        id: "differing-id-from-filename",
        kind: "synthetic",
        description: "Testing mismatch between filename and ID",
        vacuum_entity_id: "vacuum.mismatch_test",
        states: {
          "vacuum.mismatch_test": {
            entity_id: "vacuum.mismatch_test",
            state: "docked",
          },
        },
      }),
    );

    assert.throws(
      () => loadFixture("temp-mismatch-test"),
      /Fixture ID 'differing-id-from-filename' does not match expected filename ID 'temp-mismatch-test'/,
    );
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
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
