# T46 verification

2026-11-11, task/T46-contact-phone-links. Compare PNGs show live Webflow left and local wrangler Worker right at the named CSS viewport width, without rescaling. Home includes the contact form/details block; kontakt includes its contact channels. Optional cookies were rejected; sticky/fixed navigation overlays were hidden only during capture to keep links visible. Existing layout differences remain outside this task.

`measurements.json` records labels, hrefs and computed normal styles on live/new plus new hover colors and focus outlines. All channel links have `text-decoration-line: none`. Both new pages display `+48 571 088 338` with `tel:+48571088338`. Atlas Blue normal/hover/active colors use the existing tokens; focus uses a 2px currentColor outline.

Worker: verify-web up/doctor/probe/shot/down on 8790. Probes are in `probes.tsv`. Astro check: 0 errors, 0 warnings (one existing worker hint). No production writes or form submissions.
