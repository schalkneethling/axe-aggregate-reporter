#!/usr/bin/env node

import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(fileURLToPath(import.meta.url), "..", "..");
const scratchReport = ".viewer-report.json";
const embeddedReportId = "axe-aggregate-report-data";
const defaultPort = 4173;
const defaultStandalonePath = path.join("reports", "axe-aggregate-report.html");

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
]);

function getOptions(argv) {
  const options = {
    open: true,
    port: defaultPort,
    reportPath: null,
    standalonePath: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--no-open") {
      options.open = false;
      continue;
    }

    if (arg === "--standalone" || arg === "-s") {
      const value = argv[index + 1];

      options.standalonePath =
        value && !value.startsWith("-") ? value : defaultStandalonePath;

      if (value && !value.startsWith("-")) {
        index += 1;
      }

      continue;
    }

    if (arg.startsWith("--standalone=")) {
      options.standalonePath =
        arg.slice("--standalone=".length) || defaultStandalonePath;
      continue;
    }

    if (arg === "--port" || arg === "-p") {
      const value = argv[index + 1];

      if (!value) {
        throw new Error(`${arg} requires a port number.`);
      }

      options.port = Number.parseInt(value, 10);
      index += 1;
      continue;
    }

    if (arg.startsWith("--port=")) {
      options.port = Number.parseInt(arg.slice("--port=".length), 10);
      continue;
    }

    if (!options.reportPath) {
      options.reportPath = arg;
      continue;
    }

    throw new Error(`Unexpected argument: ${arg}`);
  }

  if (!Number.isInteger(options.port) || options.port < 1 || options.port > 65535) {
    throw new Error("Port must be a number between 1 and 65535.");
  }

  return options;
}

function printHelp() {
  console.info(`Usage:
  axe-aggregate-viewer <path-to-full-report.json> [--port 4173] [--no-open]
  axe-aggregate-viewer <path-to-full-report.json> --standalone [report.html]

Copies the target report to ${scratchReport}, starts a local viewer server, and
opens the viewer in your browser.

With --standalone, writes a self-contained HTML file with inlined CSS,
JavaScript, and report JSON. The default standalone output is
${defaultStandalonePath}.`);
}

async function readReport(reportPath) {
  const source = path.resolve(process.cwd(), reportPath);
  const rawReport = await fs.readFile(source, "utf-8");
  const report = JSON.parse(rawReport);

  if (!Array.isArray(report)) {
    throw new Error("The report must be a top-level array.");
  }

  return { rawReport, source };
}

async function copyReport(reportPath) {
  const destination = path.join(rootDir, scratchReport);
  const { rawReport, source } = await readReport(reportPath);

  await fs.writeFile(destination, rawReport);

  return { destination, source };
}

function escapeJsonForHtml(rawReport) {
  return rawReport.replaceAll(/<\/script/gi, "<\\/script");
}

function stripModuleImport(source) {
  return source.replace('import { createIcon } from "./lucide-icons.js";\n\n', "");
}

function stripIconExport(source) {
  return source.replace("export const createIcon", "const createIcon");
}

async function writeStandaloneReport(reportPath, outputPath) {
  const { rawReport, source } = await readReport(reportPath);
  const destination = path.resolve(process.cwd(), outputPath);
  const [css, icons, viewer] = await Promise.all([
    fs.readFile(path.join(rootDir, "css", "axe-aggregate-reporter.css"), "utf-8"),
    fs.readFile(path.join(rootDir, "js", "lucide-icons.js"), "utf-8"),
    fs.readFile(path.join(rootDir, "js", "axe-aggregate-reporter.js"), "utf-8"),
  ]);
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Accessibility report</title>
    <style>
${css}
    </style>
  </head>
  <body>
    <axe-aggregate-reporter data-script="${embeddedReportId}"></axe-aggregate-reporter>
    <script id="${embeddedReportId}" type="application/json">
${escapeJsonForHtml(rawReport)}
    </script>
    <script type="module">
${stripIconExport(icons)}

${stripModuleImport(viewer)}
    </script>
  </body>
</html>
`;

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, html);

  return { destination, source };
}

function getFilePath(requestUrl) {
  const url = new URL(requestUrl, `http://127.0.0.1:${defaultPort}`);
  const pathname = decodeURIComponent(url.pathname);
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(rootDir, requestedPath));

  if (filePath !== rootDir && !filePath.startsWith(`${rootDir}${path.sep}`)) {
    return null;
  }

  return filePath;
}

function createServer() {
  return http.createServer(async (request, response) => {
    const filePath = getFilePath(request.url ?? "/");

    if (!filePath) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    try {
      const stat = await fs.stat(filePath);

      if (!stat.isFile()) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, {
        "Content-Length": stat.size,
        "Content-Type": contentTypes.get(path.extname(filePath)) ?? "application/octet-stream",
      });
      createReadStream(filePath).pipe(response);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(500);
      response.end("Server error");
    }
  });
}

function openBrowser(url) {
  const command =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "cmd"
        : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore",
  });

  child.unref();
}

async function main() {
  const options = getOptions(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  if (!options.reportPath) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  if (options.standalonePath) {
    const { destination, source } = await writeStandaloneReport(
      options.reportPath,
      options.standalonePath,
    );

    console.info(`Read report from ${source}`);
    console.info(`Wrote standalone viewer to ${destination}`);
    return;
  }

  const { destination, source } = await copyReport(options.reportPath);
  const server = createServer();

  server.on("error", (error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
  server.listen(options.port, "127.0.0.1", () => {
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : options.port;
    const viewerUrl = `http://127.0.0.1:${port}/?src=./${scratchReport}`;

    console.info(`Copied report from ${source}`);
    console.info(`Viewer report scratch file: ${destination}`);
    console.info(`Viewer: ${viewerUrl}`);
    console.info("Press Ctrl+C to stop the server.");

    if (options.open) {
      openBrowser(viewerUrl);
    }
  });
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
