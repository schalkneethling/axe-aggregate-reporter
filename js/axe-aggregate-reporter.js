import json from "../full-report.json" with { type: "json" };

class AxeAggregateReporter extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.#renderReport();
  }

  #getHeaderRow(headers) {
    const tableHeader = document.createElement("thead");
    const tableHeaderRow = document.createElement("tr");

    const headerCells = headers.map((header) => {
      const th = document.createElement("th");
      th.textContent = header;
      return th;
    });

    tableHeaderRow.append(...headerCells);
    tableHeader.append(tableHeaderRow);

    return tableHeader;
  }

  #getBodyRow(node) {
    const tr = document.createElement("tr");
    const rows = Object.keys(node).map((entry) => {
      const td = document.createElement("td");

      if (entry === "html") {
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.textContent = node[entry];

        pre.append(code);
        td.append(pre);
      } else {
        td.textContent = node[entry];
      }

      return td;
    });

    tr.append(...rows);
    return tr;
  }

  #getTable(nodes) {
    if (!nodes.length) {
      return;
    }

    const table = document.createElement("table");
    table.append(this.#getHeaderRow(Object.keys(nodes[0])));

    const tbody = document.createElement("tbody");
    const tbodyRows = nodes.map((node) => {
      return this.#getBodyRow(node);
    });

    tbody.append(...tbodyRows);
    table.append(tbody);

    return table;
  }

  #getDetails(violations) {
    if (!violations.length) {
      return;
    }

    const violationDetails = violations.map((violationDetail) => {
      const violationContainer = document.createElement("section");
      const violationHeading = document.createElement("h3");
      const violationImpact = document.createElement("span");
      const violationDescription = document.createElement("p");
      violationHeading.textContent = `${violationDetail.id} `;
      violationImpact.textContent = violationDetail.impact;
      violationHeading.append(violationImpact);

      violationDescription.textContent = violationDetail.description;

      violationContainer.append(violationHeading, violationDescription);

      if (violationDetail.successCriteriaId.length) {
        const wcagIds = violationDetail.successCriteriaId;
        const wcagSuccessCriteria = document.createElement("ul");
        const wcagIdList = wcagIds.map((wcagId) => {
          const listItem = document.createElement("li");
          listItem.textContent = wcagId;
          return listItem;
        });

        wcagSuccessCriteria.append(...wcagIdList);
        violationContainer.append(wcagSuccessCriteria);
      }

      const violationSummary = document.createElement("p");
      const violationDequeLink = document.createElement("a");

      violationDequeLink.textContent = `Read more about ${violationDetail.id} on Deque University`;
      violationDequeLink.href = violationDetail.helpUrl;
      violationDequeLink.rel = "external noopener noreferrer";
      violationDequeLink.target = "_target";

      violationSummary.textContent = `${violationDetail.help}. `;
      violationSummary.append(violationDequeLink);

      violationContainer.append(
        violationSummary,
        this.#getTable(violationDetail.nodes),
      );

      return violationContainer;
    });

    return violationDetails;
  }

  #renderReport() {
    const violations = json.map((violation) => {
      const container = document.createElement("article");
      const anchor = document.createElement("a");
      const title = document.createElement("h2");

      anchor.href = violation.testId;
      title.id = violation.testId;
      title.textContent = violation.title;

      anchor.append(title);
      container.append(anchor, ...this.#getDetails(violation.axe));
      return container;
    });

    this.append(...violations);
  }
}

customElements.define("axe-aggregate-reporter", AxeAggregateReporter);
