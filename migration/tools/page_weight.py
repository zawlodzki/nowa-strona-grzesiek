#!/usr/bin/env python3
"""Static page-weight and header snapshot for one URL (no JS execution).

Usage: python3 -I page_weight.py <url> <out.json>
Fetches the HTML, then every <script src>, stylesheet, <img src> (srcset ignored: the browser picks one),
and fonts referenced from same-page stylesheets. Records transfer size (compressed, as served with
Accept-Encoding: gzip, br), content-type, cache-control, and the HTML response's security headers.
Scripts injected at runtime (GTM, consent banner children) are not counted.
"""
import json, re, sys, urllib.request, urllib.parse, collections, concurrent.futures as cf

url, out = sys.argv[1], sys.argv[2]
UA = 'Mozilla/5.0 (compatible; zawlodzki-migration-crawler/1.0)'

def get(u, enc=True):
    req = urllib.request.Request(u, headers={'User-Agent': UA, 'Accept-Encoding': 'gzip, br' if enc else 'identity'})
    with urllib.request.urlopen(req, timeout=30) as r:
        body = r.read()
        return r.status, dict((k.lower(), v) for k, v in r.headers.items()), body

status, headers, raw = get(url)
_, _, html_b = get(url, enc=False)
html = html_b.decode('utf-8', 'replace')

def absu(u): return urllib.parse.urljoin(url, u.replace('&amp;', '&'))
res = []
for m in re.finditer(r'<script\b[^>]*\ssrc="([^"]+)"', html): res.append(('script', absu(m.group(1))))
for m in re.finditer(r'<link\b[^>]*>', html):
    t = m.group(0)
    if re.search(r'rel="?stylesheet', t):
        h = re.search(r'href="([^"]+)"', t)
        if h: res.append(('css', absu(h.group(1))))
for m in re.finditer(r'<img\b[^>]*>', html):
    t = m.group(0)
    s = re.search(r'\ssrc="([^"]+)"', t)
    if s and not s.group(1).startswith('data:'):
        lazy = 'loading="lazy"' in t
        res.append(('img-lazy' if lazy else 'img', absu(s.group(1))))
res = list(dict.fromkeys(res))

def fetch(item):
    kind, u = item
    try:
        st, h, b = get(u)
        return {'kind': kind, 'url': u, 'status': st, 'bytes': len(b), 'type': h.get('content-type', ''),
                'encoding': h.get('content-encoding', ''), 'cache': h.get('cache-control', ''), 'body': get(u, enc=False)[2] if kind == 'css' else None}
    except Exception as e:
        return {'kind': kind, 'url': u, 'status': str(e), 'bytes': 0, 'type': '', 'encoding': '', 'cache': '', 'body': None}

with cf.ThreadPoolExecutor(8) as ex:
    items = list(ex.map(fetch, res))
fonts = []
for it in items:
    if it['kind'] == 'css' and it['body']:
        css = it['body'].decode('utf-8', 'replace')
        for f in re.findall(r'url\(["\']?([^)"\']+\.(?:woff2?|ttf|otf)[^)"\']*)', css):
            fonts.append(('font', urllib.parse.urljoin(it['url'], f)))
with cf.ThreadPoolExecutor(8) as ex:
    items += list(ex.map(fetch, list(dict.fromkeys(fonts))))
for it in items: it.pop('body', None)

def ext(u):
    p = urllib.parse.urlparse(u).path.lower()
    m = re.search(r'\.([a-z0-9]+)$', p)
    return m.group(1) if m else '?'

by_kind = collections.defaultdict(lambda: [0, 0])
for it in items:
    by_kind[it['kind']][0] += 1; by_kind[it['kind']][1] += it['bytes']
img_formats = collections.Counter(ext(it['url']) for it in items if it['kind'].startswith('img'))
sec = {k: headers.get(k, '') for k in ['strict-transport-security', 'content-security-policy', 'x-frame-options', 'x-content-type-options',
                                        'referrer-policy', 'permissions-policy', 'cross-origin-opener-policy', 'cache-control',
                                        'surrogate-control', 'cf-cache-status', 'age', 'server', 'x-wf-region', 'content-encoding', 'vary', 'alt-svc']}
summary = {
    'url': url, 'status': status, 'html_bytes_transfer': len(raw), 'html_bytes_raw': len(html_b),
    'inline_script_bytes': sum(len(m.group(1)) for m in re.finditer(r'<script\b(?![^>]*\ssrc=)[^>]*>([\s\S]*?)</script>', html)),
    'inline_style_bytes': sum(len(m.group(1)) for m in re.finditer(r'<style\b[^>]*>([\s\S]*?)</style>', html)),
    'response_headers': sec,
    'by_kind': {k: {'count': v[0], 'bytes': v[1]} for k, v in by_kind.items()},
    'total_static_bytes': len(raw) + sum(it['bytes'] for it in items),
    'image_formats': img_formats.most_common(),
    'img_without_lazy': sum(1 for it in items if it['kind'] == 'img'),
    'img_without_dimensions': sum(1 for m in re.finditer(r'<img\b[^>]*>', html) if not re.search(r'\swidth=', m.group(0))),
    'resources': sorted(items, key=lambda i: -i['bytes']),
}
json.dump(summary, open(out, 'w'), indent=1)
print(json.dumps({k: v for k, v in summary.items() if k != 'resources'}, indent=1))
for it in summary['resources'][:15]: print(it['bytes'], it['kind'], it['type'], it['url'][:110])
