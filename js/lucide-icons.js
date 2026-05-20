/**
 * Minimal Lucide icon helper for the static viewer.
 * Icon paths from Lucide v1.16.0 (ISC) — https://lucide.dev
 */

const DEFAULT_ATTRS = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
};

const ICON_NODES = {
  chevronDown: [["path", { d: "m6 9 6 6 6-6" }]],
  circleAlert: [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["line", { x1: "12", x2: "12", y1: "8", y2: "12" }],
    ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16" }],
  ],
  circleCheck: [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "m9 12 2 2 4-4" }],
  ],
  externalLink: [
    ["path", { d: "M15 3h6v6" }],
    ["path", { d: "M10 14 21 3" }],
    ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }],
  ],
  list: [
    ["path", { d: "M3 5h.01" }],
    ["path", { d: "M3 12h.01" }],
    ["path", { d: "M3 19h.01" }],
    ["path", { d: "M8 5h13" }],
    ["path", { d: "M8 12h13" }],
    ["path", { d: "M8 19h13" }],
  ],
};

/**
 * @param {[string, Record<string, string>, ...unknown[]]} node
 * @returns {SVGElement}
 */
const createSVGElement = (node) => {
  const [tag, attrs, children] = node;
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);

  for (const [name, value] of Object.entries(attrs)) {
    element.setAttribute(name, String(value));
  }

  if (Array.isArray(children)) {
    for (const child of children) {
      element.appendChild(createSVGElement(child));
    }
  }

  return element;
};

/**
 * @param {keyof typeof ICON_NODES} name
 * @param {string} [className]
 * @returns {SVGElement}
 */
export const createIcon = (name, className = "icon") => {
  const iconNode = ICON_NODES[name];

  if (!iconNode) {
    throw new Error(`Unknown icon: ${name}`);
  }

  const svg = createSVGElement(["svg", { ...DEFAULT_ATTRS, class: className }, iconNode]);

  svg.setAttribute("aria-hidden", "true");

  return svg;
};
