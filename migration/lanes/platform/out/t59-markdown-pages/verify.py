"""Run after verify-web web.sh up --port 8790. Writes public HTTP evidence only."""
from pathlib import Path
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.error import HTTPError

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

out = Path(__file__).parent
opener = build_opener(NoRedirect)
paths = ['/index.md', '/sales-atlas-system.md', '/blog/automatyzacja-sprzedazy.md', '/polityka-prywatnosci.md']
cases = [(path, None, 200) for path in paths]
cases += [(path, None, 200) for path in ['/', '/sales-atlas-system', '/blog/automatyzacja-sprzedazy', '/polityka-prywatnosci']]
cases += [('/konsultacja', None, 301), ('/index.md/?x=1', None, 301), ('/missing-t59.md', None, 404), ('/INDEX.md', None, 404), ('/index.md', 'www.zawlodzki.pl', 200)]
lines = ['host\tpath\tstatus\tlocation\tx-robots-tag\tcontent-type']
previews = []
for path, host, expected in cases:
    request = Request('http://127.0.0.1:8790' + path, headers={'Host': host} if host else {})
    try:
        response = opener.open(request)
    except HTTPError as error:
        response = error
    assert response.code == expected, (path, response.code)
    headers = response.headers
    if path in paths:
        assert headers['Content-Type'] == 'text/markdown; charset=utf-8'
        assert headers['X-Robots-Tag'] == ('noindex' if host else 'noindex, nofollow')
        body = response.read().decode()
        assert body.startswith('# ') and 'Canonical: https://www.zawlodzki.pl/' in body
        previews += [path, f'Status: {response.code}', f'Content-Type: {headers["Content-Type"]}', *body.splitlines()[:16], '']
    elif expected == 200:
        assert headers['Content-Type'] == 'text/html; charset=utf-8'
        assert 'rel="alternate" type="text/markdown"' in response.read().decode()
    if expected == 301:
        target = '/wspolpraca' if path == '/konsultacja' else '/index.md?x=1'
        assert headers['Location'] == 'http://127.0.0.1:8790' + target
    lines.append('\t'.join([host or '127.0.0.1', path, str(response.code), headers.get('Location', '-'), headers.get('X-Robots-Tag', '-'), headers.get('Content-Type', '-')]))
(out / 'probes.tsv').write_text('\n'.join(lines) + '\n')
(out / 'markdown-probes.txt').write_text('\n'.join(previews))
print('\n'.join(lines))
