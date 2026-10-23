"""Webflow blog items to Sanity `post` documents.

  python3 -I migration/tools/import/posts.py build
  python3 -I migration/tools/import/posts.py import development
  python3 -I migration/tools/import/posts.py snapshot development <out.json>

`build` is pure: the same inventory and asset map give a byte-identical ndjson.
`import` refuses `production`; the first production write needs the owner's yes
and is run by hand with `sanity dataset import`.
"""
import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib.assets import Assets  # noqa: E402
from lib.html_pt import Converter, parse, squash  # noqa: E402
from lib.ids import Keys, doc_id  # noqa: E402
from lib.links import Links  # noqa: E402

ROOT = Path(__file__).resolve().parents[3]
INVENTORY = ROOT / 'migration/00-inventory/webflow'
OUT = ROOT / 'migration/lanes/migration/out'
# Gitignored (`dist/`): the ndjson carries whole inventory records and this repo is public.
NDJSON = OUT / 'dist/posts.ndjson'
REPORT = OUT / 'posts-report.json'
ASSET_MAP = OUT / 'asset-map.json'
FAQ_PAIRS = 7
CTA_HREF = '/kontakt'
SEO_LIMITS = {'title': 60, 'description': 160}
SYSTEM_FIELDS = {'_rev', '_createdAt', '_updatedAt'}


def kind_names():
    schema = json.load(open(INVENTORY / 'cms/blog.schema.json'))['collection']
    field = next(f for f in schema['fields'] if f['slug'] == 'typ-wpisu')
    return {o['id']: o['name'].lower() for o in field['validations']['options']}


def schema_extras(raw, issue):
    """json-ld-extra to typed schemaExtras. HowTo and offers have no typed home and are dropped on purpose."""
    if not raw:
        return None
    data = json.loads(raw)
    software, items = [], []
    for node in data.get('@graph', [data]):
        kind = node.get('@type')
        if kind == 'SoftwareApplication':
            software.append(software_item(node))
            if node.get('offers'):
                issue('schema-extras-dropped', 'SoftwareApplication.offers')
        elif kind == 'ItemList':
            for element in node.get('itemListElement', []):
                item = element.get('item') or {}
                entry = {'name': item.get('name') or element.get('name')}
                if item.get('url') or element.get('url'):
                    entry['url'] = item.get('url') or element.get('url')
                if element.get('description'):
                    entry['description'] = element['description']
                items.append(entry)
                if item.get('@type') == 'SoftwareApplication':
                    software.append(software_item(item))
        else:
            issue('schema-extras-dropped', kind)
    extras = {'_type': 'schemaExtras'}
    keys = Keys(f'schemaExtras:{raw}')
    if software:
        extras['softwareMentioned'] = [{'_type': 'software', '_key': keys(), **s} for s in software]
    if items:
        extras['itemList'] = [{'_type': 'listItem', '_key': keys(), **i} for i in items]
    return extras if len(extras) > 1 else None


def software_item(node):
    out = {'name': node['name']}
    if node.get('url'):
        out['url'] = node['url']
    if node.get('applicationCategory'):
        out['applicationCategory'] = node['applicationCategory']
    return out


def dense(text):
    return re.sub(r'\s+', '', text)


def portable_text_text(blocks):
    parts = []
    for b in blocks:
        if b['_type'] == 'block':
            parts.extend(c['text'] for c in b['children'])
        elif b['_type'] == 'table':
            parts.extend(c for row in b['rows'] for c in row['cells'])
        elif b['_type'] == 'image':
            parts.append(b.get('caption', ''))
        elif b['_type'] == 'download':
            parts.append(b['label'])
    return ''.join(parts)


def build_post(item, kinds, links, assets, issues, stats):
    f = item['fieldData']
    _id = doc_id('post', item['id'])
    path = f'/blog/{f["slug"]}'

    def issue(kind, detail=''):
        issues.append({'slug': f['slug'], 'kind': kind, 'detail': detail})

    keys = Keys(_id)
    convert = Converter(keys, links, assets, path, issue)
    body = convert.convert(f['body'])

    faq = []
    for n in range(1, FAQ_PAIRS + 1):
        q, a = (f.get(f'pytanie-{n}') or '').strip(), f.get(f'odpowiedz-{n}')
        if bool(q) != bool(a and a.strip()):
            issue('faq-half-pair', f'pair {n}')
        if q and a:
            faq.append({'_type': 'postFaqItem', '_key': keys(), 'q': squash(q), 'a': convert.convert(a)})

    post = {
        '_id': _id, '_type': 'post', 'language': 'pl',
        'title': squash(f['name']).strip(),
        'slug': {'_type': 'slug', 'current': path},
        'excerpt': squash(f.get('excerpt') or '').strip(),
        'body': body,
    }
    for field, source in (('mainImage', 'main-image'), ('thumbnail', 'thumbnail')):
        image = f.get(source)
        if image and image.get('url'):
            post[field] = assets.image('contentImage', image['url'], squash(image.get('alt') or '').strip())
            if not post[field]['alt']:
                issue('image-alt-missing', f'{field} {image["url"]}')
    post['publishedAt'] = f['published-at']
    if f.get('updated-at'):
        if f['updated-at'] >= f['published-at']:
            post['updatedAt'] = f['updated-at']
        else:
            issue('updated-before-published', f['updated-at'])
    kind = kinds.get(f.get('typ-wpisu'))
    if not kind:
        issue('kind-defaulted', 'typ-wpisu empty, imported as blog')
    post['kind'] = kind or 'blog'
    if f.get('reading-time'):
        post['readingTime'] = int(f['reading-time'])
    if (f.get('cta-text') or '').strip():
        post['cta'] = {'_type': 'link', 'label': squash(f['cta-text']).strip(), 'href': CTA_HREF}
    if faq:
        post['faq'] = faq
    extras = schema_extras(f.get('json-ld-extra'), issue)
    if extras:
        post['schemaExtras'] = extras
    seo = {'_type': 'seo', 'title': links.rows[path]['title'], 'description': squash(f.get('seo-description') or f.get('excerpt') or '').strip(), 'noindex': False}
    for field, limit in SEO_LIMITS.items():
        if len(seo[field]) > limit:
            issue(f'seo-{field}-too-long', f'{len(seo[field])} > {limit}')
    post['seo'] = seo

    sources = [(f['body'], body)] + [(f[f'odpowiedz-{n}'], item['a']) for n, item in zip([n for n in range(1, FAQ_PAIRS + 1) if (f.get(f'pytanie-{n}') or '').strip() and f.get(f'odpowiedz-{n}')], faq)]
    for html, blocks in sources:
        if dense(parse(html).text()) != dense(portable_text_text(blocks)):
            raise ValueError(f'{path}: text differs between source HTML and Portable Text')

    for name, n in convert.stats.items():
        stats[name] = stats.get(name, 0) + n
    stats['faqItems'] = stats.get('faqItems', 0) + len(faq)
    return post


def build(args):
    items = json.load(open(INVENTORY / 'cms/blog.items.json'))['items']
    live = [i for i in items if not i.get('isDraft') and not i.get('isArchived')]
    post_ids = {f'/blog/{i["fieldData"]["slug"]}': doc_id('post', i['id']) for i in live}
    links = Links(ROOT / 'migration/contracts/url-map.csv', INVENTORY / 'pages.json', post_ids)
    assets = Assets(args.asset_map)
    kinds, issues, stats = kind_names(), [], {}
    posts = sorted((build_post(i, kinds, links, assets, issues, stats) for i in live), key=lambda p: p['_id'])

    lines = [json.dumps(p, ensure_ascii=False, separators=(',', ':')) for p in posts]
    text = '\n'.join(lines) + '\n'
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(text)
    by_kind = {}
    for i in issues:
        by_kind[i['kind']] = by_kind.get(i['kind'], 0) + 1
    report = {
        'source': {'items': len(items), 'live': len(live)},
        'posts': len(posts),
        'ndjsonSha256': hashlib.sha256(text.encode()).hexdigest(),
        'images': {'mapped': assets.mapped, 'pendingUpload': assets.unmapped},
        'websiteFilesRefsOutsideUploads': sum(line.replace('"_sanityAsset":"image@https://cdn.prod.website-files.com', '').count('website-files.com') for line in lines),
        'stats': dict(sorted(stats.items())),
        'issuesByKind': dict(sorted(by_kind.items())),
        'issues': issues,
    }
    Path(args.report).write_text(json.dumps(report, ensure_ascii=False, indent=1) + '\n')
    print(json.dumps({k: v for k, v in report.items() if k != 'issues'}, ensure_ascii=False, indent=1))


def sanity(*argv, capture=False):
    return subprocess.run(['npx', 'sanity', *argv], cwd=ROOT / 'apps/studio', check=True, text=True, capture_output=capture)


def import_(args):
    if args.dataset == 'production':
        sys.exit('Refusing to write production. The first production write needs the owner\'s explicit yes (AGENTS.md).')
    sanity('dataset', 'import', str(Path(args.ndjson).resolve()), '--dataset', args.dataset, '--replace')


def snapshot(args):
    """Every post document as stored, without system fields, plus one hash over all of them."""
    result = sanity('documents', 'query', '*[_type == "post"] | order(_id asc)', '--dataset', args.dataset, '--api-version', '2026-10-21', capture=True)
    docs = [{k: v for k, v in d.items() if k not in SYSTEM_FIELDS} for d in json.loads(result.stdout)]
    canonical = json.dumps(docs, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
    out = {
        'dataset': args.dataset, 'posts': len(docs),
        'sha256': hashlib.sha256(canonical.encode()).hexdigest(),
        'websiteFilesRefs': canonical.count('website-files.com'),
        'sanityAssetPlaceholders': canonical.count('_sanityAsset'),
        'perDocument': {d['_id']: hashlib.sha256(json.dumps(d, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:16] for d in docs},
    }
    Path(args.out).write_text(json.dumps(out, indent=1) + '\n')
    print(json.dumps({k: v for k, v in out.items() if k != 'perDocument'}, indent=1))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='command', required=True)
    b = sub.add_parser('build')
    b.add_argument('--asset-map', default=ASSET_MAP)
    b.add_argument('--out', default=NDJSON)
    b.add_argument('--report', default=REPORT)
    i = sub.add_parser('import')
    i.add_argument('dataset')
    i.add_argument('--ndjson', default=NDJSON)
    s = sub.add_parser('snapshot')
    s.add_argument('dataset')
    s.add_argument('out')
    args = parser.parse_args()
    {'build': build, 'import': import_, 'snapshot': snapshot}[args.command](args)


if __name__ == '__main__':
    main()
