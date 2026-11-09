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


class SectionExtractTests(unittest.TestCase):
    def sections(self, kind, html, path='/example'):
        row = {'old_path': path, 'indexable': 'no', 'title': 'Example'}
        meta = {'id': 'example', 'title': 'Example', 'seoDescription': 'Example.'}
        doc, _ = build_page(row, meta, [(kind, None, parse(html).elements()[0])],
                            Keys(path), None, Assets('/nonexistent-asset-map'), [], {}, {}, set())
        return doc['sections']

    @staticmethod
    def texts(body):
        return [(b.get('style'), ''.join(c.get('text', '') for c in b.get('children', []))) for b in body]

    def test_feature_keeps_subheadings_and_paragraphs_once(self):
        [section] = self.sections('feature', '<div class="feature-section"><div class="copy"><h1>Title</h1><p>One.</p><h2>Start</h2><p>Two.</p></div></div>')
        self.assertEqual(self.texts(section['body']), [('normal', 'One.'), ('h2', 'Start'), ('normal', 'Two.')])

    def test_quote_card_keeps_emphasis_in_the_quote_and_names_the_author(self):
        html = ('<div class="section"><h2>Opinie</h2><div class="w-layout-grid">'
                '<div class="testimonial-box"><div><p>"Chciałem <strong>lepiej pracować</strong>, polecam."</p></div>'
                '<div class="body-text m bold"><strong> - Jan Nowak</strong>, ACME</div></div>'
                '<div class="testimonial-box"><div><p>"Druga opinia."</p></div><div class="body-text m bold"><strong>- Ewa</strong></div></div>'
                '</div></div>')
        [section] = self.sections('contentSection', html)
        self.assertEqual([(i['title'], i['text']) for i in section['items']],
                         [('Jan Nowak, ACME', '"Chciałem lepiej pracować, polecam."'), ('Ewa', '"Druga opinia."')])

    def test_landing_contact_form_shows_details_when_live_has_them(self):
        with_details = '<div class="contact-section"><h2>Kontakt</h2><form></form><div><h3>Bezpośredni kontakt</h3></div></div>'
        self.assertTrue(self.sections('contactForm', with_details)[0]['showDetails'])
        self.assertFalse(self.sections('contactForm', '<div class="contact-section"><h2>Kontakt</h2><form></form></div>')[0]['showDetails'])

    def test_logo_strip_keeps_tagline_and_intro(self):
        html = ('<div class="testimonials-section"><div class="section-title"><div class="tagline">Z kim współpracuję</div>'
                '<h2>Firmy</h2><p class="body-text m">Od 2 do 500 osób.</p></div><div class="grid"></div></div>')
        [section] = self.sections('logoStrip', html)
        self.assertEqual((section['tagline'], section['title'], section['intro']), ('Z kim współpracuję', 'Firmy', 'Od 2 do 500 osób.'))

    def test_contact_form_intro_keeps_line_breaks(self):
        html = '<div class="contact-section"><div><h2>Kontakt</h2><p>Zacznijmy od rozmowy.<br/>Zarezerwuj 25 min.</p></div><form></form></div>'
        self.assertEqual(self.sections('contactForm', html)[0]['intro'], 'Zacznijmy od rozmowy.\nZarezerwuj 25 min.')

    def test_recent_posts_list_becomes_a_post_list(self):
        html = '<section class="blog-article"><div class="container"><h2>Ostatnie wpisy</h2><div class="w-dyn-list"><a href="/blog/a">A</a></div></div></section>'
        self.assertEqual(self.sections('richText', html, '/newsletter'),
                         [{'_type': 'postList', '_key': self.sections('richText', html, '/newsletter')[0]['_key'], 'heading': 'Ostatnie wpisy', 'kind': 'newsletter', 'limit': 3}])
        self.assertEqual(self.sections('richText', html, '/o-mnie')[0]['kind'], 'blog')


if __name__ == '__main__':
    unittest.main()
