"""Run with python3 -I migration/tools/import/assets_test.py."""

import contextlib
import hashlib
import importlib.util
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import sys
import tempfile
from threading import Thread
import unittest

SPEC = importlib.util.spec_from_file_location('asset_import', Path(__file__).with_name('assets.py'))
assets = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = assets
SPEC.loader.exec_module(assets)
CDN = 'https://cdn.prod.website-files.com/site/'
S3 = 'https://s3.amazonaws.com/webflow-prod-assets/site/'


class InventoryTests(unittest.TestCase):
    def test_structured_inputs_cover_variants_html_srcset_csv_and_s3(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'assets.json').write_text(json.dumps({'assets': [
                {'url': S3 + 'photo.png', 'altText': 'Opis z biblioteki',
                 'variants': [S3 + 'photo-p-500.png']},
                {'url': CDN + 'font.woff2'},
            ]}))
            (root / 'posts.json').write_text(json.dumps({'body':
                f'<img src="{S3}photo.png" alt="Opis użycia" srcset="{CDN}small.webp 400w, {CDN}large.webp 800w">'
            }))
            (root / 'crawl.csv').write_text(f'url,image\nhttps://example.org,"{CDN}last.svg"\n')
            found = assets.harvest(root)
            self.assertEqual(set(found), {S3 + 'photo.png', S3 + 'photo-p-500.png',
                                         CDN + 'font.woff2', CDN + 'small.webp', CDN + 'large.webp', CDN + 'last.svg'})
            self.assertEqual(found[S3 + 'photo.png'].alt, 'Opis użycia')
            self.assertFalse(found[S3 + 'photo.png'].alt_needs_review)
            self.assertEqual(found[S3 + 'photo-p-500.png'].alt, 'Opis z biblioteki')
            self.assertFalse(found[S3 + 'photo-p-500.png'].alt_needs_review)
            self.assertEqual(found[CDN + 'font.woff2'].kind, 'file')
            self.assertTrue(found[CDN + 'last.svg'].alt_needs_review)

    def test_compact_srcset_keeps_distinct_urls(self):
        self.assertEqual(assets.urls(CDN + 'a.png,' + CDN + 'b.png'),
                         {CDN + 'a.png', CDN + 'b.png'})

    def test_parentheses_in_filenames_survive_html_and_css(self):
        url = CDN + '1200x630%20(2).png'
        self.assertEqual(assets.urls(url), {url})
        self.assertEqual(assets.urls(f'<img src=\"{url}\">'), {url})
        self.assertEqual(assets.urls(f'background-image:url({url});color:red'), {url})
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'data.json').write_text(json.dumps({'url': url, 'body': f'<img src=\"{url}\">'}))
            self.assertEqual(set(assets.harvest(root)), {url})

    def test_only_allowlisted_asset_hosts_are_harvested(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'data.json').write_text(json.dumps([
                'https://s3.amazonaws.com/private-bucket/secret.png',
                'https://cdn.prod.website-files.com.evil.test/site/image.png',
                CDN + 'image(1).png',
            ]))
            self.assertEqual(set(assets.harvest(root)), {CDN + 'image(1).png'})

    def test_blank_alt_drafts_never_claim_visual_inspection(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'assets.json').write_text(json.dumps({'url': CDN + '1234567890abcdef12345678_CRM-funnel.png', 'altText': ''}))
            source = next(iter(assets.harvest(root).values()))
            self.assertEqual(source.alt, 'Grafika: CRM funnel')
            self.assertTrue(source.alt_needs_review)


class FileHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        data = b'content shared across two source URLs'
        self.send_response(200)
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *args):
        pass


class Dataset:
    project = 'fixtureproject'
    dataset = 'development'
    token = 'fixture-token'

    def __init__(self):
        self.documents = []
        self.uploads = 0

    def assets(self):
        return list(self.documents)

    def upload(self, kind, data, name, mime):
        digest = hashlib.sha1(data).hexdigest()
        self.uploads += 1
        doc = {'_id': f'image-{digest}-1x1-png', '_type': 'sanity.imageAsset',
               'sha1hash': digest, 'url': f'https://cdn.sanity.io/images/fixtureproject/development/{digest}-1x1.png'}
        self.documents.append(doc)
        return doc


class UploadTests(unittest.TestCase):
    def test_identical_bytes_upload_once_and_rerun_reuses_real_readback(self):
        server = ThreadingHTTPServer(('127.0.0.1', 0), FileHandler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                origin = f'http://127.0.0.1:{server.server_port}'
                sources = {origin + suffix: assets.AssetSource(origin + suffix, 'Opis', False, 'image')
                           for suffix in ['/one.png', '/two.png']}
                dataset = Dataset()
                with contextlib.redirect_stdout(None):
                    first = assets.upload_all(sources, dataset, root / 'map.json', root / 'cache', 2)
                    before = (root / 'map.json').read_bytes()
                    second = assets.upload_all(sources, dataset, root / 'map.json', root / 'cache', 2)
                self.assertEqual(first['uploaded'], 1)
                self.assertEqual(second['uploaded'], 0)
                self.assertEqual(dataset.uploads, 1)
                self.assertEqual((root / 'map.json').read_bytes(), before)
                self.assertTrue(assets.verify(sources, dataset, root / 'map.json', root / 'cache')['verified'])
                wrong_digest = 'b' * 40
                wrong_asset = {'_id': f'image-{wrong_digest}-1x1-png', '_type': 'sanity.imageAsset',
                               'sha1hash': wrong_digest, 'url': f'https://cdn.sanity.io/images/fixtureproject/development/{wrong_digest}-1x1.png'}
                dataset.documents.append(wrong_asset)
                mapping = json.loads((root / 'map.json').read_text())
                source = next(iter(sources.values()))
                mapping[source.url] = assets.map_entry(source, wrong_asset, wrong_digest, dataset)
                assets.atomic_json(root / 'map.json', mapping)
                with self.assertRaisesRegex(ValueError, 'Source content hash'):
                    assets.verify(sources, dataset, root / 'map.json', root / 'cache')
                dataset.documents.clear()
                with self.assertRaises(ValueError):
                    assets.verify(sources, dataset, root / 'map.json', root / 'cache')
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

    def test_production_refused_before_any_asset_upload(self):
        dataset = Dataset()
        dataset.dataset = 'production'
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with self.assertRaises(ValueError):
                assets.upload_all({}, dataset, root / 'map.json', root / 'cache', 1)
            self.assertEqual(dataset.uploads, 0)
            self.assertFalse((root / 'map.json').exists())

    def test_verification_rejects_wrong_dataset_and_stale_alt(self):
        source = assets.AssetSource(CDN + 'one.png', 'Opis', False, 'image')
        digest = 'a' * 40
        dataset = Dataset()
        document = {'_id': f'image-{digest}-1x1-png', '_type': 'sanity.imageAsset', 'sha1hash': digest,
                    'url': f'https://cdn.sanity.io/images/fixtureproject/development/{digest}-1x1.png'}
        entry = assets.map_entry(source, document, digest, dataset)
        remote = {document['_id']: document}
        entry['dataset'] = 'production'
        with self.assertRaises(ValueError):
            assets.validate_entry(source.url, entry, source, dataset, remote)
        entry['dataset'] = 'development'
        entry['alt'] = 'Old description'
        with self.assertRaises(ValueError):
            assets.validate_entry(source.url, entry, source, dataset, remote)


if __name__ == '__main__':
    unittest.main()
