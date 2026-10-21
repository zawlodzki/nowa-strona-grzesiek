import csv
import json
from urllib.parse import urlsplit

from .ids import doc_id

ORIGIN = 'https://www.zawlodzki.pl'
OWN_HOSTS = {'www.zawlodzki.pl', 'zawlodzki.pl'}
DOWNLOAD_HOST = 'files.zawlodzki.com'


class Links:
    """Classifies an href found in Webflow HTML.

    Own-site paths become references: posts by the post _id, pages by the page _id
    (weak, because T16 imports pages separately). Redirected paths follow url-map.csv
    first. A link with a fragment or query keeps its absolute URL, since internalLink
    has no anchor field.
    """

    def __init__(self, url_map_csv, pages_json, post_ids_by_path):
        self.rows = {row['old_path']: row for row in csv.DictReader(open(url_map_csv, newline=''))}
        pages = json.load(open(pages_json))['pages']
        self.page_ids = {p['path']: doc_id('page', p['id']) for p in pages if p.get('path') and not p.get('collectionId')}
        self.post_ids = post_ids_by_path

    def resolve(self, href, current_path):
        """Return ('internal', _id, weak) | ('external', url, None) | ('download', url, None) | ('unmapped', url, None)."""
        href = href.strip()
        if href.startswith('#'):
            return 'external', f'{ORIGIN}{current_path}{href}', None
        if href.startswith(('mailto:', 'tel:')):
            return 'external', href, None
        parts = urlsplit(href)
        if parts.netloc == DOWNLOAD_HOST:
            return 'download', href, None
        if parts.netloc and parts.netloc not in OWN_HOSTS:
            return 'external', href, None
        path = parts.path.rstrip('/') or '/'
        for _ in range(5):
            row = self.rows.get(path)
            if not row or row['action'] != 'redirect-301':
                break
            path = row['target'] or row['new_path_pl']
        absolute = ORIGIN + (path if path != '/' else '') + (f'?{parts.query}' if parts.query else '') + (f'#{parts.fragment}' if parts.fragment else '')
        if parts.query or parts.fragment:
            return 'external', absolute or ORIGIN, None
        if path in self.post_ids:
            return 'internal', self.post_ids[path], False
        row = self.rows.get(path)
        if row and row['action'] == 'keep' and path in self.page_ids:
            return 'internal', self.page_ids[path], True
        return 'unmapped', absolute, None
