import type { AxeResults } from "axe-core";
import { formatResult } from "./result-formatter.js";
import type { FormattedAxeReport } from "./types.js";

export const formatFullReport = (result: AxeResults): FormattedAxeReport => {
  return {
    url: result.url,
    failed: result.violations.map((check) => formatResult(check)),
    passed: result.passes.map((check) => formatResult(check)),
  };
};
