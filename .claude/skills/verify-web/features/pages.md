# Pages render

A visitor who opens a site URL gets a 200 HTML page in Polish (`<html lang="pl">`), with a page-specific `<title>` and one `<h1>`, the favicon, and the content for that URL. Today only the home page exists. After T18, every `keep` row in `migration/contracts/url-map.csv` must render at its exact path.

## Sub-features

- `home` means `/` returns 200 with title `Grzegorz Zawłodzki` and h1 `Grzegorz Zawłodzki`.
- `home-query` means `/?x=1` returns the same page with 200 and no redirect.
- `favicon` means `/favicon.svg` (`image/svg+xml`) and `/favicon.ico` return 200.
- `keep-urls` means every `keep` path in `url-map.csv` returns 200 with no redirect hop. This needs T18.
- `mobile` means the page has no horizontal overflow at 375 px wide.

## How to get to it (user POV)

- Type or click a URL such as `/`, `/blog` or `/o-mnie`.
- Follow an internal link from another page.
- Arrive from a search result, the same URL with tracking query strings.

## Driving it with web.sh

Preconditions:

- `web.sh doctor --port 8790` prints `doctor: healthy`.
- For `keep-urls`, T18 is merged and the Sanity dataset has content. Until then, record it as failed: precondition missing (T18).

- **Home.** Open `/`. Run `web.sh probe / --port 8790 --label home`. The line reads `200`, location `-`, content type `text/html; charset=utf-8`, title `Grzegorz Zawłodzki`.
- **Home renders.** Look at it. Run `web.sh shot / --port 8790 --label home`. Open `home-w1280.png` with Read. It shows the heading `Grzegorz Zawłodzki`. `home-w1280.dom.html` contains `<html lang="pl">` and exactly one `<h1>`.
- **Query string.** Open with tracking params. Run `web.sh probe '/?x=1' --port 8790 --label home-query`. The status is `200` and location is `-`.
- **Favicon.** Run `web.sh probe /favicon.svg --port 8790` and `web.sh probe /favicon.ico --port 8790`. Both return `200` with an image content type.
- **Mobile.** Run `web.sh shot / --port 8790 --width 375 --label home`. The PNG shows no clipped text or sideways scroll.
- **Every keep URL** (T18+). Run:
  ```bash
  python3 -I -c "import csv;[print(r['old_path']) for r in csv.DictReader(open('migration/contracts/url-map.csv')) if r['action']=='keep']" \
    | while read -r p; do .claude/skills/verify-web/scripts/web.sh probe "$p" --port 8790; done
  ```
  Every line in `probes.tsv` must show `200` and location `-`. Also check the title against the `title` column of `url-map.csv`. There are 108 keep rows as of 2026-10-21.

## Gotchas

- `astro dev` serves `/index.html` and trailing-slash URLs differently from the Worker. A page "working" there proves nothing about production.
- `build.format: 'file'` means `/blog` is served from `dist/blog.html`. A route written as a directory index (`blog/index.astro`) still builds to `blog.html` here. Check the probe, not the file tree.
- After editing `src/`, `doctor` warns that `dist` is stale. Run `down` then `up`. Don't trust `--no-build`.
- Every page currently sets `<meta name="robots" content="noindex">` (`Base.astro` `noindex` prop). That is expected during the build-out. See [robots-by-host.md](./robots-by-host.md).
