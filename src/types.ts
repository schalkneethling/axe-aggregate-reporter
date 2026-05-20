import type { TestResult } from "@playwright/test/reporter";

export type Impact = "critical" | "serious" | "moderate" | "minor" | "unknown";

export type FormattedCheck = {
  id: string;
  impact: Impact;
  message: string;
};

export type FormattedNodeResult = {
  html: string;
  target: string[];
  checks: FormattedCheck[];
};

export type FormattedRuleResult = {
  id: string;
  impact: Impact;
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  nodes: FormattedNodeResult[];
  totalNodes: number;
};

export type FormattedAxeReport = {
  url: string;
  failed: FormattedRuleResult[];
  passed: FormattedRuleResult[];
};

export type AggregateReportEntry = {
  testId: string;
  title: string;
  status: TestResult["status"];
  axe: FormattedAxeReport;
};

export type AggregateReport = AggregateReportEntry[];
