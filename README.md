# @schalkneethling/axe-aggregate-reporter

`@schalkneethling/axe-aggregate-reporter` turns Playwright axe accessibility test output into one shareable report artifact. It pairs a Playwright reporter, which writes a stable aggregate JSON file, with a dependency-free custom element viewer, which renders the report as a focused accessibility findings ledger.

Reach for this when you already use Playwright with `@axe-core/playwright`, but raw JSON attachments and failing test logs are too awkward for team review. The beta is aimed at developers, QA engineers, and accessibility-minded teams who want to scan multiple tested pages, inspect failed and passed checks, identify affected nodes, and jump to remediation guidance without writing custom reporting glue.

## What the beta includes

- A Playwright reporter exported from `@schalkneethling/axe-aggregate-reporter/reporter`.
- Formatter utilities for converting axe results into the beta schema.
- A static custom element viewer exported as `@schalkneethling/axe-aggregate-reporter/viewer`.
- A CSS file exported as `@schalkneethling/axe-aggregate-reporter/viewer.css`.
- Deterministic local fixture tests for the reporter/viewer path.

## Install

```sh
npm install --save-dev @schalkneethling/axe-aggregate-reporter @axe-core/playwright @playwright/test
```

## Playwright setup

Configure Playwright to use the reporter:

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  reporter: "@schalkneethling/axe-aggregate-reporter/reporter",
});
```

Attach a formatted axe report in each accessibility test:

```ts
import fs from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { formatFullReport } from "@schalkneethling/axe-aggregate-reporter";

test("page is accessible", async ({ page }, testInfo) => {
  await page.goto("https://example.com");

  const results = await new AxeBuilder({ page }).analyze();
  const file = testInfo.outputPath("axe.json");

  await fs.writeFile(file, JSON.stringify(formatFullReport(results), null, 2));
  await testInfo.attach("axe.json", {
    contentType: "application/json",
    path: file,
  });

  expect(results.violations).toEqual([]);
});
```

The reporter writes `full-report.json` in the Playwright root directory.

## Viewer setup

Use the custom element on any static page that can fetch the generated JSON file:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Accessibility report</title>
    <link rel="stylesheet" href="./css/axe-aggregate-reporter.css" />
  </head>
  <body>
    <axe-aggregate-reporter src="./full-report.json"></axe-aggregate-reporter>
    <script type="module" src="./js/axe-aggregate-reporter.js"></script>
  </body>
</html>
```

The viewer supports loading, empty, invalid report, and fetch-error states. It renders a summary, test-level sections, failed and passed checks, impact labels, node targets, check messages, and Deque help links.

## Report schema

The beta report is a top-level array:

```ts
type AggregateReport = Array<{
  testId: string;
  title: string;
  status: "passed" | "failed" | "timedOut" | "skipped" | "interrupted";
  axe: {
    url: string;
    failed: RuleResult[];
    passed: RuleResult[];
  };
}>;
```

Each rule result includes `id`, `impact`, `tags`, `description`, `help`, `helpUrl`, `nodes`, and `totalNodes`.

## Design notes

The beta viewer uses a forensic accessibility ledger direction: dark oxblood chrome, warm severity accents, pale report surfaces, dense readable audit data, and restrained motion. The palette is based on `#3c1518`, `#69140e`, `#a44200`, `#d58936`, and `#f2f3ae`.

All project CSS should use logical properties and values. Keep declarations alphabetically ordered within each rule.

## Scripts

```sh
npm run build:ts
npm run lint:eslint
npm run test:unit -- --run
npm run test:e2e
npm test
npm pack --dry-run
```

## Beta limitations

- Publishing is manual for the first beta.
- The viewer is dependency-free and intentionally static.
- The reporter expects tests to attach a formatted `axe.json` attachment.
- The viewer prioritizes failed checks, but keeps passed checks visible because the formatter preserves them.
