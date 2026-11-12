// Export Sanity with drafts, pack the archive into a standalone encrypted Restic
// repository, verify it, and upload the bundle to Backblaze B2 under Object Lock.
// Usage: node migration/tools/backup-offsite.mjs <work-directory-outside-git>
// Logs carry counts, checksums and object names only. This repository is public.
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir, readFile, rm, stat, writeFile, appendFile} from 'node:fs/promises';
import {basename, dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {promisify} from 'node:util';

const run = promisify(execFile);
const repo = fileURLToPath(new URL('../../', import.meta.url));
const lockDays = 30;

export function parseSummary(line) {
  const fields = Object.fromEntries(
    line.trim().split(/\s+/).map(pair => {
      const at = pair.indexOf('=');
      return [pair.slice(0, at), pair.slice(at + 1)];
    }),
  );
  for (const key of ['documents', 'drafts', 'images', 'files', 'sha256', 'archive', 'drafts_included']) {
    if (!fields[key]) throw new Error(`Backup summary is missing ${key}.`);
  }
  if (!/^[0-9a-f]{64}$/.test(fields.sha256)) throw new Error('Backup summary has an invalid SHA-256.');
  return fields;
}

export function objectName(prefix, archive) {
  const stem = basename(archive).replace(/\.tar\.gz$/, '');
  if (!/^[\w.-]+$/.test(stem)) throw new Error('Unexpected archive name.');
  return `${prefix}${stem}.restic.tar`;
}

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name}.`);
  return value;
}

async function digest(path, algorithm) {
  return createHash(algorithm).update(await readFile(path)).digest('hex');
}

async function b2(url, token, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {Authorization: token},
    body: JSON.stringify(body),
    redirect: 'error',
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    const {code, message} = await response.json().catch(() => ({}));
    throw new Error(`B2 ${new URL(url).pathname} returned HTTP ${response.status} ${code ?? ''}: ${message ?? ''}`);
  }
  return response.json();
}

async function upload(bundle, name, sha1, sha256) {
  const basic = Buffer.from(`${env('B2_APPLICATION_KEY_ID')}:${env('B2_APPLICATION_KEY')}`).toString('base64');
  const authResponse = await fetch('https://api.backblazeb2.com/b2api/v4/b2_authorize_account', {
    headers: {Authorization: `Basic ${basic}`},
    redirect: 'error',
    signal: AbortSignal.timeout(60_000),
  });
  if (!authResponse.ok) throw new Error(`B2 authorization returned HTTP ${authResponse.status}.`);
  const auth = await authResponse.json();
  const api = auth.apiInfo.storageApi;
  // API v4: the key is restricted to the backup bucket and can write but not read files.
  const bucketName = env('B2_BUCKET');
  const allowed = api.allowed ?? {};
  let bucketId = allowed.buckets?.find(b => b.name === bucketName)?.id;
  if (!bucketId) {
    const {buckets} = await b2(`${api.apiUrl}/b2api/v4/b2_list_buckets`, auth.authorizationToken, {
      accountId: auth.accountId,
      bucketName,
    });
    bucketId = buckets[0]?.bucketId;
  }
  if (!bucketId) throw new Error('The B2 key cannot see the backup bucket.');
  if (!allowed.capabilities?.includes('writeFileRetentions')) {
    throw new Error('The B2 key cannot set Object Lock retention.');
  }

  const target = await b2(`${api.apiUrl}/b2api/v4/b2_get_upload_url`, auth.authorizationToken, {bucketId});
  const retainUntil = Date.now() + lockDays * 86_400_000;
  const data = await readFile(bundle);
  const response = await fetch(target.uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: target.authorizationToken,
      'X-Bz-File-Name': encodeURIComponent(name).replaceAll('%2F', '/'),
      'Content-Type': 'application/x-tar',
      'Content-Length': String(data.length),
      'X-Bz-Content-Sha1': sha1,
      'X-Bz-Info-sha256': sha256,
      'X-Bz-File-Retention-Mode': 'compliance',
      'X-Bz-File-Retention-Retain-Until-Timestamp': String(retainUntil),
    },
    body: data,
    redirect: 'error',
    signal: AbortSignal.timeout(30 * 60_000),
  });
  if (!response.ok) {
    const {code, message} = await response.json().catch(() => ({}));
    throw new Error(`B2 upload returned HTTP ${response.status} ${code ?? ''}: ${message ?? ''}`);
  }
  const file = await response.json();
  if (file.contentSha1 !== sha1 || file.contentLength !== data.length) {
    throw new Error('B2 checksum or size does not match the local bundle.');
  }
  // B2 rejects retention headers on a bucket without Object Lock, so a successful upload is locked.
  // When the key can read retention, also check what B2 stored.
  const retention = file.fileRetention?.isClientAuthorizedToRead ? file.fileRetention.value : undefined;
  if (retention && retention.mode !== 'compliance') {
    throw new Error('B2 did not apply Compliance Object Lock to the bundle.');
  }
  return {retainUntil: retention?.retainUntilTimestamp ?? retainUntil, size: data.length};
}

async function main(work) {
  const password = env('RESTIC_PASSWORD');
  env('SANITY_API_READ_TOKEN');
  const prefix = process.env.B2_PREFIX ?? '';
  await rm(work, {recursive: true, force: true});
  const exports = join(work, 'exports');
  const bundleDir = join(work, 'bundle');
  const restored = join(work, 'restored');
  await mkdir(exports, {recursive: true, mode: 0o700});

  const {stdout} = await run(process.execPath, [join(repo, 'migration/tools/backup-sanity.mjs'), exports], {
    cwd: repo,
    maxBuffer: 1 << 20,
  });
  const summary = parseSummary(stdout.trim().split('\n').at(-1));
  if (summary.drafts_included !== 'true') throw new Error('The export did not include drafts.');
  const archiveName = basename(summary.archive);
  await writeFile(`${summary.archive}.sha256`, `${summary.sha256}  ${archiveName}\n`, {mode: 0o600});

  const restic = (args, cwd = work) =>
    run('restic', ['--quiet', '--no-cache', '-r', join(bundleDir, 'restic'), ...args], {
      cwd,
      env: {PATH: process.env.PATH, HOME: process.env.HOME, RESTIC_PASSWORD: password},
      maxBuffer: 16 << 20,
    });
  await mkdir(bundleDir, {mode: 0o700});
  await restic(['init']);
  await restic(['backup', '--host', 'sanity-backup', '--tag', 'weekly', archiveName, `${archiveName}.sha256`], exports);
  await restic(['check', '--read-data']);
  await restic(['restore', 'latest', '--target', restored]);
  if ((await digest(join(restored, archiveName), 'sha256')) !== summary.sha256) {
    throw new Error('The archive restored from Restic does not match the export.');
  }

  const name = objectName(prefix, summary.archive);
  const bundle = join(work, basename(name));
  await run('tar', ['-cf', bundle, '-C', bundleDir, 'restic']);
  const sha1 = await digest(bundle, 'sha1');
  const bundleSha256 = await digest(bundle, 'sha256');
  const {retainUntil, size} = await upload(bundle, name, sha1, bundleSha256);

  const line = [
    `documents=${summary.documents}`,
    `drafts=${summary.drafts}`,
    `images=${summary.images}`,
    `files=${summary.files}`,
    `drafts_included=true`,
    `archive_sha256=${summary.sha256}`,
    `bundle_sha256=${bundleSha256}`,
    `bundle_bytes=${size}`,
    `object=${name}`,
    `locked_until=${new Date(retainUntil).toISOString()}`,
  ].join(' ');
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `### Sanity backup\n\n\`${line}\`\n`);
  }
  await rm(work, {recursive: true, force: true});
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [work, ...extra] = process.argv.slice(2);
  if (!work || extra.length) {
    console.error('Usage: node migration/tools/backup-offsite.mjs <work-directory-outside-git>');
    process.exitCode = 1;
  } else {
    try {
      await stat(dirname(resolve(work)));
      await main(resolve(work));
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
