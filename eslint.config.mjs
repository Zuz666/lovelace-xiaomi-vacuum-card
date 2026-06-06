import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      ".ha-smoke/**",
      "docs/**",
      "tmp/**",
      "session-*.md",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: [
      "dist/**/*.js",
      "tests/**/*.js",
      "tests/**/*.mjs",
      "*.config.js",
      "*.config.mjs",
      "eslint.config.mjs",
    ],
    rules: {
      "no-console": "off",
      "no-empty": "off",
      "no-unused-vars": "off",
    },
  },
];
