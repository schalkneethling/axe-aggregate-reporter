import type {
  FullConfig,
  Reporter,
  Suite,
  TestCase,
  TestError,
  TestResult,
} from "@playwright/test/reporter";
import fs from "node:fs/promises";
import path from "node:path";
import type { AggregateReport, FormattedAxeReport } from "./types.js";

const attachmentName = "axe.json";

class AxeAggregateReporter implements Reporter {
  private outputDir = "";
  private rows: AggregateReport = [];

  onBegin(config: FullConfig, suite: Suite) {
    this.outputDir = config.configFile
      ? path.dirname(config.configFile)
      : config.rootDir;
    console.info(
      `Running ${suite.allTests().length} accessibility tests and aggregating results...`,
    );
  }

  onError(error: TestError) {
    console.error(error);
  }

  async onEnd() {
    const outputFile = path.join(this.outputDir, "full-report.json");
    await fs.writeFile(outputFile, JSON.stringify(this.rows, null, 2));
    console.info(`Wrote full report to ${outputFile}`);
  }

  async onTestEnd(test: TestCase, result: TestResult) {
    const attachment = result.attachments.find((item) => {
      return item.name === attachmentName && item.path;
    });

    if (!attachment?.path) {
      return;
    }

    let axe: FormattedAxeReport;

    try {
      const raw = await fs.readFile(attachment.path, "utf-8");
      axe = JSON.parse(raw) as FormattedAxeReport;
    } catch (error) {
      throw new Error(
        `Failed to load or parse ${attachmentName} attachment for test "${test.title}"`,
        { cause: error },
      );
    }

    this.rows.push({
      testId: test.id,
      title: test.title,
      status: result.status,
      axe,
    });
  }
}

export default AxeAggregateReporter;
