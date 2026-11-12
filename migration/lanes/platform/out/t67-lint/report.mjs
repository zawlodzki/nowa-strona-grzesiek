// Regenerates the T67 lint and format baseline. Run from the repo root:
//   node migration/lanes/platform/out/t67-lint/report.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { relative } from "node:path";
import { ESLint } from "eslint";

const out = "migration/lanes/platform/out/t67-lint";
const root = process.cwd();

const results = await new ESLint().lintFiles(["."]);
const byRule = new Map();
const byFile = [];
for (const r of results) {
  const file = relative(root, r.filePath);
  const rules = new Map();
  for (const m of r.messages) {
    const rule = m.ruleId ?? "(parse)";
    const sev = m.severity === 2 ? "error" : "warn";
    const key = `${rule}\t${sev}`;
    byRule.set(key, (byRule.get(key) ?? 0) + 1);
    rules.set(rule, (rules.get(rule) ?? 0) + 1);
  }
  if (rules.size) byFile.push([file, [...rules].map(([k, v]) => `${k}=${v}`).join(" ")]);
}
const ruleRows = [...byRule].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k.replace("\t", ",")},${v}`);
writeFileSync(`${out}/eslint-by-rule.csv`, ["rule,severity,count", ...ruleRows].join("\n") + "\n");
writeFileSync(
  `${out}/eslint-by-file.csv`,
  ["file,rules", ...byFile.sort().map(([f, r]) => `${f},${r}`)].join("\n") + "\n",
);

let unformatted = [];
try {
  execFileSync("pnpm", ["exec", "prettier", "--list-different", "."], { encoding: "utf8" });
} catch (e) {
  if (e.status !== 1) throw e;
  unformatted = e.stdout.trim().split("\n").filter(Boolean);
}
const checked = execFileSync("pnpm", ["exec", "prettier", "--find-config-path", "package.json"], {
  encoding: "utf8",
}).trim();
writeFileSync(`${out}/prettier-unformatted.txt`, unformatted.sort().join("\n") + "\n");

const byTop = new Map();
for (const f of unformatted) {
  const top = f.split("/").slice(0, 2).join("/");
  byTop.set(top, (byTop.get(top) ?? 0) + 1);
}
writeFileSync(
  `${out}/summary.json`,
  JSON.stringify(
    {
      eslint: {
        filesLinted: results.length,
        filesWithFindings: byFile.length,
        errors: results.reduce((n, r) => n + r.errorCount, 0),
        warnings: results.reduce((n, r) => n + r.warningCount, 0),
      },
      prettier: {
        config: checked,
        unformattedFiles: unformatted.length,
        byArea: Object.fromEntries([...byTop].sort((a, b) => b[1] - a[1])),
      },
    },
    null,
    2,
  ) + "\n",
);
console.log(`eslint: ${byFile.length}/${results.length} files with findings; prettier: ${unformatted.length} unformatted`);
