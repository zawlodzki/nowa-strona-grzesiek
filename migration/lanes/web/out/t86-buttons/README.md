# T86 button verification

Local: `http://127.0.0.1:8790`, built and served by verify-web / local Wrangler. Live: `https://www.zawlodzki.pl`. Browser desktop-pointer emulation is used at all widths so hover is observable; touch is checked separately in measurements.json. Consent is rejected through its real control; no forms are submitted by this capture script.

Reproduce after `web.sh up` and a healthy `web.sh doctor`: `node migration/lanes/web/out/t86-buttons/verify.mjs`. The script uses the repository Playwright Chromium. T3 preview cannot run on this host because AppArmor blocks its browser sandbox.

| Page / CTA | Width | New rest | New hover | Live rest | Live hover |
|---|---:|---|---|---|---|
| home / hero | 320 | [new rest](new-home-hero-w320-rest.png) | [new hover](new-home-hero-w320-hover.png) | [live rest](live-home-hero-w320-rest.png) | [live hover](live-home-hero-w320-hover.png) |
| home / text | 320 | [new rest](new-home-text-w320-rest.png) | [new hover](new-home-text-w320-hover.png) | [live rest](live-home-text-w320-rest.png) | [live hover](live-home-text-w320-hover.png) |
| home / band | 320 | [new rest](new-home-band-w320-rest.png) | [new hover](new-home-band-w320-hover.png) | [live rest](live-home-band-w320-rest.png) | [live hover](live-home-band-w320-hover.png) |
| sales-atlas / band | 320 | [new rest](new-sales-atlas-band-w320-rest.png) | [new hover](new-sales-atlas-band-w320-hover.png) | [live rest](live-sales-atlas-band-w320-rest.png) | [live hover](live-sales-atlas-band-w320-hover.png) |
| course / band | 320 | [new rest](new-course-band-w320-rest.png) | [new hover](new-course-band-w320-hover.png) | [live rest](live-course-band-w320-rest.png) | [live hover](live-course-band-w320-hover.png) |
| ai / band | 320 | [new rest](new-ai-band-w320-rest.png) | [new hover](new-ai-band-w320-hover.png) | [live rest](live-ai-band-w320-rest.png) | [live hover](live-ai-band-w320-hover.png) |
| home / hero | 390 | [new rest](new-home-hero-w390-rest.png) | [new hover](new-home-hero-w390-hover.png) | [live rest](live-home-hero-w390-rest.png) | [live hover](live-home-hero-w390-hover.png) |
| home / text | 390 | [new rest](new-home-text-w390-rest.png) | [new hover](new-home-text-w390-hover.png) | [live rest](live-home-text-w390-rest.png) | [live hover](live-home-text-w390-hover.png) |
| home / band | 390 | [new rest](new-home-band-w390-rest.png) | [new hover](new-home-band-w390-hover.png) | [live rest](live-home-band-w390-rest.png) | [live hover](live-home-band-w390-hover.png) |
| sales-atlas / band | 390 | [new rest](new-sales-atlas-band-w390-rest.png) | [new hover](new-sales-atlas-band-w390-hover.png) | [live rest](live-sales-atlas-band-w390-rest.png) | [live hover](live-sales-atlas-band-w390-hover.png) |
| course / band | 390 | [new rest](new-course-band-w390-rest.png) | [new hover](new-course-band-w390-hover.png) | [live rest](live-course-band-w390-rest.png) | [live hover](live-course-band-w390-hover.png) |
| ai / band | 390 | [new rest](new-ai-band-w390-rest.png) | [new hover](new-ai-band-w390-hover.png) | [live rest](live-ai-band-w390-rest.png) | [live hover](live-ai-band-w390-hover.png) |
| home / hero | 1440 | [new rest](new-home-hero-w1440-rest.png) | [new hover](new-home-hero-w1440-hover.png) | [live rest](live-home-hero-w1440-rest.png) | [live hover](live-home-hero-w1440-hover.png) |
| home / text | 1440 | [new rest](new-home-text-w1440-rest.png) | [new hover](new-home-text-w1440-hover.png) | [live rest](live-home-text-w1440-rest.png) | [live hover](live-home-text-w1440-hover.png) |
| home / band | 1440 | [new rest](new-home-band-w1440-rest.png) | [new hover](new-home-band-w1440-hover.png) | [live rest](live-home-band-w1440-rest.png) | [live hover](live-home-band-w1440-hover.png) |
| sales-atlas / band | 1440 | [new rest](new-sales-atlas-band-w1440-rest.png) | [new hover](new-sales-atlas-band-w1440-hover.png) | [live rest](live-sales-atlas-band-w1440-rest.png) | [live hover](live-sales-atlas-band-w1440-hover.png) |
| course / band | 1440 | [new rest](new-course-band-w1440-rest.png) | [new hover](new-course-band-w1440-hover.png) | [live rest](live-course-band-w1440-rest.png) | [live hover](live-course-band-w1440-hover.png) |
| ai / band | 1440 | [new rest](new-ai-band-w1440-rest.png) | [new hover](new-ai-band-w1440-hover.png) | [live rest](live-ai-band-w1440-rest.png) | [live hover](live-ai-band-w1440-hover.png) |

Machine-readable button geometry, rendered label fitting, focus, touch and reduced-motion checks: [measurements.json](measurements.json). Execution summary: [verification.log](verification.log).

Final checks: [unit tests](final-test.log), [build](final-build.log), [Astro check](final-check.log), [e2e](final-e2e.log), [design detector](detect.json), [Worker doctor](doctor.log), [HTTP probes](probes.tsv).

The initial `t86-*` logs and `home-w*.png` are historical blocked-attempt evidence; final evidence uses the `final-*`, `new-*` and `live-*` names.
