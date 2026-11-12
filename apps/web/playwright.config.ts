import { mkdirSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';
import { BASE_URL, MOCK_N8N, OUT_DIR, TURNSTILE_PASS_SECRET, WORKER_PORT } from './e2e/env';

mkdirSync(OUT_DIR, { recursive: true });

// Serves the already built dist/ through the real Worker. Run `pnpm build` first.
// --var wins over any local .dev.vars, so a developer's real secrets never reach these tests.
const worker = [
  'wrangler dev --local --ip 127.0.0.1',
  `--port ${WORKER_PORT} --inspector-port 0 --show-interactive-dev-session=false`,
  `--persist-to ${OUT_DIR}/state`,
  `--var N8N_FORM_WEBHOOK:${MOCK_N8N.url}`,
  `--var TURNSTILE_SECRET_KEY:${TURNSTILE_PASS_SECRET}`,
].join(' ');

export default defineConfig({
  testDir: './e2e',
  outputDir: `${OUT_DIR}/results`,
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [[process.env.CI ? 'github' : 'list'], ['html', { open: 'never', outputFolder: `${OUT_DIR}/report` }]],
  use: { baseURL: BASE_URL, locale: 'pl-PL', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `node src/worker/form-mock-receiver.mjs --port ${MOCK_N8N.port} --out ${MOCK_N8N.file}`,
      stdout: 'pipe',
      wait: { stdout: /mock n8n listening/ },
      reuseExistingServer: false,
    },
    { command: worker, url: `${BASE_URL}/`, reuseExistingServer: false, timeout: 60_000 },
  ],
});
