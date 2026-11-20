"""T127: check that every built page carries the brand suffix exactly once.

Usage: python3 -I check-titles.py <apps/web/dist> <out.tsv> [live-urls.csv]
Reads <title>, og:title and twitter:title from every HTML file. Fails unless each <title> ends with
" | Grzegorz Zawłodzki", contains it once, and og:title and twitter:title (when present) equal it.
With the inventory's live-site/urls.csv it also records the live Webflow title for comparison.
"""
import csv
import html
import re
import sys
from pathlib import Path

SUFFIX = " | Grzegorz Zawłodzki"


def meta(text, attr, key):
    found = re.findall(rf'<meta\s+{attr}="{re.escape(key)}"\s+content="([^"]*)"', text)
    return html.unescape(found[0]) if found else None


def main(dist, out, live_csv=None):
    live = {}
    if live_csv:
        for row in csv.DictReader(open(live_csv, encoding="utf-8")):
            live[row["url"].replace("https://www.zawlodzki.pl", "") or "/"] = row["title"]
    rows, problems = [], []
    for file in sorted(Path(dist).rglob("*.html")):
        rel = "/" + str(file.relative_to(dist)).removesuffix("index.html").removesuffix(".html")
        path = rel.rstrip("/") or "/"
        text = file.read_text(encoding="utf-8")
        titles = [html.unescape(t.strip()) for t in re.findall(r"<title\b[^>]*>([\s\S]*?)</title>", text, re.I)]
        title = titles[0] if titles else ""
        og, tw = meta(text, "property", "og:title"), meta(text, "name", "twitter:title")
        ok = len(titles) == 1 and (title.endswith(SUFFIX) and title.count(SUFFIX) == 1 or title == SUFFIX[3:])
        ok = ok and og in (None, title) and tw in (None, title)
        if not ok:
            problems.append(path)
        rows.append({"path": path, "ok": ok, "title": title, "len": len(title), "og_equal": og == title if og is not None else "", "live_title": live.get(path, ""), "same_as_live": title == live.get(path) if path in live else ""})
    with open(out, "w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(rows[0]), delimiter="\t", lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    compared = [r for r in rows if r["same_as_live"] != ""]
    print(f"{len(rows)} pages, {len(problems)} problems, {sum(r['same_as_live'] is True for r in compared)}/{len(compared)} identical to live Webflow")
    for path in problems:
        print("FAIL", path)
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main(*sys.argv[1:])
