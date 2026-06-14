# Project Goal

## North Star

Make Playwright axe accessibility results easy for teams to review, share, and act on by turning scattered test attachments into one stable aggregate report and a focused static viewer.

## Who This Is For

- Developers and QA engineers who already run accessibility checks with Playwright and `@axe-core/playwright`.
- Accessibility-minded product teams that need a readable findings ledger instead of raw JSON, console output, or custom reporting glue.
- Maintainers who want a small package they can add to an accessibility-specific Playwright run without changing how their broader test suite works.

## Core Goals

1. **Aggregate accessibility test evidence**
   - Collect formatted `axe.json` Playwright attachments from relevant tests.
   - Write a predictable `full-report.json` file that preserves test status, page URL, failed checks, passed checks, affected nodes, and Deque guidance links.
   - Keep the report schema simple enough to inspect, diff, archive, and render outside the original test run.

2. **Provide a useful static review experience**
   - Render the aggregate report as a dense, readable accessibility ledger.
   - Support filtering and searching across tests, impacts, rules, nodes, and messages.
   - Show failures prominently while keeping passed checks visible when they help explain coverage.
   - Handle loading, empty, invalid, embedded, and fetch-error states clearly.

3. **Fit naturally into Playwright workflows**
   - Export a Playwright reporter for accessibility-focused test configs.
   - Export formatter utilities for projects that run `@axe-core/playwright` with their own fixtures and axe options.
   - Provide a CLI for local review and self-contained HTML export.
   - Avoid forcing the reporter into every test suite in a project.

4. **Stay portable and low-friction**
   - Keep the viewer dependency-free and static.
   - Package the viewer assets, CSS, icons, CLI, and TypeScript build output in a predictable npm package.
   - Support local review, static hosting, and short-lived sharing services through standalone HTML reports.

## Success Looks Like

- A team can add the reporter to an accessibility Playwright config, attach formatted axe results, and get a valid `full-report.json` without custom aggregation code.
- The generated report helps reviewers quickly answer which pages were tested, which checks failed, how severe they are, what nodes were affected, and where remediation guidance lives.
- The viewer can be opened locally, embedded on a static page, or exported as a self-contained HTML artifact.
- Unit and end-to-end tests cover the formatter, reporter, CLI packaging/export path, and viewer states that users rely on.
- The package remains understandable enough for a maintainer to audit without needing a frontend framework or reporting platform.

## Non-Goals

- This project is not an axe runner. Projects should keep control of their own `@axe-core/playwright` setup, WCAG tags, page navigation, and axe options.
- This project is not a general Playwright report dashboard for all test types. It should focus on accessibility result review.
- This project is not a hosted service, database, or long-term analytics platform.
- This project is not a remediation engine. It should surface evidence and guidance links, not automatically fix accessibility issues.
- This project should not grow into a heavy framework app when static assets and a custom element are enough.
- This project should not hide passed checks if preserving them helps teams understand what was covered.

## Principles and Constraints

- Prefer stable, explicit report data over implicit state from Playwright internals.
- Keep the viewer static, dependency-free, and suitable for local files served over HTTP.
- Preserve the beta scope until the reporter, schema, CLI, and viewer behavior are reliable.
- Use logical CSS properties and keep CSS declarations alphabetically ordered.
- Maintain the forensic accessibility ledger visual direction: dense, readable audit data with restrained motion and warm severity cues.
- Treat failed checks as the primary workflow, while keeping supporting context close at hand.
- Keep package exports and CLI behavior predictable for npm consumers.

## Current Focus

- Harden the beta reporter/viewer path for real Playwright accessibility suites.
- Keep the aggregate schema clear and documented.
- Improve confidence through deterministic unit and end-to-end tests.
- Make standalone report export reliable for short-lived sharing and static review.

## Open Questions

- What compatibility promise should the beta make for the aggregate report schema before a stable 1.0 release?
- Which viewer filters or summaries are essential for larger reports with many pages and many nodes?
