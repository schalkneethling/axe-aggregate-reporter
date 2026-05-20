import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  FullConfig,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import { expect, test } from "vitest";
import AxeAggregateReporter from "../../src/reporter.ts";

test("writes aggregate rows from axe attachments", async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "axe-report-"));
  const attachmentPath = path.join(rootDir, "axe.json");
  const reporter = new AxeAggregateReporter();
  const axe = {
    url: "https://example.com",
    failed: [],
    passed: [],
  };

  await fs.writeFile(attachmentPath, JSON.stringify(axe));
  reporter.onBegin?.(
    {
      configFile: path.join(rootDir, "playwright.config.ts"),
      rootDir,
    } as FullConfig,
    { allTests: () => [{}] } as Suite,
  );
  await reporter.onTestEnd?.(
    {
      id: "test-id",
      title: "Example page",
    } as TestCase,
    {
      attachments: [
        {
          contentType: "application/json",
          name: "axe.json",
          path: attachmentPath,
        },
      ],
      status: "passed",
    } as TestResult,
  );
  await reporter.onEnd?.();

  const output = JSON.parse(
    await fs.readFile(path.join(rootDir, "full-report.json"), "utf-8"),
  );

  expect(output).toEqual([
    {
      testId: "test-id",
      title: "Example page",
      status: "passed",
      axe,
    },
  ]);
});
