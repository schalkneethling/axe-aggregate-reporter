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
