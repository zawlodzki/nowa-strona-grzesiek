# T55 live evidence

Measured 2026-11-12 with Chromium/Playwright through verify-web and the local Worker at port 8791. T3 preview failed because host AppArmor blocks its browser sandbox; used the existing verify-web Chromium harness. No astro dev.

| Viewport | Staging before px / ch | Local after px / ch | Reference px / ch |
| --- | --- | --- | --- |
| 1440 | 720.0 / 55.4 | 896.0 / 68.9 | 745.0 / 74.5 |
| 1280 | 722.4 / 55.6 | 802.4 / 66.9 | 672.0 / 67.2 |

ch is measured using a 1ch DOM probe with the paragraph’s computed font after document.fonts.ready. Satoshi and Switzer have different glyph metrics. The new column deliberately exceeds reference pixels to preserve Satoshi at 18–20px while achieving 65–75ch. Mobile type stays unchanged.

## Reference findings

At 1440 the reference grid is 212.9 / 745.0 / 266.1px; at 1280 it is 192 / 672 / 240px, with 48px gaps. It changes to two columns below 1200px and to a vertical flex layout below 768px. The side panels stick at 112px. Related links are present in the sidebar before and after scrolling. Unlike the requested behavior, the reference actually uses overflow:auto and a viewport max-height: at 600px high its TOC is 464px tall with 741px of content. We preserve its reading hierarchy, but explicitly remove that scrolling limitation. Raw results: study.json and reference-scroll.json.

## Local verification

verification.json records all five viewport sizes, aligned header/TOC x coordinates, no horizontal overflow, CTA hidden below 1280, TOC expanded from 896px and collapsed at 390px. Mobile disclosure opens by click; share dialog keeps six equal tiles and real SVG icons. CTA copy, CtaBand and existing reveal code are unchanged.

At 1440 and 1280 after the midpoint, related posts have inert=false and opacity=1; the right panels are 720px / 712px high with equal scrollHeight and clientHeight, overflow:visible, max-block-size:none, and sticky top=112px. See related-*-no-preference.png. The tall TOC is static. At 600px viewport height the right panel also becomes static and moves from y=-6695 to -7278 with page scroll (tall.json). The fallback observes actual panel size and viewport resize rather than imposing a fixed height.

Reveal tests cross the midpoint in both directions for normal and reduced motion: 240ms opacity/transform versus 0s. No page errors. No layout-shifting animation was added.

compare-*.png place current staging on the left and the new local version on the right, at the same article-start scroll position. new-*.png cover 1440/1280/1100/900/390. reference-1440.png is the live reference.

Validation: Worker build passed; verify-web doctor healthy; article HTTP 200, X-Robots-Tag noindex, nofollow; astro check 0 errors / 0 warnings / 1 existing hint. Impeccable detector returned []. tasks.py check passes. web.sh down completed for port 8791.
