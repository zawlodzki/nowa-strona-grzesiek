import {execFile, spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import {createReadStream} from 'node:fs';
import {chmod, link, mkdir, mkdtemp, realpath, rm} from 'node:fs/promises';
import {homedir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {promisify} from 'node:util';

const run = promisify(execFile);
const repo = fileURLToPath(new URL('../../', import.meta.url));
const project = '8u2zjhvn';
const dataset = 'production';
const counts = () => ({documents: 0, drafts: 0, images: 0, files: 0});

async function readCounts(token) {
  const url = new URL(`https://${project}.api.sanity.io/v2025-02-19/data/query/${dataset}`);
  const scope = token ? '!(_id in path("_.**")) || _id in path("_.releases.**")' : '!(_id in path("_.**"))';
  const docs = `(${scope}) && !(_type in ["sanity.imageAsset", "sanity.fileAsset"])`;
  url.searchParams.set('perspective', token ? 'raw' : 'published');
  url.searchParams.set('query', `{
    "documents": count(*[${docs}]),
    "drafts": count(*[${docs} && _id in path("drafts.**")]),
    "images": count(*[_type == "sanity.imageAsset"]),
    "files": count(*[_type == "sanity.fileAsset"])
  }`);

  let response;
  try {
    response = await fetch(url, {
      headers: token ? {Authorization: `Bearer ${token}`} : {},
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new Error('Could not reach the Sanity count API.');
  }
  if (!response.ok) throw new Error(`Sanity count query returned HTTP ${response.status}.`);
  const {result} = await response.json();
  if (Object.keys(counts()).some(key => !Number.isSafeInteger(result?.[key]) || result[key] < 0)) {
    throw new Error('Invalid counts from Sanity.');
  }
  return result;
}

async function* archiveLines(args) {
  const tar = spawn('tar', args, {stdio: ['ignore', 'pipe', 'ignore']});
  const closed = once(tar, 'close').catch(() => []);
  const lines = createInterface({input: tar.stdout, crlfDelay: Infinity});
  try {
    yield* lines;
    const [code] = await closed;
    if (code !== 0) throw new Error('Could not read the Sanity archive with tar.');
  } finally {
    lines.close();
    if (tar.exitCode === null && tar.signalCode === null) tar.kill();
    await closed;
  }
}

export async function verifyArchive(archive, expected) {
  const actual = counts();
  const members = new Set();
  const assetFolders = new Map([['images', 'images'], ['files', 'files']]);
  let documentsFile;
  for await (const member of archiveLines(['-tzf', archive])) {
    if (member.endsWith('/')) continue;
    const parts = member.split('/');
    if (members.has(member)) throw new Error('Duplicate file in the Sanity archive.');
    members.add(member);
    if (parts.length === 2 && parts[1] === 'data.ndjson') {
      if (documentsFile) throw new Error('Multiple data.ndjson files in the Sanity archive.');
      documentsFile = member;
    }
    if (parts.length === 3 && assetFolders.has(parts[1])) actual[assetFolders.get(parts[1])]++;
  }
  if (!documentsFile) throw new Error('Missing data.ndjson in the Sanity archive.');
  const ids = new Set();
  for await (const line of archiveLines(['-xOzf', archive, '--', documentsFile])) {
    let document;
    try {
      document = JSON.parse(line);
    } catch {
      throw new Error('Invalid NDJSON in the Sanity archive.');
    }
    if (typeof document?._id !== 'string' || typeof document._type !== 'string' || ids.has(document._id)) {
      throw new Error('Invalid or duplicate document in the Sanity archive.');
    }
    ids.add(document._id);
    actual.documents++;
    if (document._id.startsWith('drafts.')) actual.drafts++;
  }
  compareCounts(expected, actual, 'Sanity archive');
  return actual;
}

function compareCounts(expected, actual, label) {
  for (const [key, count] of Object.entries(expected)) {
    if (count !== actual[key]) {
      throw new Error(`${label} has ${actual[key]} ${key}. Expected ${count}.`);
    }
  }
}

async function existingAncestor(path) {
  try {
    return await realpath(path);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return existingAncestor(dirname(path));
  }
}

async function requireOutsideGit(path) {
  const ancestor = await existingAncestor(path);
  try {
    await run('git', ['-C', ancestor, 'rev-parse', '--git-dir'], {env: {PATH: process.env.PATH}});
  } catch (error) {
    if (error.code === 128 && error.stderr.includes('not a git repository')) return;
    throw new Error('Could not check whether the backup directory is outside Git.');
  }
  throw new Error('Choose a backup directory outside Git.');
}

async function backup(directory) {
  await requireOutsideGit(directory);
  await mkdir(directory, {recursive: true, mode: 0o700});
  await requireOutsideGit(directory);
  const token = process.env.SANITY_API_READ_TOKEN || process.env.SANITY_AUTH_TOKEN;
  const expected = await readCounts(token);
  const name = `${project}-${dataset}-${new Date().toISOString().replaceAll(':', '-')}.tar.gz`;
  const staging = await mkdtemp(join(directory, '.sanity-export-'));
  const temporary = join(staging, name);
  const archive = join(directory, name);
  try {
    try {
      await run('pnpm', [
        '--filter', 'studio', 'exec', 'sanity', 'datasets', 'export', dataset, temporary,
        '-p', project, ...(token ? [] : ['--no-drafts']),
      ], {
        cwd: repo,
        env: {...process.env, SANITY_AUTH_TOKEN: token, SANITY_TELEMETRY_DISABLED: '1', CI: '1'},
      });
    } catch (error) {
      throw new Error(`Sanity export failed (${error.code}). Check the installed Studio CLI and Sanity read access.`);
    }
    const actual = await verifyArchive(temporary, expected);
    compareCounts(expected, await readCounts(token), 'Sanity after export');
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(temporary)) hash.update(chunk);
    await chmod(temporary, 0o600);
    await link(temporary, archive);
    const assets = actual.images + actual.files;
    console.log(`documents=${actual.documents} assets=${assets} images=${actual.images} files=${actual.files} drafts=${actual.drafts} drafts_included=${Boolean(token)} sha256=${hash.digest('hex')} archive=${archive}`);
  } finally {
    await rm(staging, {recursive: true, force: true});
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [directory, ...extra] = process.argv.slice(2);
  if (extra.length || directory?.startsWith('-')) {
    console.error('Usage: node migration/tools/backup-sanity.mjs [backup-directory]');
    process.exitCode = 1;
  } else {
    try {
      await backup(resolve(directory ?? join(homedir(), 'sanity-backups', 'zawlodzki')));
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
