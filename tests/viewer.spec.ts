import fs from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("renders the static accessibility report viewer", async ({ page }) => {
  const css = await fs.readFile("css/axe-aggregate-reporter.css", "utf-8");
  const icons = (await fs.readFile("js/lucide-icons.js", "utf-8")).replace(
    "export const createIcon",
    "const createIcon",
  );
  const reporter = (
    await fs.readFile("js/axe-aggregate-reporter.js", "utf-8")
  ).replace('import { createIcon } from "./lucide-icons.js";\n\n', "");
  const report = await fs.readFile(
    "tests/fixtures/sample-report.json",
    "utf-8",
  );

  await page.route("https://report.test/full-report.json", async (route) => {
    await route.fulfill({
      body: report,
      contentType: "application/json",
    });
  });
  await page.setContent(`
    <!doctype html>
    <html lang="en">
      <head>
        <title>Report viewer</title>
        <style>${css}</style>
      </head>
      <body>
        <axe-aggregate-reporter src="https://report.test/full-report.json"></axe-aggregate-reporter>
        <script type="module">${icons}${reporter}</script>
      </body>
    </html>
  `);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Accessibility report",
  );
  await expect(
    page.locator(".metric span").filter({ hasText: /^Tests$/ }),
  ).toBeVisible();
  await expect(
    page.locator(".metric span").filter({ hasText: /^Failed checks$/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Sample failing page" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "button-name" }),
  ).toBeVisible();
  await expect(page.locator("details.impact-disclosure[open]")).toHaveCount(1);
  await expect(page.locator("details.node-disclosure")).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Deque guidance/ })).toBeVisible();
});

test("loads a report URL from the page query string", async ({ page }) => {
  const css = await fs.readFile("css/axe-aggregate-reporter.css", "utf-8");
  const icons = (await fs.readFile("js/lucide-icons.js", "utf-8")).replace(
    "export const createIcon",
    "const createIcon",
  );
  const reporter = (
    await fs.readFile("js/axe-aggregate-reporter.js", "utf-8")
  ).replace('import { createIcon } from "./lucide-icons.js";\n\n', "");
  const report = await fs.readFile(
    "tests/fixtures/sample-report.json",
    "utf-8",
  );

  await page.route("https://reports.test/project/full-report.json", async (route) => {
    await route.fulfill({
      body: report,
      contentType: "application/json",
    });
  });
  await page.route("https://viewer.test/**", async (route) => {
    await route.fulfill({
      body: `
    <!doctype html>
    <html lang="en">
      <head>
        <title>Report viewer</title>
        <style>${css}</style>
      </head>
      <body>
        <axe-aggregate-reporter></axe-aggregate-reporter>
        <script type="module">${icons}${reporter}</script>
      </body>
    </html>
  `,
      contentType: "text/html",
    });
  });
  await page.goto(
    "https://viewer.test/?src=https%3A%2F%2Freports.test%2Fproject%2Ffull-report.json",
  );

  await expect(
    page.getByRole("heading", { name: "Sample failing page" }),
  ).toBeVisible();
});

test("renders embedded report JSON from an inert script", async ({ page }) => {
  const css = await fs.readFile("css/axe-aggregate-reporter.css", "utf-8");
  const icons = (await fs.readFile("js/lucide-icons.js", "utf-8")).replace(
    "export const createIcon",
    "const createIcon",
  );
  const reporter = (
    await fs.readFile("js/axe-aggregate-reporter.js", "utf-8")
  ).replace('import { createIcon } from "./lucide-icons.js";\n\n', "");
  const report = await fs.readFile(
    "tests/fixtures/sample-report.json",
    "utf-8",
  );

  await page.setContent(`
    <!doctype html>
    <html lang="en">
      <head>
        <title>Report viewer</title>
        <style>${css}</style>
      </head>
      <body>
        <axe-aggregate-reporter data-script="report-data"></axe-aggregate-reporter>
        <script id="report-data" type="application/json">${report}</script>
        <script type="module">${icons}${reporter}</script>
      </body>
    </html>
  `);

  await expect(
    page.getByRole("heading", { name: "Sample failing page" }),
  ).toBeVisible();
});

test("treats embedded report JSON as authoritative when it is invalid", async ({ page }) => {
  const css = await fs.readFile("css/axe-aggregate-reporter.css", "utf-8");
  const icons = (await fs.readFile("js/lucide-icons.js", "utf-8")).replace(
    "export const createIcon",
    "const createIcon",
  );
  const reporter = (
    await fs.readFile("js/axe-aggregate-reporter.js", "utf-8")
  ).replace('import { createIcon } from "./lucide-icons.js";\n\n', "");

  await page.setContent(`
    <!doctype html>
    <html lang="en">
      <head>
        <title>Report viewer</title>
        <style>${css}</style>
      </head>
      <body>
        <axe-aggregate-reporter
          data-script="report-data"
          src="missing.json"
        ></axe-aggregate-reporter>
        <script id="report-data" type="application/json">false</script>
        <script type="module">${icons}${reporter}</script>
      </body>
    </html>
  `);

  await expect(
    page.getByText(
      "Unable to load report. The report must be a top-level array.",
    ),
  ).toBeVisible();
});
