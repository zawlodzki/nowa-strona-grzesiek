"""Probe the running Worker locally or on Cloudflare without following redirects."""
import argparse
import http.client
from urllib.parse import urlsplit

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("origin", help="Worker origin, e.g. http://127.0.0.1:8790")
mode = parser.add_mutually_exclusive_group()
mode.add_argument("--production", action="store_true", help="expect production indexing rules")
mode.add_argument("--local", action="store_true", help="also exercise the production Host branch locally")
parser.add_argument("--baseline", action="store_true", help="expect the deployed Worker to still serve HTML for both requests")
args = parser.parse_args()
origin = urlsplit(args.origin)
connection = http.client.HTTPSConnection if origin.scheme == "https" else http.client.HTTPConnection

HTML = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
MD = "text/markdown"
ROBOTS = None if args.production else "noindex, nofollow"
DIRECT_ROBOTS = "noindex" if args.production else ROBOTS
FIELDS = ("content-type", "vary", "x-robots-tag", "cache-control", "cf-cache-status", "age", "etag", "location")
print("host\tmethod\tpath\taccept\tstatus\t" + "\t".join(FIELDS), flush=True)


def probe(path, accept, *, method="GET", host=None, **extra):
    headers = {"Accept": accept, **extra}
    if host:
        headers["Host"] = host
    conn = connection(origin.hostname, origin.port, timeout=20)
    try:
        conn.request(method, path, headers=headers)
        response = conn.getresponse()
        status = response.status
        result = {key.lower(): response.getheader(key) for key, _ in response.getheaders()}
        body = response.read()
    finally:
        conn.close()
    print("\t".join([host or origin.netloc, method, path, accept, str(status)]
                    + [result.get(field, "-") for field in FIELDS]), flush=True)
    return status, result, body


def check(response, status, media=None, *, robots=None, vary=False):
    actual, headers, body = response
    assert actual == status, (status, actual)
    if media:
        assert headers.get("content-type", "").split(";")[0] == media, (media, headers)
    assert headers.get("x-robots-tag") == robots, (robots, headers)
    if vary:
        assert "accept" in {part.strip().lower() for part in headers.get("vary", "").split(",")}, headers
    return headers, body


for path in ("/", "/sales-atlas-system", "/blog/automatyzacja-sprzedazy"):
    asset = "/index.md" if path == "/" else path + ".md"
    _, md_body = check(probe(asset, MD), 200, MD, robots=DIRECT_ROBOTS)
    assert md_body.startswith(b"# "), asset
    for order, accepts in (("html-first", (HTML, MD)), ("markdown-first", (MD, HTML))):
        target = f"{path}?t78={order}"
        for accept in accepts * 2:
            media = MD if accept == MD and not args.baseline else "text/html"
            get_headers, body = check(probe(target, accept), 200, media, robots=ROBOTS, vary=not args.baseline)
            if media == MD:
                assert get_headers["content-type"] == "text/markdown; charset=utf-8", get_headers
                assert body == md_body, target
            else:
                assert b"<html" in body.lower(), target
            head_headers, head_body = check(probe(target, accept, method="HEAD"), 200, media, robots=ROBOTS,
                                           vary=not args.baseline)
            assert not head_body, target
            for header in ("content-type", "vary", "x-robots-tag", "cache-control", "etag"):
                assert head_headers.get(header) == get_headers.get(header), (header, head_headers, get_headers)

if args.baseline:
    raise SystemExit(0)

for accept, media in (
    ("*/*", "text/html"),
    ("text/*", "text/html"),
    ("text/markdown;q=0, */*;q=1", "text/html"),
    ("text/markdown;q=0.4, text/html;q=0.8", "text/html"),
    ("text/markdown, text/html", "text/html"),
    ("text/html;q=0.2, text/markdown;q=0.8, */*;q=1", MD),
    ("text/markdown, */*", MD),
):
    check(probe("/", accept), 200, media, robots=ROBOTS, vary=True)

html_headers, _ = check(probe("/", HTML), 200, "text/html", robots=ROBOTS, vary=True)
md_headers, _ = check(probe("/", MD), 200, MD, robots=ROBOTS, vary=True)
if args.local or all("etag" in headers for headers in (html_headers, md_headers)):
    assert html_headers["etag"] != md_headers["etag"], (html_headers, md_headers)
    for accept, media, own, other in ((HTML, "text/html", html_headers, md_headers), (MD, MD, md_headers, html_headers)):
        check(probe("/", accept, **{"If-None-Match": other["etag"]}), 200, media, robots=ROBOTS, vary=True)
        _, body = check(probe("/", accept, **{"If-None-Match": own["etag"]}), 304, robots=ROBOTS, vary=True)
        assert not body

for path, target in (("/konsultacja", "/wspolpraca"), ("/index.html?x=1", "/?x=1"), ("/sales-atlas-system/", "/sales-atlas-system")):
    headers, _ = check(probe(path, MD), 301, robots=ROBOTS)
    destination = urlsplit(headers["location"])
    assert destination.path + ("?" + destination.query if destination.query else "") == target, headers

for path in ("/t78-missing-page", "/O-MNIE"):
    check(probe(path, MD), 404, "text/html", robots=ROBOTS)

for path, media in (
    ("/robots.txt", "text/plain"),
    ("/llms.txt", "text/plain"),
    ("/sitemap.xml", "application/xml"),
    ("/sitemap-pl.xml", "application/xml"),
    ("/blog/rss.xml", "application/xml"),
):
    headers, _ = check(probe(path, MD), 200, media, robots=ROBOTS)
    assert "accept" not in {part.strip().lower() for part in headers.get("vary", "").split(",")}, headers

headers, _ = check(probe("/api/form", MD), 405)
assert headers.get("allow") == "POST", headers

if args.local or args.production:
    host = "www.zawlodzki.pl" if args.local else None
    check(probe("/index.md", MD, host=host), 200, MD, robots="noindex")
    check(probe("/", MD, host=host), 200, MD, vary=True)
    check(probe("/", HTML, host=host), 200, "text/html", vary=True)
    path = "/podziekowanie-konsultacja"
    _, html = check(probe(path, HTML, host=host), 200, "text/html", vary=True)
    assert b'<meta name="robots" content="noindex"' in html
    for method in ("GET", "HEAD"):
        check(probe(path, MD, host=host, method=method), 200, MD, robots="noindex", vary=True)

if args.local:
    _, html = check(probe("/404", HTML), 200, "text/html", robots=ROBOTS)
    _, fallback = check(probe("/404", MD), 200, "text/html", robots=ROBOTS)
    assert fallback == html
