import sys
import unittest
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib.assets import Assets
from lib.html_pt import parse
from lib.ids import Keys
from pages import build_page


class PageSeoTests(unittest.TestCase):
    def build(self, indexable, description=None):
        row = {'old_path': '/example', 'indexable': indexable, 'title': 'Example'}
        meta = {'id': 'example', 'title': 'Example', 'seoDescription': description}
        issues = []
        doc, _ = build_page(row, meta, [('richText', None, parse('<p>Visible content for this page.</p>'))],
                            Keys('/example'), None, Assets('/nonexistent-asset-map'), issues, {}, {}, set())
        return doc, issues

    def test_noindex_page_gets_a_description_from_its_content(self):
        doc, issues = self.build('no')
        self.assertEqual(doc['seo']['description'], 'Example Visible content for this page.')
        self.assertTrue(doc['seo']['noindex'])
        self.assertIn('seo-description-derived', {issue['kind'] for issue in issues})

    def test_existing_description_is_preserved(self):
        doc, _ = self.build('no', 'Original description.')
        self.assertEqual(doc['seo']['description'], 'Original description.')

    def test_missing_indexable_description_is_not_silently_filled(self):
        doc, issues = self.build('yes')
        self.assertNotIn('description', doc['seo'])
        self.assertIn('seo-description-missing', {issue['kind'] for issue in issues})


if __name__ == '__main__':
    unittest.main()
