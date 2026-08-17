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
      ".local/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["dist/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ["tests/**/*.mjs", "*.config.mjs", "eslint.config.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["dist/**/*.js", "tests/**/*.mjs", "*.config.mjs", "eslint.config.mjs"],
    rules: {
      "no-console": "off",
      "no-empty": "off",
      "no-unused-vars": "off",
    },
  },
];
