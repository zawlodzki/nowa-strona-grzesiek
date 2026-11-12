import {createHash} from 'node:crypto';
import {appendFile, readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

export const types = ['page', 'post', 'person', 'organization', 'siteSettings', 'service', 'course', 'redirect', 'logo', 'testimonial', 'translation.metadata', 'sanity.imageAsset'];
export const query = `*[_type in ${JSON.stringify(types)} && !(_id in path("drafts.**")) && !(_id in path("versions.**"))] | order(_updatedAt desc)[0]._updatedAt`;

function timestamp(value) {
  const time = typeof value === 'string' ? Date.parse(value) : NaN;
  if (!Number.isFinite(time)) throw new Error('Invalid API timestamp');
  return time;
}

export function compare(publishedAt, deployment, now = Date.now(), thresholdMinutes = 20) {
  if (!Number.isFinite(thresholdMinutes) || thresholdMinutes <= 0) throw new Error('Invalid threshold');
  const deployed = timestamp(deployment.created_on);
  if (typeof deployment.id !== 'string' || !deployment.id) throw new Error('Missing deployment id');
  const published = publishedAt === null ? null : timestamp(publishedAt);
  if (deployed > now || (published !== null && published > now)) throw new Error('Future API timestamp');
  const status = published !== null && published > deployed && now - published > thresholdMinutes * 60_000 ? 'alert' : 'ok';
  const incident = createHash('sha256').update(`zawlodzki-web:${deployment.id}`).digest('hex');
  return {status, incident, publishedAt, deployedAt: deployment.created_on, thresholdMinutes};
}

async function json(url, options = {}, fetcher = fetch) {
  const response = await fetcher(url, {...options, redirect: 'error', signal: AbortSignal.timeout(15_000)});
  if (!response.ok) throw new Error(`Upstream HTTP ${response.status}`);
  return response.json();
}

export async function monitor(env = process.env, fetcher = fetch) {
  if (!/^[a-f0-9]{32}$/.test(env.CLOUDFLARE_ACCOUNT_ID ?? '') || !env.CLOUDFLARE_API_TOKEN) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required');
  }
  const sanity = new URL('https://8u2zjhvn.api.sanity.io/v2025-02-19/data/query/production');
  sanity.searchParams.set('query', query);
  sanity.searchParams.set('perspective', 'published');
  const [content, cloudflare] = await Promise.all([
    json(sanity, {}, fetcher),
    json(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/workers/scripts/zawlodzki-web/deployments`,
      {headers: {Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`}}, fetcher),
  ]);
  if (!Object.hasOwn(content, 'result') || cloudflare.success !== true || !cloudflare.result?.deployments?.length) {
    throw new Error('Missing publication or active deployment response');
  }
  return compare(content.result, cloudflare.result.deployments[0]);
}

export async function send(report, {dryRun = true, webhook, fetcher = fetch} = {}) {
  if (!['ok', 'alert'].includes(report.status)) throw new Error('Invalid report');
  if (report.status === 'ok') return {sent: false};
  timestamp(report.publishedAt);
  timestamp(report.deployedAt);
  if (!/^[a-f0-9]{64}$/.test(report.incident)) throw new Error('Invalid incident');
  const payload = {text: `zawlodzki-web: publication has no later deployment. Published ${report.publishedAt}; deployed ${report.deployedAt}. Incident ${report.incident}.`};
  if (dryRun) return {sent: false, dryRun: true, ...payload};
  const url = new URL(webhook);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Alert webhook must use HTTPS');
  const response = await fetcher(url, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload), redirect: 'error', signal: AbortSignal.timeout(15_000)});
  if (!response.ok) throw new Error(`Alert HTTP ${response.status}`);
  return {sent: true};
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'monitor' && args.length === 0) {
    const report = await monitor();
    console.log(JSON.stringify(report));
    if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `status=${report.status}\nincident=${report.incident}\n`);
  } else if (command === 'send' && args[0] && args.length <= 2 && (!args[1] || args[1] === '--dry-run')) {
    console.log(JSON.stringify(await send(JSON.parse(await readFile(args[0], 'utf8')), {dryRun: args[1] === '--dry-run', webhook: process.env.PUBLICATION_ALERT_WEBHOOK})));
  } else throw new Error('Usage: publication-alert.mjs monitor | send <report.json> [--dry-run]');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => { console.error('Publication monitor failed. Check API access, response schema and alert configuration.'); process.exitCode = 1; });
}
