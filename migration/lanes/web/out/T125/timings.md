# T125 preview render timings

## Method

`measure-data.ts` in this folder sends the preview's Sanity query and times each data step of one render in Node 26.13.1 on an Apple Silicon Mac. It uses `@sanity/client` 8.10.1, the version the preview Worker ships. It reads the public `development` dataset with the `published` perspective, because no draft-reading token was available for local work. Drafts have the same document shape and roughly the same size. Each "before" row is the median of 5 runs and each "after" row the median of 3, measured on 2026-11-21.

```sh
cd apps/web
node --experimental-strip-types ../../migration/lanes/web/out/T125/measure-data.ts before /blog/aplikacje-ktore-sprawdzilem-w-4-biznesach 5
node --experimental-strip-types ../../migration/lanes/web/out/T125/measure-data.ts after / 3
```

- `query`: network round trip and JSON decoding of the result plus its source map.
- `stega`: `stegaEncodeSourceMap` with the preview's display-field filter.
- `select` and `parse`: `selectPreviewDocuments` and `fetchSite`'s parser.

HTML rendering was not split out locally. That needs the preview Worker running under `wrangler dev` with a draft-reading token, and the owner chose to skip that locally. The production baseline below comes from `wrangler tail zawlodzki-web-preview` on 2026-11-20 and is quoted in the task.

## Baseline in production (2026-11-20, before)

| Route | Wall time | CPU | iframe `load` |
|---|---|---|---|
| `/blog/aplikacje-ktore-sprawdzilem-w-4-biznesach` | ~6.3 s | ~3.7 s | ~7 s |

## Data side, before and after (local, `development`)

| Route | Mode | Result | Source map | query | stega | select | parse |
|---|---|---|---|---|---|---|---|
| post `/blog/aplikacje-ktore-sprawdzilem-w-4-biznesach` | before | 3262 KB | 764 KB | 674 ms | 989 ms | 27 ms | 31 ms |
| post | after | 510 KB | 929 KB | 608 ms | 63 ms | 4 ms | 10 ms |
| page `/` | before | 3262 KB | 764 KB | 718 ms | 898 ms | 21 ms | 19 ms |
| page `/` | after | 513 KB | 929 KB | 551 ms | 76 ms | 6 ms | 9 ms |

Before the change, post bodies accounted for 2.6 MB of the 3.2 MB result. Every request loaded all 80 full posts and 28 full pages and stega-encoded every Portable Text span, although a render shows one document. Other posts' FAQ blocks added another 275 KB. Route parsing stays under 1 ms either way.

The source map grows slightly after the change, because the conditional projection is described per field. It is plain JSON, which the client parses without walking it.

## What changed

`previewQuery` in `apps/web/src/preview/site.ts` rewrites the production site query for one route. Pages other than the route's page lose `sections`. Posts other than the route's post keep their first body block and no FAQ. Routing fields, cards, related posts, entity data, assets and every other key stay as `fetchSite` defines them. The first body block keeps `selectPreviewDocuments` treating an empty-bodied post as incomplete.

## Deployed preview, after (2026-11-21)

The owner approved the deploy. Version `c68a7ac9-fa4d-4c9a-9aa7-45cf3716654d` of `zawlodzki-web-preview` is serving `preview.zawlodzki.pl` with the `production` dataset and the drafts perspective. Timings come from `wrangler tail zawlodzki-web-preview --format json` (`cpuTime`, `wallTime` and `eventTimestamp` per request) while the routes were opened in Presentation in hosted Studio (`sanity.io` dashboard), signed in as the owner.

| Route | Request | CPU | Wall | Handshake start to last resource done |
|---|---|---|---|---|
| post `/blog/aplikacje-ktore-sprawdzilem-w-4-biznesach` | first open | 220 ms | 865 ms | 1404 ms (8 requests) |
| page `/` | first open | 196 ms | 1032 ms | 1615 ms (13 requests) |
| page `/` | iframe reload button | 220 ms | 955 ms | n/a (assets cached) |

The last column runs from the `/api/preview` request start to the end of the last resource the iframe requested. The browser fires the iframe `load` event right after that. The Presentation iframe is a cross-origin frame inside the cross-origin Studio frame, so the hosted dashboard page cannot read its `load` time directly, and the server-side timeline stands in for it. Both routes finish well under the 3 s target. The post had taken about 7 s before.

`presentation-home-deployed.jpg` shows the home page rendered in Presentation with Edit on, from the same session.

Before versus after for the post, deployed: CPU 3.7 s to 220 ms, wall time 6.3 s to 0.87 s.
