"""Kept static Webflow pages to Sanity `page` documents with `sections[]`.

  python3 -I migration/tools/import/pages.py build
  python3 -I migration/tools/import/pages.py import development
  python3 -I migration/tools/import/pages.py snapshot development <out.json>

The section sequence and block type come from the Webflow page trees
(`components.json` pageSections, matched with blocks.json `match` rules). The
content comes from the live HTML of the same page, whose top-level sections line
up one to one with the tree. Pages without a tree (legal) are read from the live
HTML alone, thank-you pages from `page-content/`.

`build` is pure and fails when a page's sections do not line up. Text that a
block has no field for is listed per section in the report under `textLoss`.
"""
import argparse
import csv
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib.assets import Assets  # noqa: E402
from lib.html_pt import Converter, Node, parse, squash  # noqa: E402
from lib.ids import Keys, doc_id  # noqa: E402
from lib.links import Links  # noqa: E402

ROOT = Path(__file__).resolve().parents[3]
INVENTORY = ROOT / 'migration/00-inventory'
CONTRACTS = ROOT / 'migration/contracts'
OUT = ROOT / 'migration/lanes/migration/out'
# Gitignored (`dist/`): the ndjson carries whole inventory records and this repo is public.
NDJSON = OUT / 'dist/pages.ndjson'
REPORT = OUT / 'pages-report.json'
ASSET_MAP = OUT / 'asset-map.json'
PAGE_TYPES = {'home', 'service', 'page', 'legal', 'thank-you', 'blog-index'}
SEO_LIMITS = {'title': 60, 'description': 160}
SYSTEM_FIELDS = {'_rev', '_createdAt', '_updatedAt'}
SKIP_TAGS = {'script', 'style', 'noscript', 'svg'}
INLINE = {'a', 'span', 'strong', 'em', 'b', 'i', 'br', 'code', 'u', 'sup', 'sub'}
# The live HTML class each Webflow component renders as. Sections without a component render their first style as a class.
COMPONENT_HTML_CLASS = {
    'hero zawlodzki': 'hero-section', 'Hero zawlodzki badge': 'hero-section', 'zawlodzki loga wspolprace': 'testimonials-section',
    'zawlodzki loga aplikacji': 'testimonials-section', 'zawlodzki narzędzia': 'testimonials-section', 'zawlodzki CTA': 'cta-section',
    'newsletter zawlodzki': 'cta-section', 'kontakt zawlodzki': 'contact-section', 'Contact Section Details': 'contact-section',
    'Sales atlas system info': 'feature-section', 'Empty Section / Title Left': 'section', 'Empty Section / Title Left Plus Tagline': 'section',
    'Feature / Left 1 / Text Only': 'feature-section',
}
LAYOUT_CLASSES = {'custom-code-embeds', 'navbar', 'footer-2', 'zaw-schema-slot'}
# User decision 2026-10-21 (T03 finding 15): Sales Atlas serves companies of 2 to 500 people.
CONTENT_FIXES = {'/sales-atlas-system': [('do 250 osób', 'do 500 osób', 1), ('powyżej 250 osób', 'powyżej 500 osób', 1), ('Powyżej 250 osób', 'Powyżej 500 osób', 1)]}
# The inventory has no 404 content (Webflow's default page); this is the copy apps/web serves today.
NOT_FOUND = {'title': 'Nie znaleziono strony', 'html': '<p><a href="/">Wróć na stronę główną</a></p>'}


def text(node):
    """Visible text of a node: embeds, icons and scripts excluded."""
    if isinstance(node, str):
        return node
    if node.tag in SKIP_TAGS or node.tag == 'form' or is_embed(node) or node.classes() & {'material-icons', 'w-form-done', 'w-form-fail'}:
        return ''
    inner = ''.join('\n' if isinstance(c, Node) and c.tag == 'br' else text(c) for c in node.children)
    return inner if node.tag in INLINE else f' {inner} '


def clean(value):
    return squash(value).strip()


def is_embed(node):
    """A Webflow HTML embed holding code (styles, scripts, diagrams). Embeds holding prose are content."""
    classes = node.classes()
    return 'w-embed' in classes and ('w-script' in classes or not any(node.find(tag) for tag in ('p', 'h2', 'table', 'ol', 'ul')))



def walk(node):
    for c in node.elements():
        if c.tag in SKIP_TAGS:
            continue
        yield c
        if not is_embed(c):
            yield from walk(c)


def first(node, pred):
    return next((n for n in walk(node) if pred(n)), None)


def all_of(node, pred):
    return [n for n in walk(node) if pred(n)]


def has_class(name):
    return lambda n: name in n.classes()


def tag_in(*tags):
    return lambda n: n.tag in tags


def inside(node, ancestor):
    while node is not None:
        if node is ancestor:
            return True
        node = node.parent
    return False


class Page:
    """Per-page build state: key generator, PT converter, issue sink and the strings a block kept."""

    def __init__(self, path, keys, links, assets, issues, stats):
        self.path, self.key, self.assets, self.stats = path, keys, assets, stats
        self.issues = issues
        self.kept = []
        self.h1 = None
        self.pt = Converter(keys, links, assets, path, self.issue)
        self.links = links

    def issue(self, kind, detail=''):
        self.issues.append({'path': self.path, 'kind': kind, 'detail': detail})

    def keep(self, value):
        if value:
            self.kept.append(value)
        return value

    def string(self, node):
        return self.keep(clean(text(node))) if node is not None else None

    def blocks(self, nodes):
        """Paragraph-like nodes to Portable Text. Lists and rich text go through the shared converter."""
        out = []
        for n in map(without_icons, nodes):
            if n.tag in ('ul', 'ol'):
                self.pt.block_level(n, out)
            else:
                out.extend(self.pt.text_blocks(n.children, n.tag if n.tag in ('h2', 'h3', 'h4', 'blockquote') else 'normal'))
        for b in out:
            for span in b.get('children', []):
                self.keep(span.get('text'))
        return out

    def link(self, a):
        if a is None:
            return None
        label = self.string(first(a, has_class('button-text'))) or self.string(a)
        href = a.attrs.get('href') or ''
        if href.startswith(('https://www.zawlodzki.pl', 'https://zawlodzki.pl')):
            href = re.sub(r'^https://(www\.)?zawlodzki\.pl', '', href) or '/'
        if not label or not href:
            self.issue('link-incomplete', f'{label!r} -> {href!r}')
            return None
        return {'_type': 'link', 'label': label, 'href': href}

    def image(self, img):
        url = img.attrs.get('src') or ''
        alt = clean(img.attrs.get('alt') or '')
        if not alt:
            self.issue('alt-missing', url)
        self.stats['images'] = self.stats.get('images', 0) + 1
        return self.assets.image('contentImage', url, alt)


def without_icons(node, parent=None, in_item=False):
    """Copy of a subtree the shared converter accepts: no Material icon glyphs (their ligature text,
    "check", is not content) and no <p> inside list items, which become line breaks instead."""
    copy = Node(node.tag, node.attrs, parent)
    in_item = in_item or node.tag == 'li'
    for c in node.children:
        if isinstance(c, str):
            copy.children.append(c)
        elif 'material-icons' in c.classes():
            continue
        elif in_item and c.tag == 'p':
            if copy.children:
                copy.children.append(Node('br', {}, copy))
            copy.children.extend(x if isinstance(x, str) else without_icons(x, copy, True) for x in c.children)
        else:
            copy.children.append(without_icons(c, copy, in_item))
    return copy


def section_title(page, node):
    head = first(node, tag_in('h1', 'h2', 'h3'))
    tag = first(node, has_class('tagline'))
    return page.string(tag), page.string(head), head


def is_button(n):
    return n.tag == 'a' and bool(n.classes() & {'button', 'button-fluid', 'link-with-icon'})


def cta(page, node):
    return page.link(first(node, is_button))


def is_paragraph(n):
    """A <p>, or a Webflow text div (class body-text) holding only inline content."""
    return n.tag == 'p' or (n.tag == 'div' and 'body-text' in n.classes() and all(isinstance(c, str) or c.tag in INLINE for c in n.children))


def paragraphs(node, exclude=()):
    return [p for p in all_of(node, is_paragraph) if not any(inside(p, e) for e in exclude) and clean(text(p))]


def diagram_or_image(page, node, content):
    """Media beside the text column: a known diagram embed, else the first image outside the column."""
    keys = page.registry_keys
    for e in all_of(node, is_embed):
        if content is not None and inside(e, content):
            continue
        raw = source(e)
        found = re.findall(r'#((?:zw|crm)-[a-z0-9-]+)\s*\{', raw) or re.findall(r'id="((?:zw|crm)-[a-z0-9-]+)"', raw)
        if found:
            if found[0] in keys:
                return {'_type': 'media', 'kind': 'diagram', 'key': found[0]}, e
            page.issue('diagram-key-unknown', found[0])
            return None, e
    img = first(node, lambda n: n.tag == 'img' and (content is None or not inside(n, content)))
    if img is not None:
        return {'_type': 'media', 'kind': 'image', 'image': page.image(img)}, img
    return None, None


def source(node):
    """Every text node under a node, styles and scripts included."""
    return node if isinstance(node, str) else ''.join(source(c) for c in node.children)


def media_side(node, content, media_node):
    if media_node is None or content is None:
        return 'right'
    order = [n for n in walk(node) if n is content or n is media_node]
    return 'left' if order and order[0] is media_node else 'right'


def hero(page, node, component):
    tagline, heading, _ = section_title(page, node)
    body = '\n\n'.join(page.string(p) for p in paragraphs(node))
    img = first(node, tag_in('img'))
    block = {'variant': 'badge' if component == 'Hero zawlodzki badge' else 'default', 'tagline': tagline, 'heading': heading, 'body': body}
    if img is not None:
        block['image'] = page.image(img)
    else:
        page.issue('hero-image-missing', heading)
    badges = [page.string(b) for b in all_of(node, lambda n: any('badge' in c for c in n.classes()) and n.tag != 'img' and not n.find('div'))]
    if badges := [b for b in badges if b]:
        block['badges'] = badges
    block['cta'] = cta(page, node)
    return block


def logo_strip(page, node, component, docs):
    heading = page.string(first(node, tag_in('h1', 'h2', 'h3')))
    kind = 'client' if component == 'zawlodzki loga wspolprace' else 'tool'
    refs = []
    for img in all_of(node, tag_in('img')):
        url = img.attrs.get('src') or ''
        name = re.sub(r'\s*\blogo\b\s*', ' ', clean(img.attrs.get('alt') or ''), flags=re.I).strip() or Path(url).stem
        _id = 'logo-' + hashlib.sha1(url.encode()).hexdigest()[:16]
        docs.setdefault(_id, {'_id': _id, '_type': 'logo', 'name': name, 'kind': kind, 'image': page.image(img)})
        refs.append({'_type': 'reference', '_key': page.key(), '_ref': _id})
    return {'variant': 'clients' if kind == 'client' else 'tools', 'title': heading, 'logos': refs}


def feature(page, node, component):
    content = first(node, lambda n: n.classes() & {'feature-content-wrapper', 'section-title'}) or node
    tagline, heading, head = section_title(page, content)
    media, media_node = diagram_or_image(page, node, content)
    button = first(content, is_button)
    nodes = [n for n in all_of(content, lambda n: is_paragraph(n) or n.tag in ('ul', 'ol', 'h3', 'h4'))
             if n is not head and not (button is not None and inside(n, button)) and not any(a.tag in ('ul', 'ol') for a in ancestors(n, content))]
    nodes += [p for p in paragraphs(node) if not inside(p, content) and not any(inside(p, b) for b in list_items(node))]
    block = {'tagline': tagline, 'heading': heading, 'body': page.blocks(nodes), 'mediaSide': media_side(node, content, media_node)}
    bullets = [page.string(b) for b in list_items(node) if not any(inside(b, n) for n in nodes)]
    if bullets:
        block['bullets'] = bullets
    if media:
        block['media'] = media
    if node.attrs.get('id'):
        block['anchorId'] = {'_type': 'slug', 'current': node.attrs['id']}
    block['cta'] = page.link(button)
    return block


def ancestors(node, stop):
    node = node.parent
    while node is not None and node is not stop:
        yield node
        node = node.parent


def list_items(node):
    """List entries: <li>, or Webflow's icon list rows built from divs."""
    found = []
    for n in walk(node):
        if 'material-icons' in n.classes() or any(inside(n, f) for f in found):
            continue
        if n.tag == 'li' or n.classes() & {'feature-list-item', 'icon-list-item'}:
            found.append(n)
    return found


def items_of(page, node, exclude):
    """Repeated item nodes: the children of the first grid holding two or more cards, else list items."""
    lis = [n for n in list_items(node) if not any(inside(n, e) for e in exclude)]
    for grid in all_of(node, lambda n: n.classes() & {'w-layout-grid', 'w-tab-content'}):
        kids = [c for c in grid.elements() if clean(text(c))]
        if len(kids) >= 2 and not any(inside(grid, e) for e in exclude) and not any(inside(li, grid) for li in lis):
            return kids, 'cards'
    if lis:
        return lis, 'checklist' if any(first(i, has_class('material-icons')) for i in lis) else 'list'
    return [], 'list'


def item(page, n):
    title_node = first(n, lambda x: x.tag in ('h3', 'h4', 'strong') or x.classes() & {'countup-title', 'collapse-title', 'card-title', 'heading'})
    number = first(n, lambda x: 'countup-number' in x.classes())
    title = page.string(title_node)
    if number is not None:
        title = page.keep(f'{clean(text(number))} {title}'.strip() if title else clean(text(number)))
    rest = clean(text(n))
    for part in (clean(text(number)) if number is not None else '', clean(text(title_node)) if title_node is not None else ''):
        rest = rest.replace(part, '', 1).strip() if part else rest
    link = first(n, tag_in('a'))
    icon = first(n, has_class('material-icons'))
    entry = {'_type': 'contentItem', '_key': page.key(), 'title': title or page.keep(rest), 'text': page.keep(rest) if title else None,
             'icon': clean(icon.text()) if icon is not None else None}
    if link is not None and link is not n:
        entry['link'] = page.link(link)
    return entry


def tab_items(page, node):
    """Webflow tabs: each tab link (title and summary) paired with its pane, flattened to text."""
    menu = first(node, has_class('w-tab-menu'))
    panes = all_of(node, has_class('w-tab-pane'))
    entries = []
    for link, pane in zip([a for a in menu.elements() if 'w-tab-link' in a.classes()] if menu is not None else [], panes):
        parts = [page.string(p) for p in all_of(link, is_paragraph)]
        for n in all_of(pane, lambda n: n.tag in ('h4', 'h3') or 'tagline' in n.classes() or is_paragraph(n)):
            label = page.string(n)
            parts.append(f'{label}:' if n.tag in ('h3', 'h4') or 'tagline' in n.classes() else label)
        anchor = first(pane, tag_in('a'))
        entries.append({'_type': 'contentItem', '_key': page.key(), 'title': page.string(first(link, tag_in('h3', 'h4'))), 'text': '\n\n'.join(parts).replace(':\n\n', ': '), 'link': page.link(anchor)})
        for a in all_of(pane, tag_in('a'))[1:]:
            page.issue('tab-link-dropped', clean(text(a)))
    if entries:
        page.issue('tabs-flattened', f'{len(entries)} tabs')
    return entries


def content_section(page, node, component):
    title_box = first(node, has_class('section-title')) or node
    tagline, heading, head = section_title(page, title_box)
    tabs = tab_items(page, node)
    if tabs:
        intro = page.blocks([p for p in paragraphs(node) if not any(inside(p, t) for t in all_of(node, has_class('w-tabs')))])
        return {'tagline': tagline, 'heading': heading, 'layout': 'list', 'intro': intro or None, 'items': tabs}
    found, layout = items_of(page, node, [])
    links = [a for a in all_of(node, lambda n: n.tag == 'a' and 'inline-link' in n.classes()) if not any(inside(a, f) for f in found)]
    intro_nodes = [p for p in paragraphs(node, exclude=found) if p is not head]
    block = {'tagline': tagline, 'heading': heading, 'layout': layout}
    if intro := page.blocks(intro_nodes):
        block['intro'] = intro
    entries = [item(page, n) for n in found]
    entries += [{'_type': 'contentItem', '_key': page.key(), 'title': page.string(a), 'link': page.link(a)} for a in links]
    block['items'] = entries
    media, _ = diagram_or_image(page, node, title_box if found else None)
    if media and media['kind'] == 'diagram':
        block['media'] = media
    button = first(node, lambda n: is_button(n) and not any(inside(n, f) for f in found))
    if button is not None:
        page.issue('contentSection-cta-dropped', clean(text(button)))
    rest = [li for li in list_items(node) if not any(inside(li, f) for f in found)] if layout == 'cards' else []
    if not rest:
        return block
    label = [t for t in all_of(node, lambda n: n.classes() & {'tagline', 'pricing-list-title'}) if not any(inside(t, f) for f in found) and not inside(t, title_box)]
    extra = {'_type': 'contentSection', 'heading': page.string(label[-1]) if label else heading, 'layout': 'checklist', 'items': [item(page, li) for li in rest]}
    return [block, extra]


def pricing(page, node, component):
    tagline, heading, head = section_title(page, first(node, has_class('section-title')) or node)
    plans = []
    for card in all_of(node, lambda n: any(c.startswith('pricing-card') for c in n.classes())):
        price_node = first(card, has_class('price'))
        unit = first(price_node, has_class('currency-span')) if price_node is not None else None
        digits = re.sub(r'\D', '', ''.join(c for c in price_node.children if isinstance(c, str))) if price_node is not None else ''
        page.keep(digits)
        note = first(card, lambda n: n.tag == 'p')
        plan = {'_type': 'pricePlan', '_key': page.key(), 'name': page.string(first(card, has_class('tagline'))), 'price': int(digits) if digits else None,
                'currency': 'PLN', 'unit': page.string(unit), 'priceNote': page.string(note),
                'features': [page.string(li) for li in all_of(card, tag_in('li'))], 'cta': cta(page, card), 'highlighted': 'pro' in card.classes()}
        if plan['price'] is None:
            page.issue('price-on-request', f"{plan['name']}: {plan['unit']}")
        plans.append(plan)
    intro = [p for p in paragraphs(first(node, has_class('section-title')) or node) if not any(inside(p, c) for c in all_of(node, lambda n: any(x.startswith('pricing-card') for x in n.classes())))]
    if intro:
        page.issue('pricing-intro-dropped', clean(text(intro[0]))[:80])
    return {'tagline': tagline, 'heading': heading, 'plans': plans}


def cta_band(page, node, component):
    _, heading, head = section_title(page, node)
    body = '\n\n'.join(page.string(p) for p in paragraphs(node))
    return {'heading': heading, 'body': body or None, 'cta': cta(page, node)}


def testimonials(page, node, component, docs):
    tagline, heading, _ = section_title(page, first(node, has_class('section-title')) or node)
    refs, wall = [], True
    boxes = all_of(node, lambda n: any(c.startswith('testimonial-box') or c == 'testimonial-card' for c in n.classes()))
    if boxes:
        wall = False
        for box in boxes:
            attribution = first(box, has_class('avatar-label-text')) or first(box, lambda n: n.tag == 'div' and 'bold' in n.classes())
            quote = '\n\n'.join(page.string(p) for p in all_of(box, tag_in('p')) if attribution is None or not inside(p, attribution))
            if attribution is not None and 'avatar-label-text' in attribution.classes():
                name = page.string(first(attribution, tag_in('strong')))
                company = clean(text(attribution)).replace(name or '', '', 1).strip(' ,-–') or None
            else:
                raw = clean(text(attribution)).lstrip('-– ') if attribution is not None else ''
                name, _, company = (part.strip() for part in raw.partition(','))
                name = re.sub(r'\s+,?$', '', name)
            page.keep(f'{name} {company or ""}')
            if first(box, tag_in('img')) is not None:
                page.issue('testimonial-logo-dropped', name)
            _id = 'testimonial-' + hashlib.sha1(quote.encode()).hexdigest()[:16]
            docs.setdefault(_id, {'_id': _id, '_type': 'testimonial', 'name': name, 'company': company or None, 'quote': quote})
            refs.append({'_type': 'reference', '_key': page.key(), '_ref': _id})
    elif first(node, has_class('testimonial-logo')) is not None:
        page.issue('testimonials-as-logos', 'logo row matched as Testimonials Section, imported as logoStrip')
        block = logo_strip(page, node, 'zawlodzki loga aplikacji', docs)
        subtitle = [page.string(p) for p in paragraphs(node)]
        block['title'] = block.get('title') or ' '.join(subtitle) or None
        return [{'_type': 'logoStrip', **block}]
    else:
        for img in all_of(node, tag_in('img')):
            url = img.attrs.get('src') or ''
            alt = clean(img.attrs.get('alt') or '')
            _id = 'testimonial-' + hashlib.sha1(url.encode()).hexdigest()[:16]
            docs.setdefault(_id, {'_id': _id, '_type': 'testimonial', 'name': alt or Path(url).stem, 'image': page.image(img)})
            refs.append({'_type': 'reference', '_key': page.key(), '_ref': _id})
    return {'variant': 'imageWall' if wall else 'quotes', 'tagline': tagline, 'heading': heading, 'items': refs}


def promo_card(page, node, component):
    _, heading, _ = section_title(page, node)
    a = first(node, tag_in('a'))
    page.string(first(a, has_class('button-text'))) if a is not None else None
    target = page.links.resolve(a.attrs.get('href', ''), page.path) if a is not None else ('unmapped', None, None)
    block = {'title': heading, 'points': [page.string(p) for p in paragraphs(node)]}
    if target[0] == 'internal':
        block['target'] = {'_type': 'reference', '_ref': target[1], '_weak': True}
    else:
        page.issue('promo-target-unmapped', str(target[1]))
    return block


def faq(page, node, component):
    tagline, heading, _ = section_title(page, first(node, has_class('section-title')) or node)
    entries = []
    for row in all_of(node, has_class('collapse-item')):
        answer_box = first(row, has_class('collapse-text'))
        parts = [] if answer_box is None or all(isinstance(c, str) or c.tag in INLINE for c in answer_box.children) else answer_box.elements()
        entries.append({'_type': 'faqItem', '_key': page.key(), 'question': page.string(first(row, has_class('collapse-title'))), 'answer': page.blocks(parts or [answer_box])})
    return {'tagline': tagline, 'heading': heading, 'items': entries, 'emitSchema': True}


def contact_form(page, node, component):
    tagline, heading, _ = section_title(page, node)
    full = page.path == '/kontakt'
    return {'variant': 'full' if full else 'landing', 'tagline': tagline, 'heading': heading, 'showDetails': False, 'formId': 'main-contact' if full else 'landing-contact'}


def newsletter(page, node, component):
    body = '\n\n'.join(page.string(p) for p in paragraphs(node) if not first(p, tag_in('a')))
    return {'body': body or None}


def rich_text(page, node, component):
    box = first(node, has_class('container')) or node
    out = []
    flow(page, box, out)
    for b in out:
        for span in b.get('children', []):
            page.keep(span.get('text'))
        for row in b.get('rows', []):
            page.keep(' '.join(row['cells']))
    return {'body': out}


def split_list(page, node, out):
    """A list with a table inside an item: the items around it stay a list, the table becomes its own block."""
    run = []

    def emit(items):
        if items:
            box = Node(node.tag, node.attrs)
            box.children = items
            page.pt.block_level(without_icons(box), out)

    for li in node.elements():
        table = li.find('table')
        if table is None:
            run.append(li)
            continue
        rest = Node('li', li.attrs)
        rest.children = [c for c in li.children if isinstance(c, str) or not (c is table or c.find('table') is table)]
        emit(run + [rest])
        run = []
        out.append(page.pt.table(table))
        page.issue('table-lifted-from-list', clean(text(table))[:60])
    emit(run)


def flow(page, box, out):
    """Block content of a static page. Runs of inline nodes become paragraphs, divs are unwrapped,
    CMS lists are skipped (the route renders them) and the first H1 becomes the page title."""
    inline = []

    def flush():
        if inline:
            out.extend(page.pt.text_blocks(list(inline), 'normal'))
            inline.clear()

    for c in box.children:
        if isinstance(c, str) or c.tag in INLINE:
            inline.append(c)
            continue
        flush()
        if c.tag in SKIP_TAGS or is_embed(c):
            continue
        if 'w-dyn-list' in c.classes():
            page.stats['dynamicListsSkipped'] = page.stats.get('dynamicListsSkipped', 0) + 1
            page.keep(clean(text(c)))
        elif c.tag == 'h1' and page.h1 is None:
            page.h1 = page.string(c)
        elif c.tag in ('ul', 'ol') and c.find('table'):
            split_list(page, c, out)
        elif c.tag == 'blockquote' and any(x.tag == 'p' for x in c.elements()):
            for x in c.children:
                out.extend(page.pt.text_blocks([x] if isinstance(x, str) else without_icons(x).children, 'blockquote'))
        elif c.tag == 'div' and not (len(c.elements()) == 1 and c.elements()[0].tag in ('table', 'iframe')):
            flow(page, c, out)
        else:
            page.pt.block_level(without_icons(c), out)
    flush()


def is_segment_heading(n):
    """A heading that opens its own block: any h2, or an h3 right after a tagline."""
    if n.tag == 'h2':
        return True
    if n.tag != 'h3' or n.parent is None:
        return False
    siblings = n.parent.elements()
    i = siblings.index(n)
    return i > 0 and 'tagline' in siblings[i - 1].classes()


def segments(section):
    """Split a section at its segment headings. Each subtree holding at most one heading is a unit;
    a unit without a heading joins the segment before it. Returns one synthetic node per segment."""
    groups = [[]]

    def visit(node):
        for c in node.children:
            if isinstance(c, str):
                groups[-1].append(c)
                continue
            heads = [n for n in [c, *walk(c)] if is_segment_heading(n)]
            if len(heads) > 1:
                visit(c)
                continue
            if heads and has_heading(groups[-1]):
                groups.append([])
            groups[-1].append(c)

    visit(section)
    if len(groups) == 1:
        return [section]
    out = []
    for i, g in enumerate(groups):
        box = Node('div', section.attrs if i == 0 else {'class': section.attrs.get('class', '')})
        box.children = g
        out.append(box)
    return out


def has_heading(group):
    return any(isinstance(c, Node) and (is_segment_heading(c) or any(is_segment_heading(n) for n in walk(c))) for c in group)


def segment_kind(page, node):
    """Block type for a segment after the first: a list or grid without media is a contentSection."""
    found, _ = items_of(page, node, [])
    has_media = first(node, tag_in('img')) is not None or any(re.search(r'#(?:zw|crm)-[a-z0-9-]+\s*\{', source(e)) for e in all_of(node, is_embed))
    return 'contentSection' if found and not has_media else 'feature'


EXTRACT = {
    'hero': hero, 'feature': feature, 'contentSection': content_section, 'pricing': pricing, 'ctaBand': cta_band,
    'promoCard': promo_card, 'faq': faq, 'contactForm': contact_form, 'newsletterSignup': newsletter, 'richText': rich_text,
}
SPLIT = {'feature', 'contentSection'}
WITH_DOCS = {'logoStrip': logo_strip, 'testimonials': testimonials}


def block_rules():
    registry = json.loads((CONTRACTS / 'blocks.json').read_text())
    rules = [(m, b['type']) for b in registry['blocks'] for m in b['match']] + [(m, 'layout') for m in registry['layout']['match']]
    web = re.findall(r"^  '([a-z0-9-]+)':", (ROOT / 'apps/web/src/components/diagrams/registry.ts').read_text(), re.M)
    return rules, set(registry['diagramKeys']['keys']) | set(web)


def block_type(section, rules):
    comp = section.get('component')
    first_class = (section.get('classes') or [None])[0]
    hits = {t for m, t in rules if (comp and m.get('component') == comp) or (not comp and m.get('classes') == first_class)}
    if len(hits) != 1:
        raise ValueError(f'section {comp or first_class} matches {sorted(hits)}')
    return hits.pop()


def html_sections(html):
    body = parse(html).find('body')
    return [c for c in body.elements() if c.tag not in SKIP_TAGS and not (c.classes() & LAYOUT_CLASSES) and c.tag != 'footer']


def compact(value):
    """Drop None and empty strings so absent optional fields stay absent."""
    if isinstance(value, dict):
        return {k: compact(v) for k, v in value.items() if v not in (None, '', [])}
    if isinstance(value, list):
        return [compact(v) for v in value]
    return value


def coverage(source, kept):
    """Words in the source section that no kept string carries, as a multiset difference."""
    have = {}
    for word in re.findall(r'\w+', ' '.join(kept).lower()):
        have[word] = have.get(word, 0) + 1
    lost = []
    for word in re.findall(r'\w+', source.lower()):
        if have.get(word):
            have[word] -= 1
        else:
            lost.append(word)
    return lost


def build_page(row, meta, plan, keys, links, assets, issues, stats, docs, registry_keys):
    """plan: list of (block_type, component, html node)."""
    path = row['old_path']
    page = Page(path, keys, links, assets, issues, stats)
    page.registry_keys = registry_keys
    sections, losses, sections_extra = [], [], []
    for kind, component, node in plan:
        page.kept = []
        parts = segments(node) if kind in SPLIT else [node]
        if len(parts) > 1:
            stats['sectionsSplit'] = stats.get('sectionsSplit', 0) + 1
        start = len(sections)
        for i, part in enumerate(parts):
            part_kind = kind if i == 0 else segment_kind(page, part)
            extract = WITH_DOCS.get(part_kind)
            result = extract(page, part, component, docs) if extract else EXTRACT[part_kind](page, part, component)
            blocks = result if isinstance(result, list) else [result]
            block = blocks[0]
            for more in blocks[1:]:
                sections_extra.append(more)
            if part_kind == 'contactForm' and component == 'Contact Section Details':
                previous = next((s for s in reversed(sections) if s['_type'] == 'contactForm'), None)
                if previous:
                    previous['showDetails'] = True
                    stats['contactDetailsMerged'] = stats.get('contactDetailsMerged', 0) + 1
                    continue
                block['showDetails'] = True
            for kind_out, body in [(block.pop('_type', part_kind), block)] + [(b.pop('_type'), b) for b in sections_extra]:
                sections.append(compact({'_type': kind_out, '_key': keys(), **body}))
                counts = stats.setdefault('blocks', {})
                counts[kind_out] = counts.get(kind_out, 0) + 1
            sections_extra.clear()
        lost = coverage(clean(text(node)), page.kept)
        if lost:
            losses.append({'section': start, 'type': kind, 'heading': sections[start].get('heading') or sections[start].get('title') if start < len(sections) else None, 'words': len(lost), 'sample': ' '.join(lost[:25])})
    heading = next((s.get('heading') for s in sections if s['_type'] == 'hero'), None) or page.h1
    seo = compact({
        '_type': 'seo', 'title': meta.get('seoTitle') or row['title'], 'description': meta.get('seoDescription'),
        'ogImage': assets.image('contentImage', meta['ogImage'], meta.get('seoTitle') or row['title']) if (meta.get('ogImage') or '').startswith('https://') else None,
        'noindex': row['indexable'] != 'yes',
    })
    for field, limit in SEO_LIMITS.items():
        if len(seo.get(field, '')) > limit:
            issues.append({'path': path, 'kind': f'seo-{field}-too-long', 'detail': f'{len(seo[field])} > {limit}'})
    if 'description' not in seo:
        issues.append({'path': path, 'kind': 'seo-description-missing', 'detail': ''})
    doc = {'_id': doc_id('page', meta['id']), '_type': 'page', 'language': 'pl', 'title': plan_title(heading, meta, row),
           'slug': {'_type': 'slug', 'current': path}, 'seo': seo, 'sections': sections}
    return apply_fixes(doc), losses


def plan_title(heading, meta, row):
    return heading or meta.get('h1') or re.sub(r'\s*[|\-–]\s*(Grzegorz )?Zawłodzki$', '', row['title']).strip() or meta['title']


def apply_fixes(doc):
    fixes = CONTENT_FIXES.get(doc['slug']['current'])
    if not fixes:
        return doc
    raw = json.dumps(doc, ensure_ascii=False)
    for old, new, expected in fixes:
        found = raw.count(old)
        if found != expected:
            raise ValueError(f'{doc["slug"]["current"]}: expected {expected} x {old!r}, found {found}')
        raw = raw.replace(old, new)
    return json.loads(raw)


def page_plan(row, meta, trees, html_dir, content_dir, rules, skipped):
    """Sections for one page as (block_type, component, node)."""
    path = row['old_path']
    html_file = html_dir / ('index.html' if path == '/' else f'{path.strip("/")}.html')
    tree = trees.get(meta['id'])
    if tree is not None:
        typed = [(block_type(s, rules), s) for s in tree['sections']]
        typed = [(t, s) for t, s in typed if t != 'layout']
        nodes = html_sections(html_file.read_text())
        plan, rest = [], list(nodes)
        for t, s in typed:
            wanted = COMPONENT_HTML_CLASS.get(s.get('component')) or s['classes'][0].lower().replace(' ', '-')
            if not rest or wanted not in rest[0].classes():
                skipped.append(f'{s.get("component") or s.get("classes")} (not in live HTML)')
                continue
            node = rest.pop(0)
            if s.get('heading') and clean(s['heading']) not in clean(text(node)):
                raise ValueError(f'{path}: heading {s["heading"]!r} not in live section {sorted(node.classes())}')
            plan.append((t, s.get('component'), node))
        if rest:
            raise ValueError(f'{path}: live HTML sections without a tree section: {[sorted(n.classes()) for n in rest]}')
        return plan
    if html_file.exists():
        nodes = html_sections(html_file.read_text())
        return [('richText', None, n) for n in nodes if clean(text(n))]
    content = content_dir / f'{meta["id"]}.json'
    if content.exists():
        nodes = json.loads(content.read_text())['nodes']
        html = ''.join(n['text']['html'] for n in nodes if n['type'] == 'text')
        h1 = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.S)
        meta['h1'] = clean(parse(h1.group(1)).text()) if h1 else None
        return [('richText', None, parse(re.sub(r'<h1[^>]*>.*?</h1>', '', html, flags=re.S)))]
    if path == '/404':
        meta['h1'] = NOT_FOUND['title']
        return [('richText', None, parse(NOT_FOUND['html']))]
    raise ValueError(f'{path}: no tree, live HTML or page content')


def build(args):
    rows = [r for r in csv.DictReader((CONTRACTS / 'url-map.csv').open(newline='')) if r['action'] == 'keep' and r['page_type'] in PAGE_TYPES]
    pages = json.loads((INVENTORY / 'webflow/pages.json').read_text())['pages']
    by_path = {p['path']: p for p in pages if not p.get('collectionId') and p['kind'] != 'cms-template'}
    trees = json.loads((INVENTORY / 'webflow/components.json').read_text())['pageSections']
    items = json.loads((INVENTORY / 'webflow/cms/blog.items.json').read_text())
    items = items['items'] if isinstance(items, dict) else items
    post_ids = {f'/blog/{(i.get("fieldData") or i)["slug"]}': doc_id('post', i['id']) for i in items}
    links = Links(CONTRACTS / 'url-map.csv', INVENTORY / 'webflow/pages.json', post_ids)
    assets = Assets(args.asset_map)
    rules, registry_keys = block_rules()
    issues, stats, docs, losses, out, failures = [], {}, {}, {}, [], []
    for row in sorted(rows, key=lambda r: r['old_path']):
        meta = dict(by_path[row['old_path']])
        try:
            skipped = []
            plan = page_plan(row, meta, trees, INVENTORY / 'live-site/html', INVENTORY / 'webflow/page-content', rules, skipped)
            issues.extend({'path': row['old_path'], 'kind': 'tree-section-not-rendered', 'detail': d} for d in skipped)
            doc, lost = build_page(row, meta, plan, Keys(row['old_path']), links, assets, issues, stats, docs, registry_keys)
        except ValueError as error:
            failures.append(str(error))
            continue
        out.append(doc)
        if lost:
            losses[row['old_path']] = lost
    if failures:
        sys.exit('\n'.join(failures))
    all_docs = out + [docs[k] for k in sorted(docs)]
    lines = [json.dumps(compact(d), ensure_ascii=False, sort_keys=True) for d in all_docs]
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    payload = '\n'.join(lines) + '\n'
    Path(args.out).write_text(payload)
    counts = {}
    for i in issues:
        counts[i['kind']] = counts.get(i['kind'], 0) + 1
    report = {
        'pages': len(out), 'logos': sum(d['_type'] == 'logo' for d in docs.values()), 'testimonials': sum(d['_type'] == 'testimonial' for d in docs.values()),
        'ndjsonSha256': hashlib.sha256(payload.encode()).hexdigest(),
        'images': {'mapped': assets.mapped, 'sanityAssetPlaceholders': assets.unmapped},
        'blocks': dict(sorted(stats.get('blocks', {}).items())), 'contactDetailsMerged': stats.get('contactDetailsMerged', 0),
        'issueCounts': dict(sorted(counts.items())), 'issues': issues,
        'textLoss': losses,
        'pagesById': {d['slug']['current']: d['_id'] for d in out},
    }
    Path(args.report).write_text(json.dumps(report, ensure_ascii=False, indent=1) + '\n')
    print(json.dumps({k: report[k] for k in ('pages', 'logos', 'testimonials', 'images', 'blocks', 'issueCounts', 'ndjsonSha256')}, ensure_ascii=False, indent=1))
    print('sections with text loss:', sum(len(v) for v in losses.values()))


def sanity(*argv, capture=False):
    return subprocess.run(['npx', 'sanity', *argv], cwd=ROOT / 'apps/studio', check=True, text=True, capture_output=capture)


def import_(args):
    if args.dataset == 'production':
        sys.exit('Refusing to write production. The first production write needs the owner\'s explicit yes (AGENTS.md).')
    sanity('dataset', 'import', str(Path(args.ndjson).resolve()), '--dataset', args.dataset, '--replace')


def snapshot(args):
    """Every imported document as stored, without system fields, plus one hash over all of them."""
    query = '*[_type in ["page", "logo", "testimonial"] && !(_id in path("drafts.**"))] | order(_id asc)'
    result = sanity('documents', 'query', query, '--dataset', args.dataset, '--api-version', '2026-10-21', capture=True)
    docs = [{k: v for k, v in d.items() if k not in SYSTEM_FIELDS} for d in json.loads(result.stdout)]
    canonical = json.dumps(docs, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
    out = {
        'dataset': args.dataset, 'documents': len(docs), 'pages': sum(d['_type'] == 'page' for d in docs),
        'sha256': hashlib.sha256(canonical.encode()).hexdigest(),
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
