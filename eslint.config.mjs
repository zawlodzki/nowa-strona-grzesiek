// T67: lint baseline. Rules the codebase already passes are errors; the rest are
// warnings until a follow-up fixes them (counts in migration/lanes/platform/out/t67-lint/).
import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.astro/**",
      "**/.wrangler/**",
      "**/.sanity/**",
      "**/worker-configuration.d.ts",
      "**/sanity.types.ts",
      ".agent/**",
      ".agents/**",
      ".claude/**",
      ".codex/**",
      ".cursor/**",
      ".gemini/**",
      ".grok/**",
      ".hermes/**",
      ".impeccable/**",
      ".opencode/**",
      "migration/00-inventory/**",
      "migration/lanes/**/out/**",
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    // Recommended rules the code fails today, so CI stays green. Promote each one
    // to "error" once its count in the T67 report reaches zero.
    rules: {
      "no-var": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "no-useless-escape": "warn",
      "no-control-regex": "warn",
      "no-useless-assignment": "warn",
      "preserve-caught-error": "warn",
      "prefer-rest-params": "warn",
      "no-empty": "warn",
    },
  },
);
