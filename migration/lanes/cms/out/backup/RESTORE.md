# Back up and restore Sanity content

## Export production

Run from the repository root with Node 24, pnpm, Git, and tar installed.

```sh
pnpm install --frozen-lockfile
node migration/tools/backup-sanity.mjs
```

The archive goes to `~/sanity-backups/zawlodzki`. Pass a directory outside Git as the first argument to use a different location. For a complete backup, inject `SANITY_API_READ_TOKEN` or `SANITY_AUTH_TOKEN` from your secret manager. Use a credential that can read production drafts and assets. A signed-in Sanity CLI session with neither variable set produces a published-only backup.

Keep the summary with the archive. It records the content document count, draft count, image count, file count, and SHA-256. Drafts count toward the document total. Asset binaries have their own totals. If a count differs, check for concurrent editorial activity or inaccessible assets, then rerun. Sanity's exporter excludes internal documents apart from content releases in an authenticated draft export. [Sanity export documentation](https://www.sanity.io/docs/content-lake/exporting-data)

## Restore into a fresh dataset

1. Select the verified archive and compare its SHA-256 to the saved summary.

   ```sh
   archive=/absolute/path/to/the/verified-export.tar.gz
   shasum -a 256 "$archive"
   ```

2. After approval, use a Sanity account with permission to create datasets and import content. Use a fresh name for each drill. Keep the scratch dataset private during the drill.

   ```sh
   scratch=restore-drill-YYYYMMDD
   pnpm --filter studio exec sanity datasets create "$scratch" -p 8u2zjhvn --visibility private
   ```

3. Confirm that the new dataset is private and empty. Import into the new dataset. The system-document flag allows content release records from the export.

   ```sh
   pnpm --filter studio exec sanity datasets import "$archive" -p 8u2zjhvn -d "$scratch" --allow-system-documents
   ```

   If the import stops partway, record the error and use a fresh, approved dataset for the next attempt. [Sanity import documentation](https://www.sanity.io/docs/apis-and-sdks/importing-data)

4. Compare the restored counts to the saved export summary. Compare to live production separately so editorial changes since the export do not obscure a restore mismatch. For a full export, query the raw perspective using a Sanity login or an authorized `SANITY_AUTH_TOKEN`.

   ```sh
   query='{
     "documents":count(*[(!(_id in path("_.**")) || _id in path("_.releases.**")) && !(_type in ["sanity.imageAsset","sanity.fileAsset"])]),
     "drafts":count(*[_id in path("drafts.**")]),
     "images":count(*[_type == "sanity.imageAsset"]),
     "files":count(*[_type == "sanity.fileAsset"])
   }'
   for dataset in production "$scratch"; do
     pnpm --filter studio exec sanity api \
       "/v2025-02-19/data/query/$dataset" -p 8u2zjhvn --project-hosted \
       -X GET -f 'perspective=raw' -f "query=$query"
   done
   ```

   For a published-only archive, use `perspective=published` for the production comparison. The restored draft count should be zero.

## Verify both site builds through the Worker

Use the same Git revision for both builds. Set `VERIFY_WEB_HOME` to a directory outside Git with access limited to you. The commands below rebuild the same checkout in sequence.

```sh
umask 077
export VERIFY_WEB_HOME="$(mktemp -d /tmp/zawlodzki-restore.XXXXXX)"
web=.claude/skills/verify-web/scripts/web.sh

SANITY_DATASET=production "$web" up --port 8790
"$web" doctor --port 8790
```

While the Worker runs, capture the production crawl and probes.

```sh
node migration/tools/crawl.mjs --origin http://127.0.0.1:8790 \
  --canonical-origin https://www.zawlodzki.pl --out "$VERIFY_WEB_HOME/production" --no-html
"$web" probe / --port 8790 --label home
"$web" probe /blog --port 8790 --label blog
"$web" probe /o-mnie --port 8790 --label about
"$web" probe /blog/crm-a-erp --port 8790 --label article
"$web" down --port 8790
```

The public build queries Sanity anonymously by default. For a private restore drill, load `SANITY_API_READ_TOKEN` into the environment. Write this temporary Node preload to `$VERIFY_WEB_HOME/read-private.mjs`. It sends the token only to the selected dataset's GROQ endpoint during the local build.

```js
const readToken = process.env.SANITY_API_READ_TOKEN;
const dataset = process.env.SANITY_DATASET;
if (!readToken || !/^restore-drill-[a-z0-9-]+$/.test(dataset ?? '')) {
  throw new Error('Set the scratch dataset and a Sanity read token.');
}
const fetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(input instanceof Request ? input.url : input);
  if (url.origin !== 'https://8u2zjhvn.api.sanity.io' ||
      url.pathname !== `/v2025-02-19/data/query/${dataset}`) {
    return fetch(input, init);
  }
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  headers.set('Authorization', `Bearer ${readToken}`);
  return fetch(input, {...init, headers, redirect: 'error'});
};
```

Build against the private dataset and serve the resulting files through the Worker.

```sh
SANITY_DATASET="$scratch" NODE_OPTIONS="--import=$VERIFY_WEB_HOME/read-private.mjs" \
  pnpm --filter web build
"$web" up --port 8791 --no-build
"$web" doctor --port 8791
node migration/tools/crawl.mjs --origin http://127.0.0.1:8791 \
  --canonical-origin https://www.zawlodzki.pl --out "$VERIFY_WEB_HOME/restored" --no-html
"$web" probe / --port 8791 --label home
"$web" probe /blog --port 8791 --label blog
"$web" probe /o-mnie --port 8791 --label about
"$web" probe /blog/crm-a-erp --port 8791 --label article
"$web" down --port 8791

node migration/tools/diff-crawls.mjs "$VERIFY_WEB_HOME/production" "$VERIFY_WEB_HOME/restored" \
  --out "$VERIFY_WEB_HOME/diff.csv"
```

Compare the number of HTML pages returning 200 and the sitemap totals. Compare status, title, main content, and images on the homepage, an about page, and a blog article. Asset URLs may change their dataset segment. Check that the new URLs load and that the article text and image match. Keep crawl output and response bodies outside Git. Record only counts and checksums from the archive.

Get separate approval before deleting the scratch dataset. For an approved recovery to a public replacement dataset, set `SANITY_DATASET` in the site build environment and rebuild. A private replacement requires authenticated builds. Review preview and Studio dataset settings separately before switching production.

## Reconnect project settings

The archive restores dataset content and asset binaries. Recreate webhooks, CORS origins, and API tokens from the project settings and secret store. Configure the restored dataset in Studio and deploy Studio separately if needed. Reconnect the site build trigger to the replacement dataset.

## Store verified copies

The proposed schedule is a nightly backup and a fresh export before bulk production writes. Store encrypted copies and their checksums in a private Cloudflare R2 bucket with a retention rule. Keep 30 daily copies and rehearse a restore quarterly. Record the approved schedule and destination in T64.
