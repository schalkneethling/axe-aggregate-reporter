import { expect, test } from "vitest";
import { formatNodesForResult } from "../../src/result-node-formatter.ts";

test("formats a simple result node", () => {
  const rawResult = [
    {
      any: [],
      all: [
        {
          id: "aria-allowed-attr",
          data: null,
          relatedNodes: [],
          impact: "critical",
          message: "ARIA attributes are used correctly for the defined role",
        },
      ],
      none: [
        {
          id: "aria-unsupported-attr",
          data: null,
          relatedNodes: [],
          impact: "critical",
          message: "ARIA attribute is supported",
        },
      ],
      impact: null,
      html: '<a class="Header-logoLink" href="/" aria-label="Dole logo">',
      target: [".Header-logoLink"],
    },
  ];
  const expectedResult = [
    {
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
    },
  ];

  const formattedResult = formatNodesForResult(rawResult);

  expect(formattedResult).toEqual(expectedResult);
});
