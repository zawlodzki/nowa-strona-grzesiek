"""Build and verify a public CDN asset map. Uploads require SANITY_API_TOKEN.

    python3 -I migration/tools/import/assets.py plan
    python3 -I migration/tools/import/assets.py upload --dataset development
    python3 -I migration/tools/import/assets.py verify --dataset development

Only the flat map is public output. Downloaded bytes and inventory context stay in
--cache-dir. Production uploads are intentionally refused.
"""

import argparse
import csv
import hashlib
import html
from html.parser import HTMLParser
import json
import mimetypes
import os
from pathlib import Path
import re
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urlencode, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[3]
CDN = re.compile(r'https?://(?:(?:[A-Za-z0-9-]+\.)*(?:website-files\.com|uploads-ssl\.webflow\.com)/|s3\.amazonaws\.com/webflow-prod-assets/)[^\s<>"\'`\\,;\]}]+')
IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg'}
ASSET_ID = re.compile(r'^(image-[a-f0-9]{40}-\d+x\d+-[a-z0-9]+|file-[a-f0-9]{40}-[a-z0-9]+)$')


@dataclass(frozen=True)
class AssetSource:
    url: str
    alt: str
    alt_needs_review: bool
    kind: str


def urls(text):
    text = html.unescape(text.replace('\\/', '/'))
    parsed = urlsplit(text) if not re.search(r'[\s<>\"\']|,https?://', text) else None
    if parsed and parsed.scheme in {'http', 'https'} and parsed.hostname:
        host = parsed.hostname
        if host == 'website-files.com' or host.endswith('.website-files.com') or host == 'uploads-ssl.webflow.com' or (host == 's3.amazonaws.com' and parsed.path.startswith('/webflow-prod-assets/')):
            return {text}
    found = set()
    for match in CDN.finditer(text):
        url = match.group().rstrip('.,;')
        while url.endswith(')') and url.count(')') > url.count('('):
            url = url[:-1]
        found.add(url)
    return found


def draft_alt(url):
    name = unquote(Path(urlsplit(url).path).stem)
    name = re.sub(r'^[a-fA-F0-9]{20,}_', '', name)
    name = re.sub(r'[-_]+', ' ', name)
    name = re.sub(r'\b(?:p \d+|\d+x\d+)\b', '', name)
    name = ' '.join(name.split())
    return f'Grafika: {name}' if name else 'Grafika do uzupełnienia opisu'


class Images(HTMLParser):
    def __init__(self, add):
        super().__init__(convert_charrefs=True)
        self.add = add

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'img':
            for field in ('src', 'srcset', 'data-src', 'data-srcset'):
                for url in urls(attrs.get(field, '')):
                    self.add(url, attrs.get('alt'), 3)


def harvest(inventory):
    found = set()
    alts = {}

    def add(url, alt=None, priority=0):
        found.add(url)
        if isinstance(alt, str) and alt.strip():
            candidate = (priority, ' '.join(alt.split()))
            if candidate > alts.get(url, (-1, '')):
                alts[url] = candidate

    def text(value):
        for url in urls(value):
            add(url)
        if '<img' in value.lower():
            Images(add).feed(value)

    def walk(value):
        if isinstance(value, dict):
            if isinstance(value.get('url'), str):
                for url in urls(value['url']):
                    add(url, value.get('alt') or value.get('altText'), 2)
                for variant in value.get('variants') or []:
                    if isinstance(variant, str):
                        for url in urls(variant):
                            add(url, value.get('alt') or value.get('altText'), 1)
            for v in value.values():
                walk(v)
        elif isinstance(value, list):
            for v in value:
                walk(v)
        elif isinstance(value, str):
            text(value)

    for path in sorted(Path(inventory).rglob('*')):
        if not path.is_file() or '.git' in path.parts:
            continue
        if path.suffix == '.json':
            walk(json.loads(path.read_text()))
        elif path.suffix == '.csv':
            with path.open(newline='') as handle:
                for row in csv.reader(handle):
                    for cell in row:
                        text(cell)
        elif path.suffix in {'.html', '.xml', '.txt', '.js', '.md'}:
            text(path.read_text())
    return {
        url: AssetSource(
            url,
            alts[url][1] if url in alts else draft_alt(url),
            url not in alts,
            'image' if Path(urlsplit(url).path).suffix.lower() in IMAGE_EXTENSIONS else 'file',
        )
        for url in sorted(found)
    }


def atomic_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(dir=path.parent, prefix=path.name + '.')
    try:
        with os.fdopen(fd, 'w') as handle:
            json.dump(value, handle, ensure_ascii=False, indent=2, sort_keys=True)
            handle.write('\n')
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


class Sanity:
    def __init__(self, project, dataset, token=None):
        if not re.fullmatch(r'[a-z0-9]+', project) or not re.fullmatch(r'[a-z0-9_-]+', dataset):
            raise ValueError('Invalid project or dataset')
        self.project = project
        self.dataset = dataset
        self.token = token
        self.base = f'https://{project}.api.sanity.io/v2026-03-01'

    def request(self, path, data=None, mime=None):
        headers = {'Authorization': f'Bearer {self.token}'} if self.token else {}
        if mime:
            headers['Content-Type'] = mime
        req = Request(self.base + path, data=data, headers=headers)
        with urlopen(req, timeout=120) as response:
            return json.load(response)

    def assets(self):
        query = '*[_type in ["sanity.imageAsset", "sanity.fileAsset"]]{_id,_type,sha1hash,url}'
        return self.request(f'/data/query/{self.dataset}?' + urlencode({'query': query}))['result']

    def upload(self, kind, data, name, mime):
        if self.dataset == 'production':
            raise ValueError('Production uploads require a separate, approved cutover action')
        if not self.token:
            raise ValueError('Set SANITY_API_TOKEN for uploads')
        path = f'/assets/{"images" if kind == "image" else "files"}/{self.dataset}?'
        return self.request(path + urlencode({'filename': name}), data, mime)['document']


def download(source, cache):
    key = hashlib.sha256(source.url.encode()).hexdigest()
    path = cache / key
    if path.exists():
        data = path.read_bytes()
    else:
        with urlopen(Request(source.url, headers={'User-Agent': 'zawlodzki-migration/1'}), timeout=120) as response:
            data = response.read()
        fd, temporary = tempfile.mkstemp(dir=cache, prefix=key + '.')
        with os.fdopen(fd, 'wb') as handle:
            handle.write(data)
        os.replace(temporary, path)
    if not data:
        raise ValueError('CDN returned an empty asset')
    return hashlib.sha1(data).hexdigest(), path


def map_entry(source, asset, digest, client):
    return {
        'assetId': asset['_id'], 'url': asset['url'], 'sha1': digest,
        'kind': source.kind, 'alt': source.alt if source.kind == 'image' else '',
        'altNeedsReview': source.alt_needs_review if source.kind == 'image' else False,
        'projectId': client.project, 'dataset': client.dataset,
    }


def validate_entry(url, entry, source, client, remote):
    if not isinstance(entry, dict) or not ASSET_ID.fullmatch(entry.get('assetId', '')):
        raise ValueError('Map contains an invalid asset ID')
    if entry.get('projectId') != client.project or entry.get('dataset') != client.dataset:
        raise ValueError('Map targets a different project or dataset')
    asset = remote.get(entry['assetId'])
    if not asset or entry.get('sha1') != asset.get('sha1hash'):
        raise ValueError('Map asset is missing or has a different content hash')
    if entry.get('url') != asset.get('url') or entry.get('kind') != source.kind:
        raise ValueError('Map URL or asset kind does not match')
    if asset.get('_type') != f'sanity.{source.kind}Asset':
        raise ValueError('Map asset has the wrong Sanity type')
    if source.kind == 'image' and (entry.get('alt') != source.alt or entry.get('altNeedsReview') is not source.alt_needs_review):
        raise ValueError('Image alt text or review flag differs from inventory plan')


def upload_all(sources, client, out, cache, workers):
    if client.dataset == 'production' or not client.token:
        raise ValueError('Upload requires SANITY_API_TOKEN and a non-production dataset')
    cache.mkdir(parents=True, exist_ok=True)
    remote = client.assets()
    by_hash = {(a['_type'], a['sha1hash']): a for a in remote}
    mapping = json.loads(out.read_text()) if out.exists() else {}
    by_id = {a['_id']: a for a in remote}
    for url, entry in mapping.items():
        if url in sources:
            validate_entry(url, entry, sources[url], client, by_id)
    groups = {}
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(download, source, cache): source for source in sources.values()}
        for future in as_completed(futures):
            source = futures[future]
            try:
                digest, path = future.result()
            except (HTTPError, URLError, OSError, ValueError) as error:
                key = hashlib.sha256(source.url.encode()).hexdigest()
                status = getattr(error, 'code', type(error).__name__)
                raise ValueError(f'CDN download failed for source sha256 {key}, status {status}') from None
            groups.setdefault((source.kind, digest), {'path': path, 'sources': []})['sources'].append(source)
    uploaded = 0
    reused = 0

    def resolve(key, group):
        kind, digest = key
        asset = by_hash.get((f'sanity.{kind}Asset', digest))
        existed = asset is not None
        if asset is None:
            name = unquote(Path(urlsplit(group['sources'][0].url).path).name)
            mime = mimetypes.guess_type(name)[0] or 'application/octet-stream'
            asset = client.upload(kind, group['path'].read_bytes(), name, mime)
        if asset.get('sha1hash') != digest:
            raise ValueError('Sanity returned a different content hash')
        return key, group, asset, existed

    mapping = {url: value for url, value in mapping.items() if url in sources}
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = [pool.submit(resolve, key, group) for key, group in groups.items()]
        for future in as_completed(futures):
            key, group, asset, existed = future.result()
            reused += int(existed)
            uploaded += int(not existed)
            for source in group['sources']:
                mapping[source.url] = map_entry(source, asset, key[1], client)
            atomic_json(out, mapping)
            print(json.dumps({'mapped': len(mapping), 'total': len(sources), 'uploaded': uploaded, 'reused': reused}), flush=True)
    return {'urls': len(sources), 'uniqueContent': len(groups), 'uploaded': uploaded, 'reused': reused}


def verify(sources, client, out, cache):
    mapping = json.loads(out.read_text())
    if set(mapping) != set(sources):
        raise ValueError(f'Coverage mismatch: {len(set(sources) - set(mapping))} missing, {len(set(mapping) - set(sources))} extra')
    remote = {a['_id']: a for a in client.assets()}
    cache.mkdir(parents=True, exist_ok=True)
    for url, source in sources.items():
        validate_entry(url, mapping[url], source, client, remote)
        digest, _ = download(source, cache)
        if digest != mapping[url]['sha1']:
            raise ValueError('Source content hash differs from mapped Sanity asset')
    return {
        'urls': len(mapping), 'assets': len({v['assetId'] for v in mapping.values()}),
        'images': sum(v['kind'] == 'image' for v in mapping.values()),
        'files': sum(v['kind'] == 'file' for v in mapping.values()),
        'altNeedsReview': sum(v['altNeedsReview'] for v in mapping.values()),
        'missing': 0, 'verified': True,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('command', choices=['plan', 'build', 'upload', 'verify'])
    parser.add_argument('--inventory', type=Path, default=ROOT / 'migration/00-inventory')
    parser.add_argument('--out', type=Path, default=ROOT / 'migration/lanes/migration/out/asset-map.json')
    parser.add_argument('--project', default='8u2zjhvn')
    parser.add_argument('--dataset', default='development')
    parser.add_argument('--cache-dir', type=Path, default=Path(tempfile.gettempdir()) / 'zawlodzki-assets')
    parser.add_argument('--workers', type=int, default=6)
    args = parser.parse_args()
    if not args.inventory.is_dir():
        parser.error('Inventory directory is missing')
    if not 1 <= args.workers <= 16:
        parser.error('--workers must be between 1 and 16')
    try:
        sources = harvest(args.inventory)
        if not sources:
            raise ValueError('Inventory contains no CDN assets')
        client = Sanity(args.project, args.dataset, os.environ.get('SANITY_API_TOKEN'))
        if args.command in {'plan', 'build'}:
            result = {'urls': len(sources), 'images': sum(s.kind == 'image' for s in sources.values()),
                      'files': sum(s.kind == 'file' for s in sources.values()),
                      'altNeedsReview': sum(s.alt_needs_review and s.kind == 'image' for s in sources.values())}
        elif args.command == 'upload':
            result = upload_all(sources, client, args.out, args.cache_dir, args.workers)
        else:
            result = verify(sources, client, args.out, args.cache_dir)
        print(json.dumps(result, sort_keys=True))
        return 0
    except HTTPError as error:
        print(f'Asset request failed with HTTP {error.code}; no credentials or response body logged', file=sys.stderr)
    except URLError:
        print('Asset request failed to connect', file=sys.stderr)
    except (ValueError, OSError, KeyError) as error:
        if isinstance(error, ValueError):
            print(str(error), file=sys.stderr)
        else:
            print(f'Asset operation failed ({type(error).__name__}); inspect inputs and map locally', file=sys.stderr)
    return 1


if __name__ == '__main__':
    sys.exit(main())
