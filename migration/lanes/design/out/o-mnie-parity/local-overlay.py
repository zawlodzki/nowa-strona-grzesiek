"""Read public production data; apply proposed mutations only in /tmp for local proof.
Usage: python3 -I migration/lanes/design/out/o-mnie-parity/local-overlay.py
No Sanity mutation requests are issued.
"""
import json
import urllib.parse
import urllib.request
from pathlib import Path

folder = Path(__file__).resolve().parent
query = '{"pages":*[_type=="page" && slug.current in ["/","/o-mnie"]],"testimonials":*[_type=="testimonial"],"assets":*[_type=="sanity.imageAsset"]{_id,url,"width":metadata.dimensions.width,"height":metadata.dimensions.height}}'
url = 'https://8u2zjhvn.api.sanity.io/v2025-02-19/data/query/production?' + urllib.parse.urlencode({'query': query})
with urllib.request.urlopen(url) as response:
    data = json.load(response)['result']
for mutation in json.loads((folder / 'production-patch.json').read_text())['mutations']:
    if 'createIfNotExists' in mutation:
        doc = mutation['createIfNotExists']
        if not any(item['_id'] == doc['_id'] for item in data['testimonials']):
            data['testimonials'].append(doc)
    if 'patch' in mutation:
        patch = mutation['patch']
        doc = next(item for item in data['pages'] + data['testimonials'] if item['_id'] == patch['id'])
        doc.update(patch['set'])
Path('/tmp/T34-overlay.json').write_text(json.dumps(data))
print('Local overlay: /tmp/T34-overlay.json (read-only public API + proposed patch)')
