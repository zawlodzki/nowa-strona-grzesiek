# T95 shared form and newsletter sections

On 2026-11-13, the published Sanity dataset `production` contained 16 contact forms, one contact block with channels only, and six newsletter blocks. The inventory grouped complete block content by language and excluded only the outer section key and JSON property order from the comparison. All blocks were Polish.

| Group | Count | Result |
| --- | ---: | --- |
| Standard landing contact form | 14 | References to `t95-contact-landing-pl` (Formularz kontaktowy landing (PL)) |
| Full contact form with calendar and consultation details | 1 | Inlined on `/kontakt` |
| Custom landing contact form with different copy and hidden contact details | 1 | Inlined on `/wspolpraca` |
| Contact channels without a form | 1 | Inlined on `/o-mnie` |
| Newsletter | 6 | References to `t95-newsletter-pl` (Newsletter Sales Atlas (PL)) |

The 14 contact replacements were on `/`, `/szkolenie-i-wdrozenie-asana`, `/szkolenie-i-wdrozenie-pipedrive`, `/automatyzacje-dla-pipedrive`, `/automatyzacja-procesow-biznesowych-nocode`, `/program-partnerski`, `/wdrozenie-ai-w-sprzedazy-b2b`, `/program-ai-dla-zespolu-sprzedazy`, `/audyt-ai-sprzedaz`, `/audyt-crm-pipedrive`, `/kurs-ai-w-sprzedazy`, `/audyt-procesow-asana`, `/audyt-sprzedazy`, and `/szkolenie-i-wdrozenie-salesforce`.

The six newsletter replacements were on `/`, `/kontakt`, `/o-mnie`, `/newsletter`, `/darmowe-materialy-dla-biznesow-uslugowych`, and `/blog`.

The Sanity mutation dry run accepted 21 documents. One subsequent transaction created the two published sections and patched 19 published page documents. A raw query after the transaction confirmed both targets, all 20 reference keys and positions, and the original revisions of all 13 pre-existing editorial drafts.

The before and after builds both read published data from `production` and served it through `verify-web` on port 8795. The baseline run was `20261113-222008-p8795`. The post-publication run was `20261113-222352-p8795`. All 19 pages returned HTTP 200 with HTML. Each form section had the same markup digest, action and ordered field names in both builds. The comparison used HTTP GET only. Full comparison files are kept locally.
