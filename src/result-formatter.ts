import type { Result } from "axe-core";
import { formatNodesForResult } from "./result-node-formatter.js";
import type { FormattedRuleResult, Impact } from "./types.js";

const getImpact = (impact: Result["impact"]) => {
  return impact ?? "unknown";
};

export const formatResult = (result: Result): FormattedRuleResult => {
  return {
    id: result.id,
    impact: getImpact(result.impact) as Impact,
    tags: result.tags,
    description: result.description,
    help: result.help,
    helpUrl: result.helpUrl,
    nodes: formatNodesForResult(result.nodes),
    totalNodes: result.nodes.length,
  };
};
