import { expect, test } from "vitest";
import { formatResult } from "../../src/result-formatter.ts";

import rawResult from "./raw-result.json" with { type: "json" };

test("formats a result", () => {
  const result = formatResult(rawResult);

  expect(result).toMatchObject({
    id: "aria-allowed-attr",
    impact: "unknown",
    description: "Ensure an element's role supports its ARIA attributes",
    help: "Elements must only use supported ARIA attributes",
    totalNodes: rawResult.nodes.length,
  });
  expect(result.nodes[0]).toEqual({
    html: '<a class="Header-logoLink" href="/" aria-label="Dole logo">',
    target: [".Header-logoLink"],
    checks: [
      {
        id: "aria-allowed-attr",
        impact: "critical",
        message: "ARIA attributes are used correctly for the defined role",
      },
      {
        id: "aria-unsupported-attr",
        impact: "critical",
        message: "ARIA attribute is supported",
      },
    ],
  });
});
