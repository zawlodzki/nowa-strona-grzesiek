from pathlib import Path
import hashlib, json, re, sys
from urllib.parse import urlencode
from urllib.request import urlopen

root = Path(sys.argv[1]).resolve()
plan = json.loads(Path(__file__).with_name('plan.json').read_text())
query = '*[_type == "page" && language == "pl" && count(sections[_type == "hero"]) > 0]'
params = urlencode(dict(query=query, perspective='published'))
with urlopen(f'https://{plan["project"]}.api.sanity.io/v2025-02-19/data/query/{plan["dataset"]}?{params}', timeout=30) as response:
    source = json.load(response)['result']
pages = {p['slug']['current']: p for p in source}
assert set(pages) == set(plan['pages'])

def hero(path):
    heroes = [s for s in pages[path]['sections'] if s['_type'] == 'hero']
    assert len(heroes) == 1
    return heroes[0]

portrait = hero(plan['portraitReference'])['image']['asset']['_ref']
assets = []
for name, badge in plan['badges'].items():
    if file := badge.get('localFile'):
        contents = (root / 'assets' / file).read_bytes()
        width, height = map(int, re.search(rb'<svg width="(\d+)" height="(\d+)"', contents).groups())
        ref = f'image-{hashlib.sha1(contents).hexdigest()}-{width}x{height}-svg'
        badge['asset'] = ref
        assets.append(dict(_id=ref, url=f'http://127.0.0.1:8797/{file}', width=width, height=height))

def image(ref, alt):
    return dict(_type='contentImage', asset=dict(_type='reference', _ref=ref), alt=alt)

fields = ('image','badgeImage','badgeSize')
rows = []
changed = []
for path, target in plan['pages'].items():
    doc, section = pages[path], hero(path)
    before = {k: section[k] for k in fields if k in section}
    section['image'] = image(section['image']['asset']['_ref'] if target.get('keepPortrait') else portrait, plan['portraitAlt'])
    if name := target.get('badge'):
        badge = plan['badges'][name]
        section['badgeImage'] = image(badge['asset'], f'{name} logo')
        section['badgeSize'] = badge['size']
    elif not target.get('keepBadge'):
        assert 'badgeImage' not in section and 'badgeSize' not in section, path
    after = {k: section[k] for k in fields if k in section}
    if before != after:
        changed.append(doc)
    rows.append(dict(path=path, document=doc['_id'], key=section['_key'], before=before, after=after))
(root / 'overlay.json').write_text(json.dumps(dict(pages=changed, testimonials=[], assets=assets)))
(root / 'changes.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n')
print(f'{len(rows)} hero blocks, {len(changed)} proposed document changes, {len(assets)} new assets')
