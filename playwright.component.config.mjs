import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/component",
  testMatch: "**/*.spec.mjs",
  timeout: 15_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: process.env.COMPONENT_BASE_URL || "http://127.0.0.1:5178",
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node tests/component/helpers/server.mjs",
    url: `${process.env.COMPONENT_BASE_URL || "http://127.0.0.1:5178"}/ready`,
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  },
});
