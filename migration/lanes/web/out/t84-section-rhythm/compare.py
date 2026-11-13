import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path


class Document(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.ids = Counter()
        self.fragments = Counter()
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids[attrs["id"]] += 1
        if tag == "a" and (href := attrs.get("href", "")).startswith("#"):
            self.fragments[href] += 1


before, after = [Path(arg) / "html" for arg in sys.argv[1:]]
before_pages = {page.name for page in before.glob("*.html")}
after_pages = {page.name for page in after.glob("*.html")}
assert before_pages and before_pages == after_pages, "HTML crawl coverage changed"

differences = []
for name in sorted(before_pages):
    old, new = Document(before / name), Document(after / name)
    for field in ("ids", "fragments"):
        left, right = getattr(old, field), getattr(new, field)
        if left != right:
            differences.append((name, field, dict(left - right), dict(right - left)))

for difference in differences:
    print(*difference, sep="\t")
print(f"{len(differences)} anchor differences across {len(before_pages)} pages")
sys.exit(bool(differences))
