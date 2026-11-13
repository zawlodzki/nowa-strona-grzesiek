// Emit independent per-metric medians, including every raw run, into the artifact.
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import config from "./lighthouserc.cjs";
const __dirname = dirname(fileURLToPath(import.meta.url));
const reportDir = join(__dirname, ".lighthouseci");
const outDir = join(__dirname, ".wrangler/lighthouse");
const median = (values) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const reports = readdirSync(reportDir)
  .filter((name) => /^lhr-.*\.json$/.test(name))
  .map((name) => JSON.parse(readFileSync(join(reportDir, name), "utf8")));
const pages = config.ci.collect.url.map((url) => {
  const runs = reports.filter((report) => report.requestedUrl === url);
  if (runs.length !== 3 || runs.some((run) => run.runtimeError)) {
    throw new Error(
      `Expected three valid Lighthouse runs for ${url}; found ${runs.length}`,
    );
  }
  const values = runs.map((run) => ({
    performance: run.categories.performance.score,
    accessibility: run.categories.accessibility.score,
    bestPractices: run.categories["best-practices"].score,
    seo: run.categories.seo.score,
    lcpMs: run.audits["largest-contentful-paint"].numericValue,
    cls: run.audits["cumulative-layout-shift"].numericValue,
    ...Object.fromEntries(
      ["total", "script", "third-party"].map((type) => [
        `${type}Bytes`,
        run.audits["resource-summary"].details.items.find(
          (item) => item.resourceType === type,
        ).transferSize,
      ]),
    ),
  }));
  return {
    url,
    lighthouseVersion: runs[0].lighthouseVersion,
    fetchTimes: runs.map((run) => run.fetchTime),
    medians: Object.fromEntries(
      Object.keys(values[0]).map((key) => [
        key,
        median(values.map((value) => value[key])),
      ]),
    ),
    runs: values,
  };
});
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, "medians.json"),
  `${JSON.stringify(pages, null, 2)}\n`,
);
console.log(
  JSON.stringify(
    pages.map(({ url, medians }) => ({ url, ...medians })),
    null,
    2,
  ),
);
