import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { expect, test } from "vitest";

const execFileAsync = promisify(execFile);

test("writes a standalone viewer with embedded report JSON", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "axe-viewer-"));
  const reportPath = path.join(tempDir, "full-report.json");
  const outputPath = path.join(tempDir, "report.html");
  const report = [
    {
      testId: "embedded-script",
      title: "Embedded script escaping",
      status: "failed",
      axe: {
        url: "https://example.com",
        failed: [
          {
            id: "script-data",
            impact: "serious",
            tags: ["wcag2a"],
            description: "Avoid closing script tags in embedded JSON",
            help: "Embedded JSON remains inert",
            helpUrl: "https://dequeuniversity.com/",
            nodes: [
              {
                html: "</SCRIPT><p>Still JSON</p>",
                target: ["body"],
                checks: [
                  {
                    id: "script-data",
                    impact: "serious",
                    message: "The JSON string must not close the script tag",
                  },
                ],
              },
            ],
            totalNodes: 1,
          },
        ],
        passed: [],
      },
    },
  ];

  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  await execFileAsync("node", [
    "./bin/axe-aggregate-viewer.js",
    reportPath,
    "--standalone",
    outputPath,
  ]);

  const html = await fs.readFile(outputPath, "utf-8");

  expect(html).toContain(
    '<axe-aggregate-reporter data-script="axe-aggregate-report-data"></axe-aggregate-reporter>',
  );
  expect(html).toContain('type="application/json"');
  expect(html).toContain("<\\/script><p>Still JSON</p>");
  expect(html).toContain("customElements.define");
  expect(html).toContain("const createIcon");
  expect(html).not.toContain('import { createIcon } from "./lucide-icons.js";');
  expect(html).not.toContain("export const createIcon");
});

test("writes standalone viewer to the reports directory by default", async () => {
  const reportPath = path.resolve("tests/fixtures/sample-report.json");
  const outputPath = path.resolve("reports/axe-aggregate-report.html");

  await fs.rm(outputPath, { force: true });
  await execFileAsync("node", [
    "./bin/axe-aggregate-viewer.js",
    reportPath,
    "--standalone",
  ]);

  const html = await fs.readFile(outputPath, "utf-8");

  expect(html).toContain(
    '<axe-aggregate-reporter data-script="axe-aggregate-report-data"></axe-aggregate-reporter>',
  );
});
