# Not found page

A visitor on a path that doesn't exist gets HTTP **404** (never a soft 200) and the branded Polish page with the title and h1 `Nie znaleziono strony` and a link `Wróć na stronę główną` back to `/`. The page is `noindex`.

## Sub-features

- `status-404` means unknown paths such as `/nope`, `/nope/` and `/a/b/c` return 404 with no redirect.
- `branded-body` means the body is the `404.astro` page, with title and h1 `Nie znaleziono strony`.
- `home-link` means the link `Wróć na stronę główną` leads to `/`, which returns 200.
- `noindex` means the body has `<meta name="robots" content="noindex">`.

## How to get to it (user POV)

- Type or follow a broken or deleted URL.
- Mistype the case of a real URL (see `uppercase-404` in [canonical-urls.md](./canonical-urls.md)).

## Driving it with web.sh

Preconditions:

- `web.sh doctor --port 8790` prints `doctor: healthy`.

- **Unknown path.** Run `web.sh probe /nope --port 8790`. You get `404`, location `-`, title `Nie znaleziono strony`.
- **Unknown with slash.** Run `web.sh probe /nope/ --port 8790`. You get `404` directly, with no redirect to `/nope` first.
- **Nested.** Run `web.sh probe /a/b/c --port 8790`. You get `404`.
- **Rendered.** Run `web.sh shot /nope --port 8790 --width 375`. The PNG shows the heading `Nie znaleziono strony` and the link. `_nope-w375.dom.html` contains `href="/"` and `content="noindex"`.
- **Way back.** In the browser pane, navigate to `http://127.0.0.1:8790/nope`, `find` the link `Wróć na stronę główną` and click it by ref. `get_page_text` then shows `Grzegorz Zawłodzki`. Also run `web.sh probe / --port 8790` for an on-disk record.

## Gotchas

- `/404` itself returns **200** (it is a real built page), and `/404.html` gives 301 to `/404`. Don't use `/404` as the "unknown path" probe. Decide whether `/404` should stay reachable when T13 writes the sitemap, and keep it out of the sitemap.
- `not_found_handling: "404-page"` in `wrangler.jsonc` serves `dist/404.html`. If the build stops emitting `404.html`, unknown paths fall back to a bare body. The probe title catches this.
