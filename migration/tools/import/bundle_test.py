import hashlib
import io
import json
from pathlib import Path
import sys
import tarfile
import tempfile
import unittest

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from bundle import audit


class BundleTests(unittest.TestCase):
    def archive(self, directory, *, corrupt=False, reference=None, marker=None):
        content = b'asset bytes'
        sha1 = hashlib.sha1(content).hexdigest()
        relative = f'images/{sha1}-1x1.png'
        document = {'_id': 'page-1', '_type': 'page', 'language': 'pl', 'image': {'_sanityAsset': marker or f'image@file://./{relative}'}}
        if reference:
            document['reference'] = {'_ref': reference}
        entries = {
            'export/data.ndjson': json.dumps(document).encode() + b'\n',
            'export/assets.json': json.dumps({f'image-{sha1}': {'size': len(content)}}).encode(),
            f'export/{relative}': b'wrong bytes' if corrupt else content,
        }
        path = Path(directory) / 'bundle.tar.gz'
        with tarfile.open(path, 'w:gz') as archive:
            for name, payload in entries.items():
                info = tarfile.TarInfo(name)
                info.size = len(payload)
                archive.addfile(info, io.BytesIO(payload))
        return path

    def test_native_hash_only_metadata_keys_resolve_dimensioned_asset_filenames(self):
        with tempfile.TemporaryDirectory() as directory:
            report = audit(self.archive(directory))
        self.assertEqual(report['documents'], 1)
        self.assertEqual(report['assets'], 1)
        self.assertEqual(report['referencedAssets'], 1)
        self.assertTrue(report['integrityVerified'])

    def test_corrupt_asset_bytes_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(ValueError, 'content hash or size'):
                audit(self.archive(directory, corrupt=True))

    def test_dangling_document_reference_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(ValueError, 'outside the bundle'):
                audit(self.archive(directory, reference='missing-page'))

    def test_asset_path_outside_export_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(ValueError, 'local export path'):
                audit(self.archive(directory, marker='image@file://../private.png'))


if __name__ == '__main__':
    unittest.main()
