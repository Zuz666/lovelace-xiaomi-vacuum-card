import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/ha-smoke",
  timeout: 120_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: process.env.HA_BASE_URL || "http://127.0.0.1:8123",
    browserName: "chromium",
    trace: "retain-on-failure",
  },
});
