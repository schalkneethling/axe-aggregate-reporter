import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      ...configDefaults.exclude,
      "**/*.spec.ts",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/tests/**/*.spec.ts",
    ],
  },
});
