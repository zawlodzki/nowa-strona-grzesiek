#!/usr/bin/env python3
"""Build migration/contracts/url-map.csv from the inventory.

Usage: python3 -I migration/tools/build-url-map.py
Rerun after the inventory or decisions change; the output is fully regenerated.
"""
import csv
import json
import pathlib
from urllib.parse import urlsplit

ROOT = pathlib.Path(__file__).resolve().parents[1]
INV = ROOT / "00-inventory"
OUT = ROOT / "contracts" / "url-map.csv"

SERVICE = {
    "/szkolenie-i-wdrozenie-pipedrive", "/szkolenie-i-wdrozenie-asana", "/szkolenie-i-wdrozenie-salesforce",
    "/automatyzacje-dla-pipedrive", "/automatyzacja-procesow-biznesowych-nocode", "/wdrozenie-ai-w-sprzedazy-b2b",
    "/program-ai-dla-zespolu-sprzedazy", "/kurs-ai-w-sprzedazy", "/audyt-sprzedazy", "/audyt-crm-pipedrive",
    "/audyt-ai-sprzedaz", "/audyt-procesow-asana",
}
LEGAL = {"/regulamin", "/regulamin-newslettera", "/polityka-prywatnosci", "/lista-cookies-i-identyfikatorow"}
THANK_YOU = {"/podziekowanie-konsultacja", "/podziekowanie-newsletter"}
# Decision 5 (2026-10-21): EN scope is key pages plus the top 10 posts by GSC clicks.
EN_PAGES = SERVICE | {"/", "/o-mnie", "/kontakt", "/sales-atlas-system", "/wspolpraca"}
EN_TOP_POSTS = 10

EXTRA_REDIRECTS = [
    ("/index.html", "/", "Webflow serves 200 with canonical to /"),
    ("/search", "/blog", "decision 6: thin Webflow search page removed"),
]


def page_type(path):
    if path == "/":
        return "home"
    if path == "/blog":
        return "blog-index"
    if path.startswith("/blog/"):
        return "post"
    if path in SERVICE:
        return "service"
    if path in LEGAL:
        return "legal"
    if path in THANK_YOU:
        return "thank-you"
    return "page"


def top_posts():
    gsc = INV / "gsc" / "pages-16m.csv"
    if not gsc.exists():
        return set()
    rows = sorted(csv.DictReader(gsc.open()), key=lambda r: -int(r["clicks"]))
    paths = [urlsplit(r["url"]).path for r in rows]
    return set([p for p in paths if p.startswith("/blog/")][:EN_TOP_POSTS])


def main():
    live = list(csv.DictReader((INV / "live-site" / "urls.csv").open()))
    posts_en = top_posts()
    rows = []
    for r in live:
        path = urlsplit(r["final_url"] or r["url"]).path or "/"
        kind = page_type(path)
        if path in dict((a, b) for a, b, _ in EXTRA_REDIRECTS):
            continue
        noindex = kind == "thank-you" or "noindex" in r["meta_robots"]
        rows.append({
            "old_path": path,
            "action": "keep",
            "new_path_pl": path,
            "target": "",
            "page_type": kind,
            "en_planned": "yes" if path in EN_PAGES or path in posts_en else "",
            "new_path_en": "",
            "indexable": "no" if noindex else "yes",
            "in_sitemap": "no" if noindex or kind == "legal" and path == "/lista-cookies-i-identyfikatorow" else "yes",
            "title": r["title"],
            "notes": "",
        })
    # Live Webflow pages the crawler cannot reach (unlinked or not in the sitemap).
    seen = {r["old_path"] for r in rows}
    for p in json.load((INV / "webflow" / "pages.json").open())["pages"]:
        path = p.get("path") or ""
        if p.get("draft") or path in seen or p.get("kind") not in ("thank-you", "utility") or path == "/search":
            continue
        if path == "/401":
            rows.append({"old_path": path, "action": "remove", "page_type": "utility",
                         "notes": "Webflow password page, no equivalent"})
            continue
        rows.append({"old_path": path, "action": "keep", "new_path_pl": path, "page_type": page_type(path),
                     "indexable": "no", "in_sitemap": "no", "title": p.get("title", ""),
                     "notes": "404 page, served for unknown paths" if path == "/404" else "noindex, form target"})
    for src in [(INV / "webflow-settings" / "redirects.csv")]:
        for r in csv.DictReader(src.open()):
            rows.append({"old_path": r["old_path"], "action": "redirect-301", "target": r["new_path"],
                         "page_type": "redirect", "notes": "carried over from Webflow"})
    for a, b, note in EXTRA_REDIRECTS:
        rows.append({"old_path": a, "action": "redirect-301", "target": b, "page_type": "redirect", "notes": note})
    rows.append({"old_path": "/blog?f95bbc04_page=*", "action": "redirect-301", "target": "/blog",
                 "page_type": "redirect", "notes": "Webflow pagination param, soft-404 risk today"})

    fields = ["old_path", "action", "new_path_pl", "target", "page_type", "en_planned", "new_path_en",
              "indexable", "in_sitemap", "title", "notes"]
    OUT.parent.mkdir(exist_ok=True)
    with OUT.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, restval="")
        w.writeheader()
        w.writerows(sorted(rows, key=lambda r: (r["action"], r["page_type"], r["old_path"])))
    print(f"{OUT.relative_to(ROOT.parent)}: {len(rows)} rows")


if __name__ == "__main__":
    main()
