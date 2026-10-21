import json
from pathlib import Path


class Assets:
    """Source image URL to Sanity image value.

    T17 writes asset-map.json as {"<source url>": {"assetId": "image-...", "alt": "..."}}.
    A URL the map does not cover yet is uploaded by `sanity dataset import` through
    `_sanityAsset`. Sanity derives asset ids from the file hash, so both paths end on
    the same asset.
    """

    def __init__(self, map_path):
        path = Path(map_path)
        self.map = json.loads(path.read_text()) if path.exists() else {}
        self.mapped = 0
        self.unmapped = 0

    def image(self, type_, url, alt, key=None, caption=None):
        entry = self.map.get(url)
        if isinstance(entry, str):
            entry = {'assetId': entry}
        value = {'_type': type_}
        if key:
            value['_key'] = key
        if entry:
            self.mapped += 1
            value['asset'] = {'_type': 'reference', '_ref': entry['assetId']}
            alt = alt or entry.get('alt') or ''
        else:
            self.unmapped += 1
            value['_sanityAsset'] = f'image@{url}'
        value['alt'] = alt
        if caption:
            value['caption'] = caption
        return value
