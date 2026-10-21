#!/usr/bin/env python3
"""Audit JSON-LD captured by crawl.mjs.

Usage: python3 -I jsonld_audit.py <crawl-out-dir>
Reads <dir>/urls.json and <dir>/html/*.html, writes <dir>/jsonld-audit.json and prints a report.
Checks: block count and location, @graph usage, @id definitions vs references (dangling refs),
the same @id defined differently across pages, per-type property gaps, deprecated rich-result types,
and hard-coded asset hosts that will break on migration.
"""
import json, re, sys, collections, os
from urllib.parse import urlparse

out = sys.argv[1]
recs = json.load(open(os.path.join(out, 'urls.json')))

def slug(u):
    p = urlparse(u)
    s = re.sub(r'[^a-z0-9._-]+', '_', p.path.strip('/'), flags=re.I) or 'index'
    if p.query:
        s += '_q' + re.sub(r'[^a-z0-9]+', '_', '?' + p.query, flags=re.I)
    return s

def walk(node, fn, parent_key=None):
    if isinstance(node, list):
        for n in node: walk(n, fn, parent_key)
    elif isinstance(node, dict):
        fn(node, parent_key)
        for k, v in node.items():
            if isinstance(v, (dict, list)): walk(v, fn, k)

DEPRECATED = {
    'HowTo': 'HowTo rich results removed by Google (2023). Harmless, no SERP feature.',
    'SearchAction': 'Sitelinks search box retired by Google (Nov 2024). Harmless, no SERP feature.',
    'FAQPage': 'FAQ rich results limited to authoritative gov/health sites since 2023. Still useful for AEO parsing.',
}
REQUIRED = {
    'BlogPosting': ['headline', 'datePublished', 'dateModified', 'author', 'image', 'publisher', 'mainEntityOfPage'],
    'Service': ['name', 'provider', 'description'],
    'WebPage': ['url', 'name', 'isPartOf'],
    'BreadcrumbList': ['itemListElement'],
    'Person': ['name', 'url', 'sameAs'],
}

defs = collections.defaultdict(dict)    # @id -> {page: canonical json of definition}
refs = collections.defaultdict(set)     # @id -> pages referencing it
report = {'pages': {}, 'types': collections.Counter(), 'type_pages': collections.defaultdict(list)}
asset_hosts = collections.Counter()

for r in recs:
    path = os.path.join(out, 'jsonld', slug(r['url']) + '.json')
    if not os.path.exists(path):
        report['pages'][r['url']] = {'blocks': 0}
        continue
    blocks = json.load(open(path))
    html = open(os.path.join(out, 'html', slug(r['url']) + '.html'), encoding='utf-8', errors='replace').read()
    head_end = html.lower().find('</head>')
    positions = [m.start() for m in re.finditer(r'application/ld\+json', html)]
    page = {
        'blocks': len(blocks),
        'in_head': sum(1 for p in positions if p < head_end),
        'in_body': sum(1 for p in positions if p > head_end),
        'graph_blocks': sum(1 for b in blocks if isinstance(b, dict) and '@graph' in b),
        'issues': [],
        'types': [],
    }
    local_defs, local_refs = set(), set()

    def visit(n, parent_key):
        t = n.get('@type')
        nid = n.get('@id')
        if t:
            for tt in ([t] if isinstance(t, str) else t):
                page['types'].append(tt)
                report['types'][tt] += 1
                if r['url'] not in report['type_pages'][tt]:
                    report['type_pages'][tt].append(r['url'])
                if tt == 'BlogPosting' and nid and '#' not in nid:
                    page['issues'].append('BlogPosting @id equals the page URL (no #fragment)')
                for prop in REQUIRED.get(tt, []):
                    if prop not in n:
                        page['issues'].append(f'{tt} missing {prop}')
            if nid:
                local_defs.add(nid)
                defs[nid][r['url']] = json.dumps(n, sort_keys=True, ensure_ascii=False)
        elif nid and len(n) == 1:
            local_refs.add(nid)
            refs[nid].add(r['url'])
        for k, v in n.items():
            if isinstance(v, str) and v.startswith('http'):
                asset_hosts[urlparse(v).netloc] += 1

    walk(blocks, visit)
    for d in sorted(local_refs - local_defs):
        page['issues'].append(f'dangling @id reference {d}')
    tc = collections.Counter(page['types'])
    if tc.get('BlogPosting') and not tc.get('WebPage'):
        page['issues'].append('BlogPosting without WebPage node')
    for t, msg in DEPRECATED.items():
        if tc.get(t):
            page['issues'].append(f'{t}: {msg}')
    if len(blocks) > 1 and page['graph_blocks'] < len(blocks):
        page['issues'].append(f'{len(blocks)} separate JSON-LD blocks, {len(blocks) - page["graph_blocks"]} not in an @graph')
    report['pages'][r['url']] = page

conflicts = {}
for nid, by_page in defs.items():
    variants = collections.Counter(by_page.values())
    if len(variants) > 1:
        conflicts[nid] = {'variants': len(variants), 'pages': sorted(by_page)}

summary = {
    'pages_with_jsonld': sum(1 for p in report['pages'].values() if p.get('blocks')),
    'pages_total': len(report['pages']),
    'type_counts': report['types'].most_common(),
    'type_pages': {k: sorted(v) for k, v in report['type_pages'].items()},
    'ids_defined': sorted(defs),
    'id_conflicts': conflicts,
    'value_hosts': asset_hosts.most_common(),
    'issue_counts': collections.Counter(i if not i.startswith('dangling') else i for p in report['pages'].values() for i in p.get('issues', [])).most_common(),
    'pages': report['pages'],
}
json.dump(summary, open(os.path.join(out, 'jsonld-audit.json'), 'w'), ensure_ascii=False, indent=1)
for k in ('pages_with_jsonld', 'pages_total', 'type_counts', 'id_conflicts', 'value_hosts', 'issue_counts'):
    print(k, json.dumps(summary[k], ensure_ascii=False, indent=1)[:4000])
