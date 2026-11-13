# Decisions

Written only by the coordinator. Newest at the bottom.

| # | Date | Decision | Decided by | Affects |
|---|---|---|---|---|
| 1 | 2026-10-21 | EN lives under `/en/` on www.zawlodzki.pl; zawlodzki.com keeps 301 | user | S, E, C |
| 2 | 2026-10-21 | Design scope is refine, not redesign | user | D |
| 3 | 2026-10-21 | Person is the primary JSON-LD entity; WebSite.publisher = Person; Wellbiz stays as worksFor | user | S, `entities.json` |
| 4 | 2026-10-21 | EN ships as a separate release after PL passes G5 | user | E |
| 5 | 2026-10-21 | EN scope: home, services, /o-mnie, /kontakt, /wspolpraca, /sales-atlas-system, top 10 posts by GSC clicks (`url-map.csv` en_planned) | user | E, S |
| 6 | 2026-10-21 | `/search` removed, 301 to `/blog`; SearchAction dropped | user | S |
| 7 | 2026-10-21 | All CSS is written with the `good-css` skill loaded | user | D, P, every lane |
| 8 | 2026-10-21 | Block set is 12 blocks (`blocks.json`). "Krok N", "Moduł N", "Tygodnie" are repeated `feature` blocks, not a dedicated steps block, because Webflow stores them as independent sections with their own media | coordinator | C, D, M |
| 9 | 2026-10-21 | Animated diagrams are code components selected by key, not editable content | coordinator | C, D, M |
| 10 | 2026-10-21 | `/401` removed; `/404` becomes the site 404 page; thank-you pages stay, noindex and out of the sitemap | coordinator | S, P |
| 11 | 2026-10-21 | GSC data and unpublished drafts (`/narzedzia`, `/case-study-4hfix`) stay out of the public repo | coordinator | all |
| 12 | 2026-10-21 | Work is split into a task board (`migration/tasks/`) that independent agents claim through git, per `AGENTS.md`. Lane sessions started by one coordinator are dropped | user | all |
| 13 | 2026-10-21 | `tokens.json` promoted from `lanes/design/out/` to `contracts/`. `apps/web/src/styles/build-tokens.mjs` compiles it to `tokens.css`, with hex written as oklch that round-trips to the same hex. Root font size stays 100%; no `scrollbar-gutter: stable`, because Chrome subtracts it from `vw` and breaks the Fixed-Ends Rule | T08 | D, every lane writing CSS |
| 14 | 2026-10-21 | User confirms zawlodzki.pl nameservers have moved to Cloudflare; production still points to Webflow. Creating new subdomains, including preview, and attaching them to their intended services is authorized. Existing records, apex/www cutover and DNSSEC changes still require explicit approval. | user | P, T, T19, T22 |
| 15 | 2026-11-09 | Blocks gain fields for live text the page import dropped: `logoStrip.tagline` and `intro`; `contactForm.intro` and, for the `full` variant, `calendar`, `consultation` and `channels` (groups of social, e-mail, phone, Signal and WhatsApp links with notes). New `postList` block lists the latest N posts of one `kind`; it has no `match` rule because live renders it inside a `blog-article` section, so T20's importer splits it off. User decision of 2026-11-09 to restore all dropped text | T30 | C, D, M, T20 |

| 2026-11-10 | T32 | Add optional hero badgeImage/badgeSize and reusable tabs. Plain ordered prose uses existing richText to preserve DOM order without another field. State cards use nearest existing tokens; palette is outside owns. |

| 16 | 2026-11-10 | T32 review: tab items gain optional tagline label; contentSection items become optional so ordered prose stays in intro with separate section heading/tagline. Catalog uses the identical ContentSection data path. | T32 | C, D, M |

| 2026-11-11 | T34 | Add opt-in Feature layout `article` (one prose flow, sticky right portrait), ContactForm `channels` variant without form; reuse channel groups. Testimonial adds optional contentImage `authorImage` and HTTPS `linkedinUrl`, independent of recommendation `image` / source `url`. Existing variants unchanged. |

| 2026-11-11 | T37 | Feature gains optional mediaCaption for a caption under the diagram rather than in body prose. Contact forms drop marketing-emails; all 32 attribution fields and newsletter remain. Promo cards reuse the existing animated Sales Atlas badge for that target. |

| 2026-11-12 | T75 | Record T53 fields: `contactForm.copy` and `newsletterSignup.copy` are optional objects of form texts (labels, placeholders, submit and wait labels, privacy note, newsletter heading and legal links). An empty field falls back to the copy in code. formId, `/api/form`, n8n and Turnstile stay in code. | T53, T75 | C, D |

| 2026-11-12 | T76 | Font stacks gain metric-matched fallback families: heading `'Erode Variable', 'Erode Fallback', Georgia, serif`, body `'Satoshi Variable', 'Satoshi Fallback', system-ui, sans-serif`. The fallbacks are `local()` Georgia/Arial faces with size-adjust and ascent/descent overrides in `apps/web/src/styles/fonts.css`, so the font swap does not move layout once CSS stops blocking first paint. Web fonts unchanged. | T76 | D |

| 2026-11-13 | T94 | Record T54 block `sectionRef` ("Sekcja wspólna"): one required field `section`, a reference to a `reusableSection` document filtered to the page's language. No Webflow match rule and no Astro component; the site inlines the referenced block before rendering. `reusableSection` stays a document type, not a page block. | T54, T94 | C, D, M |
