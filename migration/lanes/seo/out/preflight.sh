#!/usr/bin/env bash
set -euo pipefail

repo=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
cd "$repo"
test -f migration/00-inventory/live-site/urls.json
scratch=$(mktemp -d "${TMPDIR:-/tmp}/t20-preflight.XXXXXX")
origin=https://zawlodzki-web.zawlodzki.workers.dev
printf 'Private evidence directory: %s\n' "$scratch"
git rev-parse HEAD > "$scratch/revision.txt"

node migration/tools/crawl.mjs --origin "$origin" --canonical-origin https://www.zawlodzki.pl --out "$scratch/staging"
diff_status=0
node migration/tools/diff-crawls.mjs migration/00-inventory/live-site "$scratch/staging" --out "$scratch/diff.csv" || diff_status=$?
test "$diff_status" -le 1
python3 -I migration/tools/jsonld_audit.py "$scratch/staging" > "$scratch/jsonld.log"

python3 -B -I migration/tools/import/posts.py build --out "$scratch/posts.ndjson" --report "$scratch/posts-report.json" > "$scratch/posts.log"
python3 -B -I migration/tools/import/pages.py build --out "$scratch/pages.ndjson" --report "$scratch/pages-report.json" > "$scratch/pages.log"

python3 -I - <<'PY' > "$scratch/keep-paths.txt"
import csv
with open('migration/contracts/url-map.csv') as source:
    for row in csv.DictReader(source):
        if row['action'] == 'keep':
            print(row['old_path'])
PY

printf 'path\tstatus\n' > "$scratch/keep-probes.tsv"
while IFS= read -r path; do
  status=$(curl --silent --show-error --max-time 30 --output /dev/null --write-out '%{http_code}' "$origin$path")
  printf '%s\t%s\n' "$path" "$status" >> "$scratch/keep-probes.tsv"
done < "$scratch/keep-paths.txt"

query='{"pages":count(*[_type=="page"]),"posts":count(*[_type=="post"]),"person":count(*[_type=="person"]),"services":count(*[_type=="service"]),"images":count(*[_type=="sanity.imageAsset"]),"files":count(*[_type=="sanity.fileAsset"])}'
for dataset in production development; do
  curl --fail --silent --show-error --get --data-urlencode "query=$query" --data-urlencode 'perspective=published' \
    "https://8u2zjhvn.api.sanity.io/v2025-02-19/data/query/$dataset" > "$scratch/$dataset-counts.json"
done

python3 -I - "$scratch" <<'PY'
import collections
import csv
import json
from pathlib import Path
import sys

evidence = Path(sys.argv[1])
with (evidence / 'diff.csv').open() as source:
    differences = collections.Counter(row['field'] for row in csv.DictReader(source))
with (evidence / 'keep-probes.tsv').open() as source:
    statuses = collections.Counter(row['status'] for row in csv.DictReader(source, delimiter='\t'))
crawl = json.loads((evidence / 'staging/urls.json').read_text())
audit = json.loads((evidence / 'staging/jsonld-audit.json').read_text())
summary = {
    'crawlUrls': len(crawl),
    'keepStatuses': dict(statuses),
    'diffFields': dict(differences),
    'pagesWithJsonld': audit['pages_with_jsonld'],
    'datasets': {dataset: json.loads((evidence / f'{dataset}-counts.json').read_text())['result'] for dataset in ['production', 'development']},
    'verdict': 'Preflight only. G3 also requires a successful content build, reviewed differences and six mobile Lighthouse reports.',
}
(evidence / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n')
print(json.dumps(summary, indent=2))
PY
