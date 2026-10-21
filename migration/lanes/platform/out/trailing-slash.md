# Trailing slash on Cloudflare Workers static assets (T02)

Measured 2026-10-21 with `wrangler dev --local` (wrangler 4.151, Astro 7.4.1) on probe pages `/o-mnie`, `/blog` (index) and `/blog/x`. Columns are request path, status, Location.

## Live Webflow site (target behaviour)

```
/o-mnie/       301 https://www.zawlodzki.pl/o-mnie
/blog/         301 https://www.zawlodzki.pl/blog
/index.html    200 (canonical to /)
/o-mnie.html   404
```

## Matrix: build.format x html_handling, assets only

```
## build.format=file html_handling=auto-trailing-slash
/              200 
/index.html    307 http://localhost:8790/
/o-mnie        200 
/o-mnie/       307 http://localhost:8790/o-mnie
/o-mnie.html   307 http://localhost:8790/o-mnie
/blog          200 
/blog/         307 http://localhost:8790/blog
/blog/x        200 
/blog/x/       307 http://localhost:8790/blog/x
/O-MNIE        404 
/nope          404 
## build.format=file html_handling=drop-trailing-slash
/              200 
/index.html    307 http://localhost:8791/
/o-mnie        200 
/o-mnie/       307 http://localhost:8791/o-mnie
/o-mnie.html   307 http://localhost:8791/o-mnie
/blog          200 
/blog/         307 http://localhost:8791/blog
/blog/x        200 
/blog/x/       307 http://localhost:8791/blog/x
/O-MNIE        404 
/nope          404 
## build.format=directory html_handling=auto-trailing-slash
/              200 
/index.html    307 http://localhost:8792/
/o-mnie        307 http://localhost:8792/o-mnie/
/o-mnie/       200 
/o-mnie.html   307 http://localhost:8792/o-mnie/
/blog          307 http://localhost:8792/blog/
/blog/         200 
/blog/x        307 http://localhost:8792/blog/x/
/blog/x/       200 
/O-MNIE        404 
/nope          404 
## build.format=directory html_handling=drop-trailing-slash
/              200 
/index.html    307 http://localhost:8793/
/o-mnie        200 
/o-mnie/       307 http://localhost:8793/o-mnie
/o-mnie.html   307 http://localhost:8793/o-mnie
/blog          200 
/blog/         307 http://localhost:8793/blog
/blog/x        200 
/blog/x/       307 http://localhost:8793/blog/x
/O-MNIE        404 
/nope          404 
```

## Chosen: format file, drop-trailing-slash, Worker upgrades same-origin 307 to 301

```
## build.format=file html_handling=drop-trailing-slash + Worker 307->301
/              200 
/index.html    301 http://localhost:8799/
/o-mnie        200 
/o-mnie/       301 http://localhost:8799/o-mnie
/o-mnie.html   301 http://localhost:8799/o-mnie
/blog          200 
/blog/         301 http://localhost:8799/blog
/blog/x        200 
/blog/x/       301 http://localhost:8799/blog/x
/blog/x/?a=1   301 http://localhost:8799/blog/x?a=1
/O-MNIE        404 
/nope          404 

404 body h1: <h1>Nie znaleziono strony
```

## Findings

- Every combination serves the canonical URL without a trailing slash except `directory` + `auto-trailing-slash`, which adds one.
- Static assets canonicalize with **307**, not 301. Webflow used 301. A Worker in front (`run_worker_first: true`, `src/worker/canonical.ts`) upgrades same-origin 307/308 redirects to 301. Query strings survive.
- `/index.html` now gets a 301 to `/` (url-map row `redirect-301`), and `/o-mnie.html` a 301 to `/o-mnie` (Webflow: 404). Both are improvements.
- Uppercase paths stay 404, matching Webflow.
- Unknown paths return 404 with the `404.astro` page.
