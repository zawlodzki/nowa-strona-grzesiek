"""Webflow rich-text HTML to Portable Text (contract: blocks.json portableText).

The source uses a closed tag set. Anything outside it raises, so a new construct
in the CMS stops the import instead of disappearing from the output.
"""
import re
from html.parser import HTMLParser
from urllib.parse import urlsplit

VOID = {'br', 'img'}
DECORATORS = {'strong': 'strong', 'b': 'strong', 'em': 'em', 'i': 'em', 'code': 'code'}
STYLES = {'p': 'normal', 'h2': 'h2', 'h3': 'h3', 'h4': 'h4', 'blockquote': 'blockquote'}
HEADING_DEMOTE = {'h1': 'h2', 'h5': 'h4', 'h6': 'h4'}
EMBED_KINDS = {'youtube.com': 'youtube', 'www.youtube.com': 'youtube', 'youtu.be': 'youtube', 'www.loom.com': 'loom', 'loom.com': 'loom'}


class Node:
    def __init__(self, tag, attrs, parent=None):
        self.tag, self.attrs, self.parent, self.children = tag, dict(attrs), parent, []

    def classes(self):
        return set((self.attrs.get('class') or '').split())

    def elements(self):
        return [c for c in self.children if isinstance(c, Node)]

    def find(self, tag):
        for c in self.elements():
            if c.tag == tag:
                return c
            found = c.find(tag)
            if found:
                return found
        return None

    def text(self):
        return ''.join(c if isinstance(c, str) else ('\n' if c.tag == 'br' else c.text()) for c in self.children)


class _TreeBuilder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = self.cur = Node('#root', {})

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs, self.cur)
        self.cur.children.append(node)
        if tag not in VOID:
            self.cur = node

    def handle_startendtag(self, tag, attrs):
        self.cur.children.append(Node(tag, attrs, self.cur))

    def handle_endtag(self, tag):
        node = self.cur
        while node is not self.root and node.tag != tag:
            node = node.parent
        if node is not self.root:
            self.cur = node.parent

    def handle_data(self, data):
        self.cur.children.append(data)


def parse(html):
    builder = _TreeBuilder()
    builder.feed(html or '')
    builder.close()
    return builder.root


def squash(text):
    return re.sub(r'[ \t\r\n\f\v]+', ' ', text)


class Converter:
    def __init__(self, keys, links, assets, current_path, issue):
        self.key, self.links, self.assets, self.path, self.issue = keys, links, assets, current_path, issue
        self.stats = {}

    def count(self, name, n=1):
        self.stats[name] = self.stats.get(name, 0) + n

    def convert(self, html):
        out = []
        for child in parse(html).children:
            self.block_level(child, out)
        return out

    def block_level(self, node, out):
        if isinstance(node, str):
            if node.strip():
                out.extend(self.text_blocks([node], 'normal'))
            return
        tag = node.tag
        if tag in HEADING_DEMOTE:
            self.issue('heading-demoted', f'<{tag}> imported as {HEADING_DEMOTE[tag]}')
            tag = HEADING_DEMOTE[tag]
        if tag in STYLES:
            if tag == 'p' and self.download_paragraph(node, out):
                return
            out.extend(self.text_blocks(node.children, STYLES[tag]))
        elif tag in ('ul', 'ol'):
            if tag == 'ol' and node.attrs.get('start') not in (None, '1'):
                self.issue('list-start-dropped', f'<ol start="{node.attrs["start"]}">')
            self.list_blocks(node, 1, out)
        elif tag == 'figure':
            img = node.find('img')
            if not img:
                raise ValueError(f'{self.path}: <figure> without <img>')
            caption = node.find('figcaption')
            out.append(self.image(img, squash(caption.text()).strip() if caption else None))
        elif tag == 'img':
            out.append(self.image(node))
        elif tag == 'table':
            out.append(self.table(node))
        elif tag == 'div' and node.find('table') and not node.find('iframe'):
            out.append(self.table(node.find('table')))
        elif tag == 'div' and node.find('iframe'):
            out.append(self.embed(node.find('iframe')))
        elif tag == 'iframe':
            out.append(self.embed(node))
        elif tag == 'div':
            for child in node.children:
                self.block_level(child, out)
        else:
            raise ValueError(f'{self.path}: unsupported block element <{tag}>')

    def text_blocks(self, children, style, list_item=None, level=None):
        """Inline content to blocks. An <img> inside a paragraph splits it around an image object."""
        out, block = [], self.new_block(style, list_item, level)

        def flush():
            nonlocal block
            if self.finish_block(block):
                out.append(block)
            block = self.new_block(style, list_item, level)

        def walk(node, marks):
            if isinstance(node, str):
                self.add_text(block, squash(node), marks)
            elif node.tag == 'br':
                self.add_text(block, '\n', marks)
            elif node.tag == 'img':
                flush()
                out.append(self.image(node))
            elif node.tag in DECORATORS:
                for c in node.children:
                    walk(c, marks + [DECORATORS[node.tag]])
            elif node.tag == 'a':
                mark = self.link_mark(block, node.attrs.get('href') or '')
                for c in node.children:
                    walk(c, marks + ([mark] if mark else []))
            elif node.tag in ('span', 'div', 'sup', 'sub', 'u'):
                if node.tag in ('sup', 'sub', 'u'):
                    self.issue('inline-dropped', f'<{node.tag}> kept as plain text')
                for c in node.children:
                    walk(c, marks)
            else:
                raise ValueError(f'{self.path}: unsupported inline element <{node.tag}>')

        for child in children:
            walk(child, [])
        flush()
        return out

    def new_block(self, style, list_item, level):
        block = {'_type': 'block', '_key': self.key(), 'style': style, 'markDefs': [], 'children': []}
        if list_item:
            block['listItem'], block['level'] = list_item, level
        return block

    def add_text(self, block, text, marks):
        if not text:
            return
        children = block['children']
        if children and children[-1]['marks'] == marks:
            children[-1]['text'] += text
        else:
            children.append({'_type': 'span', '_key': self.key(), 'text': text, 'marks': list(marks)})

    def finish_block(self, block):
        """Trim whitespace at the block edges and around line breaks. Drop empty blocks."""
        spans = block['children']
        for span in spans:
            span['text'] = re.sub(r' *\n *', '\n', span['text'])
        if spans:
            spans[0]['text'] = spans[0]['text'].lstrip(' \n')
            spans[-1]['text'] = spans[-1]['text'].rstrip(' \n')
        merged = []
        for span in spans:
            if merged and merged[-1]['text'].endswith(' ') and span['text'].startswith(' '):
                span['text'] = span['text'][1:]
            if span['text']:
                merged.append(span)
        block['children'] = merged
        used = {m for s in merged for m in s['marks']}
        block['markDefs'] = [d for d in block['markDefs'] if d['_key'] in used]
        if not merged:
            return False
        if not ''.join(s['text'] for s in merged).strip():
            return False
        self.count('blocks')
        return True

    def link_mark(self, block, href):
        kind, value, weak = self.links.resolve(href, self.path)
        key = self.key()
        if kind == 'internal':
            ref = {'_type': 'reference', '_ref': value}
            if weak:
                ref['_weak'] = True
            block['markDefs'].append({'_type': 'internalLink', '_key': key, 'reference': ref})
            self.count('links.internal.page' if weak else 'links.internal.post')
        else:
            if kind == 'unmapped':
                self.issue('link-unmapped', value)
            self.count(f'links.{kind}')
            block['markDefs'].append({'_type': 'link', '_key': key, 'href': value})
        return key

    def download_paragraph(self, node, out):
        """A paragraph made only of links to files.zawlodzki.com becomes download objects."""
        links = [c for c in node.children if isinstance(c, Node)]
        loose = [c for c in node.children if isinstance(c, str) and c.strip()]
        if loose or not links or any(l.tag != 'a' or urlsplit(l.attrs.get('href', '')).netloc != 'files.zawlodzki.com' for l in links):
            return False
        for link in links:
            out.append({'_type': 'download', '_key': self.key(), 'label': squash(link.text()).strip(), 'url': link.attrs['href'].strip()})
            self.count('downloads')
        return True

    def list_blocks(self, node, level, out):
        list_item = 'number' if node.tag == 'ol' else 'bullet'
        for li in node.elements():
            if li.tag != 'li':
                raise ValueError(f'{self.path}: <{li.tag}> directly inside <{node.tag}>')
            inline = [c for c in li.children if not (isinstance(c, Node) and c.tag in ('ul', 'ol'))]
            inline = [c for c in inline for c in (c.children if isinstance(c, Node) and c.tag == 'p' else [c])]
            out.extend(self.text_blocks(inline, 'normal', list_item, level))
            for nested in li.elements():
                if nested.tag in ('ul', 'ol'):
                    self.list_blocks(nested, level + 1, out)

    def image(self, img, caption=None):
        src = img.attrs.get('src') or ''
        if not src:
            raise ValueError(f'{self.path}: <img> without src')
        alt = squash(img.attrs.get('alt') or '').strip()
        value = self.assets.image('image', src, alt, key=self.key(), caption=caption)
        if not value['alt']:
            self.issue('image-alt-missing', src)
        self.count('images')
        return value

    def table(self, table):
        rows, has_header = [], table.find('thead') is not None
        lost_marks = 0
        for tr in self.table_rows(table):
            cells = []
            for cell in tr.elements():
                if cell.tag not in ('td', 'th'):
                    raise ValueError(f'{self.path}: <{cell.tag}> inside <tr>')
                lost_marks += sum(1 for _ in self.marked(cell))
                cells.append(squash(cell.text()).strip())
            rows.append({'_type': 'tableRow', '_key': self.key(), 'cells': cells})
        if not has_header and rows and all(c.tag == 'th' for c in self.table_rows(table)[0].elements()):
            has_header = True
        if lost_marks:
            self.count('tables.cellMarksDropped', lost_marks)
        self.count('tables')
        return {'_type': 'table', '_key': self.key(), 'hasHeader': has_header, 'rows': rows}

    def table_rows(self, table):
        rows = []
        for child in table.elements():
            if child.tag == 'tr':
                rows.append(child)
            elif child.tag in ('thead', 'tbody', 'tfoot'):
                rows.extend(r for r in child.elements() if r.tag == 'tr')
        return rows

    def marked(self, node):
        for c in node.elements():
            if c.tag in DECORATORS or c.tag == 'a':
                yield c
            yield from self.marked(c)

    def embed(self, iframe):
        url = (iframe.attrs.get('src') or '').strip()
        if url.startswith('//'):
            url = 'https:' + url
        host = urlsplit(url).netloc
        title = (iframe.attrs.get('title') or '').strip()
        if not title:
            title = embed_title(url)
            self.issue('embed-title-derived', f'{url} -> {title}')
        self.count('embeds')
        return {'_type': 'embed', '_key': self.key(), 'kind': EMBED_KINDS.get(host, 'iframe'), 'url': url, 'title': title}


def embed_title(url):
    parts = urlsplit(url)
    slug = parts.path.rstrip('/').rsplit('/', 1)[-1]
    words = squash(slug.rsplit('__', 1)[0].replace('_', ' ').replace('-', ' ')).strip()
    host = parts.netloc.removeprefix('www.')
    return f'{words} ({host})' if words else f'Osadzona treść z {host}'
