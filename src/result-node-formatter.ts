import type { CheckResult, NodeResult } from "axe-core";
import type { FormattedCheck, FormattedNodeResult, Impact } from "./types.js";

const getImpact = (impact: CheckResult["impact"] | NodeResult["impact"]) => {
  return impact ?? "unknown";
};

const formatChecks = (checks: CheckResult[]): FormattedCheck[] => {
  return checks.map((check: CheckResult) => {
    return {
      id: check.id,
      impact: getImpact(check.impact) as Impact,
      message: check.message,
    };
  });
};

const formatTarget = (target: NodeResult["target"]): string[] => {
  return target.map((item) => {
    return Array.isArray(item) ? item.join(" ") : String(item);
  });
};

export const formatNodesForResult = (
  nodes: NodeResult[],
): FormattedNodeResult[] => {
  return nodes.map((node) => {
    const checks = formatChecks([...node.any, ...node.all, ...node.none]);

    return {
      html: node.html,
      target: formatTarget(node.target),
      checks,
    };
  });
};
