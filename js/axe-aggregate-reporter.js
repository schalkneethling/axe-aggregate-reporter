import { createIcon } from "./lucide-icons.js";

const impactOrder = ["critical", "serious", "moderate", "minor", "unknown"];

const impactLabels = {
  critical: "Critical",
  serious: "Serious",
  moderate: "Moderate",
  minor: "Minor",
  unknown: "Unknown impact",
};

const defaultReportSrc = "./full-report.json";

class AxeAggregateReporter extends HTMLElement {
  static observedAttributes = ["data-script", "src"];

  #filters = {
    impact: "all",
    search: "",
    status: "all",
  };
  #report = [];

  connectedCallback() {
    void this.#loadReport();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (
      (name === "data-script" || name === "src") &&
      oldValue !== newValue &&
      this.isConnected
    ) {
      void this.#loadReport();
    }
  }

  async #loadReport() {
    this.#renderState("Loading accessibility report...");

    try {
      const embeddedReport = this.#getEmbeddedReport();

      if (embeddedReport) {
        this.#setReport(embeddedReport);
        return;
      }

      const src = this.getAttribute("src") ?? this.#getReportSrcFromUrl();
      const response = await fetch(src);

      if (!response.ok) {
        throw new Error(`The report request failed with ${response.status}.`);
      }

      this.#setReport(await response.json());
    } catch (error) {
      this.#renderState(
        error instanceof Error
          ? `Unable to load report. ${error.message}`
          : "Unable to load report.",
      );
    }
  }

  #getEmbeddedReport() {
    const scriptId = this.getAttribute("data-script");

    if (!scriptId) {
      return null;
    }

    const script = document.getElementById(scriptId);

    if (!script) {
      throw new Error(`Unable to find embedded report script "${scriptId}".`);
    }

    return JSON.parse(script.textContent ?? "");
  }

  #getReportSrcFromUrl() {
    const params = new URLSearchParams(window.location.search);

    return params.get("src") ?? params.get("report") ?? defaultReportSrc;
  }

  #setReport(report) {
    if (!Array.isArray(report)) {
      throw new Error("The report must be a top-level array.");
    }

    this.#report = report;
    this.#renderReport();
  }

  #createElement(tagName, className, textContent) {
    const element = document.createElement(tagName);

    if (className) {
      element.className = className;
    }

    if (textContent) {
      element.textContent = textContent;
    }

    return element;
  }

  #getFilteredReport() {
    const normalizedSearch = this.#filters.search.toLowerCase().trim();

    return this.#report
      .map((entry) => {
        const failed = this.#filterRules(entry.axe.failed, {
          impact: this.#filters.impact,
          search: normalizedSearch,
        });
        const passed = this.#filterRules(entry.axe.passed, {
          impact: this.#filters.impact,
          search: normalizedSearch,
        });

        return {
          ...entry,
          axe: {
            ...entry.axe,
            failed,
            passed,
          },
        };
      })
      .filter((entry) => {
        const matchesStatus =
          this.#filters.status === "all" ||
          entry.status === this.#filters.status;
        const hasRules = entry.axe.failed.length || entry.axe.passed.length;
        const matchesTitle = entry.title
          .toLowerCase()
          .includes(normalizedSearch);

        return matchesStatus && (hasRules || matchesTitle);
      });
  }

  #filterRules(rules, filters) {
    return rules.filter((rule) => {
      const haystack = [
        rule.id,
        rule.description,
        rule.help,
        rule.impact,
        rule.tags.join(" "),
        ...rule.nodes.flatMap((node) => [
          node.html,
          node.target.join(" "),
          ...node.checks.map((check) => check.message),
        ]),
      ]
        .join(" ")
        .toLowerCase();
      const matchesImpact =
        filters.impact === "all" || rule.impact === filters.impact;
      const matchesSearch =
        !filters.search || haystack.includes(filters.search);

      return matchesImpact && matchesSearch;
    });
  }

  #getSummary(report) {
    const tests = report.length;
    const failed = report.reduce(
      (total, item) => total + item.axe.failed.length,
      0,
    );
    const passed = report.reduce(
      (total, item) => total + item.axe.passed.length,
      0,
    );
    const nodes = report.reduce((total, item) => {
      const rules = [...item.axe.failed, ...item.axe.passed];

      return total + rules.reduce((sum, rule) => sum + rule.totalNodes, 0);
    }, 0);

    return [
      ["Tests", tests],
      ["Failed checks", failed],
      ["Passed checks", passed],
      ["Affected nodes", nodes],
    ];
  }

  #groupRulesByImpact(rules) {
    const groups = new Map();

    for (const impact of impactOrder) {
      groups.set(impact, []);
    }

    for (const rule of rules) {
      const bucket = groups.get(rule.impact) ?? groups.get("unknown");

      bucket.push(rule);
    }

    return impactOrder
      .map((impact) => ({
        impact,
        rules: groups.get(impact) ?? [],
      }))
      .filter((group) => group.rules.length > 0);
  }

  #renderReport() {
    if (!this.#report.length) {
      this.#renderState("No accessibility results were found in this report.");
      return;
    }

    this.replaceChildren(this.#getShell());
  }

  #getShell() {
    const filteredReport = this.#getFilteredReport();
    const shell = this.#createElement("main", "report-shell");
    const hero = this.#getHero();
    const controls = this.#createElement("div", "report-controls");
    const toolbar = this.#getToolbar();
    const summary = this.#getSummaryRegion(filteredReport);
    const list = this.#createElement("div", "report-list");

    controls.append(toolbar, summary);
    list.setAttribute("aria-live", "polite");
    list.append(
      ...(filteredReport.length
        ? filteredReport.map((entry) => this.#getTestCard(entry))
        : [
            this.#createElement(
              "p",
              "report-state",
              "No results match the current filters.",
            ),
          ]),
    );
    shell.append(hero, controls, list);

    return shell;
  }

  #getHero() {
    const hero = this.#createElement("section", "report-hero");
    const titleGroup = this.#createElement("div");
    const eyebrow = this.#createElement(
      "p",
      "report-eyebrow",
      "Axe aggregate report",
    );
    const title = this.#createElement("h1", "", "Accessibility report");
    const description = this.#createElement(
      "p",
      "",
      "Playwright axe results by page — failures, passes, nodes, and remediation links.",
    );

    titleGroup.append(eyebrow, title);
    hero.append(titleGroup, description);

    return hero;
  }

  #getToolbar() {
    const toolbar = this.#createElement("form", "report-toolbar");

    toolbar.addEventListener("input", () => {
      this.#filters = {
        impact: toolbar.querySelector("[data-report-impact]")?.value ?? "all",
        search: toolbar.querySelector("[data-report-search]")?.value ?? "",
        status: toolbar.querySelector("[data-report-status]")?.value ?? "all",
      };
      this.replaceChildren(this.#getShell());
    });
    toolbar.addEventListener("submit", (event) => {
      event.preventDefault();
    });
    toolbar.append(
      this.#getInputField("Search", "Search rules, targets, and messages"),
      this.#getSelectField("Status", "data-report-status", [
        ["all", "All statuses"],
        ["passed", "Passed"],
        ["failed", "Failed"],
        ["timedOut", "Timed out"],
        ["skipped", "Skipped"],
        ["interrupted", "Interrupted"],
      ]),
      this.#getSelectField("Impact", "data-report-impact", [
        ["all", "All impacts"],
        ...impactOrder.map((impact) => [impact, impact]),
      ]),
    );

    return toolbar;
  }

  #getInputField(labelText, placeholder) {
    const field = this.#createElement("div", "report-field");
    const id = "report-search";
    const label = this.#createElement("label", "", labelText);
    const input = this.#createElement("input");

    input.dataset.reportSearch = "";
    input.id = id;
    input.placeholder = placeholder;
    input.type = "search";
    input.value = this.#filters.search;
    label.setAttribute("for", id);
    field.append(label, input);

    return field;
  }

  #getSelectField(labelText, dataAttribute, options) {
    const field = this.#createElement("div", "report-field");
    const id = `report-${labelText.toLowerCase()}`;
    const label = this.#createElement("label", "", labelText);
    const select = this.#createElement("select");

    select.setAttribute(dataAttribute, "");
    select.id = id;
    label.setAttribute("for", id);
    select.append(
      ...options.map(([value, text]) => {
        const option = this.#createElement("option", "", text);

        option.value = value;

        return option;
      }),
    );
    select.value =
      dataAttribute === "data-report-impact"
        ? this.#filters.impact
        : this.#filters.status;
    field.append(label, select);

    return field;
  }

  #getSummaryRegion(report) {
    const summary = this.#createElement("section", "report-summary");

    summary.setAttribute("aria-label", "Report summary");
    summary.append(
      ...this.#getSummary(report).map(([label, value]) => {
        const metric = this.#createElement("div", "metric");
        const metricLabel = this.#createElement("span", "", label);
        const metricValue = this.#createElement("strong", "", value.toString());

        metric.append(metricLabel, metricValue);

        return metric;
      }),
    );

    return summary;
  }

  #getTestCard(entry) {
    const article = this.#createElement("article", "test-card");
    const header = this.#createElement("header");
    const titleGroup = this.#createElement("div");
    const title = this.#createElement("h2", "", entry.title);
    const meta = this.#createElement("p", "test-meta");

    meta.append(
      this.#getPill(entry.status, "status"),
      this.#getPill(`${entry.axe.failed.length} failed`, "failed"),
      this.#getPill(`${entry.axe.passed.length} passed`, "passed"),
    );
    titleGroup.append(title, this.#createElement("p", "", entry.axe.url));
    header.append(titleGroup, meta);
    article.append(header);

    if (entry.axe.failed.length) {
      article.append(this.#getFailedSection(entry.axe.failed));
    }

    if (entry.axe.passed.length) {
      article.append(this.#getPassedSection(entry.axe.passed));
    }

    return article;
  }

  #getPill(text, kind) {
    const pill = this.#createElement("span", "pill", text);

    pill.dataset.kind = kind;

    return pill;
  }

  #getDisclosureSummary(label, count, iconName) {
    const summary = this.#createElement("summary", "disclosure-summary");
    const labelWrap = this.#createElement("span", "disclosure-summary__label");

    if (iconName) {
      labelWrap.append(createIcon(iconName, "icon icon--leading"));
    }

    labelWrap.append(this.#createElement("span", "", label));
    summary.append(
      labelWrap,
      this.#getPill(`${count} ${count === 1 ? "rule" : "rules"}`, "count"),
      createIcon("chevronDown", "icon icon--trailing disclosure-chevron"),
    );

    return summary;
  }

  #getFailedSection(rules) {
    const section = this.#createElement("section", "rule-group rule-group--failed");
    const groups = this.#groupRulesByImpact(rules);

    section.setAttribute("aria-label", "Failed checks");
    section.append(
      ...groups.map((group) => this.#getImpactDisclosure(group, "failed")),
    );

    return section;
  }

  #getPassedSection(rules) {
    const disclosure = this.#createElement(
      "details",
      "rule-group-disclosure rule-group-disclosure--passed",
    );
    const groups = this.#groupRulesByImpact(rules);

    disclosure.append(
      this.#getDisclosureSummary(
        "Passed checks",
        rules.length,
        "circleCheck",
      ),
      ...groups.map((group) => this.#getImpactDisclosure(group, "passed")),
    );

    return disclosure;
  }

  #getImpactDisclosure({ impact, rules }, kind) {
    const disclosure = this.#createElement(
      "details",
      "impact-disclosure",
    );
    const content = this.#createElement("div", "impact-disclosure__content");
    const openByDefault = kind === "failed" && impact === "critical";
    const iconName = impact === "critical" ? "circleAlert" : null;

    disclosure.dataset.impact = impact;
    if (openByDefault) {
      disclosure.open = true;
    }

    content.append(...rules.map((rule) => this.#getRuleCard(rule, kind)));
    disclosure.append(
      this.#getDisclosureSummary(
        impactLabels[impact] ?? impact,
        rules.length,
        iconName,
      ),
      content,
    );

    return disclosure;
  }

  #getRuleCard(rule, kind) {
    const article = this.#createElement("article", "rule-card");
    const header = this.#createElement("header", "rule-card__header");
    const heading = this.#createElement("h4", "", rule.id);
    const impact = this.#createElement("span", "pill", rule.impact);
    const description = this.#createElement("p", "rule-card__description", rule.description);
    const help = this.#createElement("p", "rule-card__help", rule.help);
    const guidance = this.#createElement("p", "rule-guidance");
    const helpLink = this.#createElement(
      "a",
      "rule-guidance__link",
      `Deque guidance for ${rule.id}`,
    );
    const tags = this.#createElement("div", "rule-tags");

    impact.dataset.impact = rule.impact;
    impact.dataset.kind = kind;
    helpLink.href = rule.helpUrl;
    helpLink.rel = "external noopener noreferrer";
    helpLink.target = "_blank";
    helpLink.append(createIcon("externalLink", "icon icon--inline"));
    guidance.append(helpLink);
    tags.append(...rule.tags.map((tag) => this.#getPill(tag, "tag")));
    header.append(heading, impact);
    article.append(header, description, help, guidance, tags);

    if (rule.nodes.length) {
      article.append(this.#getNodeDisclosure(rule.nodes));
    }

    return article;
  }

  #getNodeDisclosure(nodes) {
    const disclosure = this.#createElement("details", "node-disclosure");
    const summary = this.#createElement("summary", "disclosure-summary");
    const label = this.#createElement("span", "disclosure-summary__label");
    const nodeLabel =
      nodes.length === 1 ? "1 affected element" : `${nodes.length} affected elements`;

    label.append(
      createIcon("list", "icon icon--leading"),
      this.#createElement("span", "", nodeLabel),
    );
    summary.append(
      label,
      createIcon("chevronDown", "icon icon--trailing disclosure-chevron"),
    );
    disclosure.append(summary, this.#getNodeList(nodes));

    return disclosure;
  }

  #getNodeList(nodes) {
    const list = this.#createElement("div", "node-list");

    list.append(
      ...nodes.map((node) => {
        const card = this.#createElement("section", "node-card");
        const target = this.#createElement("p", "", node.target.join(", "));
        const code = this.#createElement("code", "", node.html);
        const checks = this.#createElement("ul");

        checks.append(
          ...node.checks.map((check) => {
            const item = this.#createElement(
              "li",
              "",
              `${check.id}: ${check.message}`,
            );

            return item;
          }),
        );
        card.append(target, code, checks);

        return card;
      }),
    );

    return list;
  }

  #renderState(message) {
    const shell = this.#createElement("main", "report-shell");
    const state = this.#createElement("p", "report-state", message);

    shell.append(state);
    this.replaceChildren(shell);
  }
}

customElements.define("axe-aggregate-reporter", AxeAggregateReporter);
