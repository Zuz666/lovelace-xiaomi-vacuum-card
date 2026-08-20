import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FIXTURES_DIR = path.resolve(__dirname, "scenarios");
export const CURRENT_SCHEMA_VERSION = 1;
export const SUPPORTED_SCHEMA_VERSIONS = [1];

const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /access_token/i,
  /api_key/i,
  /bearer\s+[a-z0-9_.-]+/i,
  /\b192\.168\.\d{1,3}\.\d{1,3}\b/,
  /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
  /\b172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b/,
];

export function validateFixture(fixture, sourceName = "fixture") {
  if (!fixture || typeof fixture !== "object" || Array.isArray(fixture)) {
    throw new Error(`[fixtures] ${sourceName}: Fixture must be an object.`);
  }

  // 1. Validate schema_version
  if (!("schema_version" in fixture)) {
    throw new Error(
      `[fixtures] ${sourceName}: Missing required field 'schema_version'. Supported versions: ${SUPPORTED_SCHEMA_VERSIONS.join(", ")}.`,
    );
  }

  const version = fixture.schema_version;
  if (!Number.isInteger(version) || version <= 0) {
    throw new Error(
      `[fixtures] ${sourceName}: Invalid 'schema_version' ${JSON.stringify(version)}. Must be a positive integer.`,
    );
  }

  if (!SUPPORTED_SCHEMA_VERSIONS.includes(version)) {
    throw new Error(
      `[fixtures] ${sourceName}: Unsupported schema version ${version}. Supported versions: ${SUPPORTED_SCHEMA_VERSIONS.join(", ")}.`,
    );
  }

  // 2. Validate metadata fields
  if (typeof fixture.id !== "string" || !/^[a-z0-9-]+$/.test(fixture.id)) {
    throw new Error(
      `[fixtures] ${sourceName}: 'id' must be a valid kebab-case string (e.g. 'modern-separated-battery').`,
    );
  }

  const validKinds = ["synthetic", "verified_integration", "verified_model"];
  if (!validKinds.includes(fixture.kind)) {
    throw new Error(
      `[fixtures] ${sourceName}: 'kind' must be one of ${validKinds.join(", ")}, got '${fixture.kind}'.`,
    );
  }

  if (typeof fixture.description !== "string" || fixture.description.length < 5) {
    throw new Error(
      `[fixtures] ${sourceName}: 'description' must be a descriptive string of at least 5 characters.`,
    );
  }

  if (
    typeof fixture.vacuum_entity_id !== "string" ||
    !fixture.vacuum_entity_id.startsWith("vacuum.")
  ) {
    throw new Error(
      `[fixtures] ${sourceName}: 'vacuum_entity_id' must be a valid vacuum entity ID starting with 'vacuum.'.`,
    );
  }

  // 3. Validate states map
  if (!fixture.states || typeof fixture.states !== "object" || Array.isArray(fixture.states)) {
    throw new Error(`[fixtures] ${sourceName}: 'states' must be an object map of entity states.`);
  }

  if (!(fixture.vacuum_entity_id in fixture.states)) {
    throw new Error(
      `[fixtures] ${sourceName}: 'states' must contain the primary vacuum entity '${fixture.vacuum_entity_id}'.`,
    );
  }

  const vacuumState = fixture.states[fixture.vacuum_entity_id];
  if (!vacuumState || typeof vacuumState.state !== "string") {
    throw new Error(
      `[fixtures] ${sourceName}: Primary vacuum entity '${fixture.vacuum_entity_id}' must have a valid string 'state'.`,
    );
  }

  // 4. Privacy and sanitization validation
  const serialized = JSON.stringify(fixture);
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(serialized)) {
      throw new Error(
        `[fixtures] ${sourceName}: Sanitization error: fixture contains potentially sensitive or private data matching ${pattern}.`,
      );
    }
  }

  return fixture;
}

export function loadFixture(nameOrPath) {
  let filePath = nameOrPath;
  if (!filePath.endsWith(".json")) {
    filePath = path.join(FIXTURES_DIR, `${nameOrPath}.json`);
  } else if (!path.isAbsolute(filePath)) {
    filePath = path.resolve(FIXTURES_DIR, filePath);
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`[fixtures] Fixture file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`[fixtures] Malformed JSON in fixture file ${filePath}: ${err.message}`, {
      cause: err,
    });
  }
  return validateFixture(parsed, path.basename(filePath));
}

export function loadAllFixtures() {
  if (!fs.existsSync(FIXTURES_DIR)) return [];
  const files = fs.readdirSync(FIXTURES_DIR).filter((f) => f.endsWith(".json"));
  return files.map((file) => loadFixture(path.join(FIXTURES_DIR, file)));
}

export function fixtureToHass(fixture) {
  const validated = typeof fixture === "string" ? loadFixture(fixture) : validateFixture(fixture);
  return {
    states: validated.states || {},
    entities: validated.entities || null,
    devices: validated.devices || null,
  };
}
