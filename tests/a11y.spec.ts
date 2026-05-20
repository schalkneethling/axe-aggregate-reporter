import fs from "node:fs/promises";
import path from "node:path";

import { test, expect } from "./fixtures/axe-test-fixture.js";
import { formatFullReport } from "../src/full-report-formatter.ts";

import urls from "./urls.json" with { type: "json" };

type TestUrl = {
  title: string;
  url: string;
};

for (const url of urls as TestUrl[]) {
  test(`${url.title}`, async ({ page, makeAxeBuilder }, testInfo) => {
    const fixtureUrl = new URL(url.url, `file://${path.resolve(".")}/`);

    await page.goto(fixtureUrl.href, { waitUntil: "domcontentloaded" });

    const axeBuilder = makeAxeBuilder();
    const results = await axeBuilder.analyze();

    if (results.violations.length || results.passes.length) {
      const file = testInfo.outputPath("axe.json");
      await fs.writeFile(
        file,
        JSON.stringify(formatFullReport(results), null, 2),
      );
      await fs.writeFile(
        testInfo.outputPath("axe-raw.json"),
        JSON.stringify(results, null, 2),
      );

      await testInfo.attach("axe.json", {
        path: file,
        contentType: "application/json",
      });
    }

    expect(results.violations).toEqual([]);
  });
}
