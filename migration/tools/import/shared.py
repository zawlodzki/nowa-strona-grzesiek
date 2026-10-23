"""Build shared Sanity documents from the entity contract and imported PL pages.

The payload stays in gitignored dist/. This command never writes to Sanity.
"""
import argparse
import csv
import hashlib
import json
import sys
from pathlib import Path
from urllib.parse import urlsplit

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib.assets import Assets
from lib.html_pt import parse
from lib.ids import Keys
from pages import ROOT, clean, compact, first, text, walk


def entity_documents(entities, assets):
    person = entities['person']
    organization = entities['organization']
    person_doc = {k: v for k, v in person.items() if not k.startswith('@') and k not in {'image', 'worksFor'}}
    person_doc.update({
        '_id': 'person', '_type': 'person', 'jsonldId': person['@id'],
        'image': assets.image('contentImage', person['image']['url'], person['image'].get('caption') or person['name']),
        'worksFor': {'_type': 'reference', '_ref': 'organization'},
    })
    organization_doc = {k: v for k, v in organization.items() if not k.startswith('@') and k not in {'logo', 'founder', 'address', 'contactPoint', 'identifier', 'areaServed'}}
    keys = Keys('organization')
    organization_doc.update({
        '_id': 'organization', '_type': 'organization', 'jsonldId': organization['@id'],
        'logo': assets.image('contentImage', organization['logo']['url'], organization['name']),
        'founder': {'_type': 'reference', '_ref': 'person'},
        'areaServed': organization['areaServed']['name'],
        'identifier': [{'_type': 'propertyValue', '_key': keys(), 'propertyID': value['propertyID'], 'value': value['value']} for value in organization.get('identifier', [])],
    })
    for field, type_ in [('address', 'postalAddress'), ('contactPoint', 'contactPoint')]:
        organization_doc[field] = {'_type': type_, **{k: v for k, v in organization[field].items() if not k.startswith('@')}}
    return [person_doc, organization_doc]


def menu(root, class_name, rows):
    container = first(root, lambda node: class_name in node.classes())
    if container is None:
        raise ValueError(f'Missing shared {class_name} in source HTML')
    keys, result, seen = Keys(class_name), [], set()
    for node in walk(container):
        if node.tag != 'a' or 'alert-banner-2' in node.classes():
            continue
        label, href = clean(text(node)), node.attrs.get('href', '')
        if not label or not href or href == '#':
            continue
        parts = urlsplit(href)
        if not parts.netloc or parts.netloc in {'www.zawlodzki.pl', 'zawlodzki.pl'}:
            path = parts.path.rstrip('/') or '/'
            row = rows.get(path)
            if row and row['action'] == 'redirect-301':
                path = row['target'] or row['new_path_pl']
                row = rows.get(path)
            if not row or row['action'] != 'keep':
                continue
            href = path + (f'?{parts.query}' if parts.query else '') + (f'#{parts.fragment}' if parts.fragment else '')
        if (label, href) not in seen:
            result.append({'_type': 'link', '_key': keys(), 'label': label, 'href': href})
            seen.add((label, href))
    if not result:
        raise ValueError(f'Empty shared {class_name}')
    return result


def build(args):
    rows = {row['old_path']: row for row in csv.DictReader((ROOT / 'migration/contracts/url-map.csv').open())}
    pages = {doc['slug']['current']: doc for doc in map(json.loads, Path(args.pages).read_text().splitlines()) if doc['_type'] == 'page'}
    assets = Assets(args.asset_map)
    entities = json.loads((ROOT / 'migration/contracts/entities.json').read_text())
    docs = entity_documents(entities, assets)
    for path, row in sorted(rows.items()):
        if row['action'] != 'keep' or row['page_type'] != 'service':
            continue
        page = pages[path]
        docs.append({
            '_id': 'service-' + page['_id'].removeprefix('page-'), '_type': 'service',
            'name': page['title'], 'description': page['seo']['description'],
            'page': {'_type': 'reference', '_ref': page['_id']},
            'provider': {'_type': 'reference', '_ref': 'person'}, 'areaServed': 'Polska',
        })
    root = parse((ROOT / 'migration/00-inventory/live-site/html/index.html').read_text())
    docs.append({
        '_id': 'siteSettings-pl', '_type': 'siteSettings', 'language': 'pl',
        'nav': menu(root, 'navbar', rows), 'footer': menu(root, 'footer-2', rows),
        'defaultSeo': pages['/']['seo'],
    })
    if assets.unmapped:
        raise ValueError('Shared entity images must resolve through the asset map before import')
    payload = ''.join(json.dumps(compact(doc), ensure_ascii=False, sort_keys=True) + '\n' for doc in sorted(docs, key=lambda doc: doc['_id']))
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(payload)
    print(json.dumps({'documents': len(docs), 'services': sum(doc['_type'] == 'service' for doc in docs), 'sha256': hashlib.sha256(payload.encode()).hexdigest()}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pages', default=ROOT / 'migration/lanes/migration/out/dist/pages.ndjson')
    parser.add_argument('--asset-map', default=ROOT / 'migration/lanes/migration/out/asset-map.json')
    parser.add_argument('--out', default=ROOT / 'migration/lanes/migration/out/dist/shared.ndjson')
    build(parser.parse_args())
