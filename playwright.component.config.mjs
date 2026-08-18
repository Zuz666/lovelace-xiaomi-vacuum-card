import { defineConfig } from "@playwright/test";

const defaultPort = process.env.COMPONENT_SERVER_PORT || "5178";
const baseURL = process.env.COMPONENT_BASE_URL || `http://127.0.0.1:${defaultPort}`;

export default defineConfig({
  testDir: "./tests/component",
  testMatch: "**/*.spec.mjs",
  timeout: 15_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL,
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node tests/component/helpers/server.mjs",
    url: `${baseURL}/ready`,
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  },
});
