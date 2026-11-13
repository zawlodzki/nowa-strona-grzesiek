/* eslint-disable @typescript-eslint/no-require-imports -- LHCI loads this configuration as CommonJS. */
const budgets = require("./lighthouse-budget.json");

// Fail configuration loading if a new URL accidentally lacks budget assertions.
const paths = [
  "/",
  "/blog",
  "/blog/automatyzacja-sprzedazy",
  "/audyt-ai-sprzedaz",
  "/kontakt",
  "/newsletter",
];
if (
  budgets.length !== paths.length ||
  paths.some(
    (path) => budgets.filter((budget) => budget.path === path).length !== 1,
  )
) {
  throw new Error("Each audited path must have exactly one resource budget");
}

module.exports = {
  ci: {
    collect: {
      url: paths.map((path) => `http://127.0.0.1:8790${path}`),
      numberOfRuns: 3,
      settings: {
        formFactor: "mobile",
        chromeFlags: "--no-sandbox --disable-dev-shm-usage",
        // Intentional local/staging noindex; all other SEO audits still contribute.
        skipAudits: ["is-crawlable"],
      },
    },
    assert: {
      assertMatrix: budgets.map((budget) => ({
        matchingUrlPattern: `^http://127\\.0\\.0\\.1:8790${budget.path === "/" ? "/" : budget.path}$`,
        aggregationMethod: "median",
        assertions: {
          "is-crawlable": "off",
          "categories:performance": ["error", { minScore: 0.85 }],
          "categories:accessibility": ["error", { minScore: 0.95 }],
          "categories:best-practices": ["error", { minScore: 0.95 }],
          "categories:seo": ["error", { minScore: 0.95 }],
          "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
          "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
          ...Object.fromEntries(
            budget.resourceSizes.map(({ resourceType, budget: kib }) => [
              `resource-summary:${resourceType}:size`,
              ["error", { maxNumericValue: kib * 1024 }],
            ]),
          ),
        },
      })),
    },
    upload: { target: "filesystem", outputDir: ".wrangler/lighthouse/reports" },
  },
};
