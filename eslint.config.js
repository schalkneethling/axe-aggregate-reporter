import js from "@eslint/js";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";
import html from "@html-eslint/eslint-plugin";
import css from "@eslint/css";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  {
    ...js.configs.recommended,
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
  },
  {
    ...html.configs["flat/recommended"],
    files: ["**/*.html"],
    rules: {
      "@html-eslint/indent": "off",
      "@html-eslint/use-baseline": "warn",
    },
  },
  {
    files: ["**/*.css"],
    language: "css/css",
    plugins: { css },
    rules: {
      ...css.configs.recommended.rules,
      "css/prefer-logical-properties": "error",
      "css/relative-font-units": "off",
      "css/use-baseline": "off",
    },
  },
  {
    files: ["css/axe-aggregate-reporter.css"],
    rules: {
      "css/no-invalid-properties": "off",
    },
  },
  {
    ...eslintConfigPrettier,
    files: ["**/*.js", "**/*.mjs", "**/*.cjs", "**/*.html", "**/*.css"],
  },
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.nodeBuiltin,
      },
    },
    rules: {
      "no-console": ["error", { allow: ["clear", "error", "info"] }],
    },
  },
];
