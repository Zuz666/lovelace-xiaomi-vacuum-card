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
    files: ["src/**/*.js", "dist/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ["scripts/**/*.mjs", "tests/**/*.mjs", "*.config.mjs", "eslint.config.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  {
    files: [
      "src/**/*.js",
      "dist/**/*.js",
      "scripts/**/*.mjs",
      "tests/**/*.mjs",
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
