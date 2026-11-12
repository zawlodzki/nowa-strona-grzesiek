# T75 evidence: form copy contract and Studio check

## Contract

`migration/contracts/blocks.json` gains `contactForm.fields.copy` and `newsletterSignup.fields.copy` with the text requested in the T53 Handoff. `decisions.md` has a matching row.

```
$ pnpm --filter studio exec sanity schema extract --path schema.json --force
$ node apps/studio/scripts/verify-schema.mjs --schema-only
PASS optional testimonial authorImage and linkedinUrl registered
PASS contract blocks, fields, Portable Text members and styles
SKIP document validation: Sanity login required; coordinator requested schema-only checks
```

`schema.json` is gitignored and was generated locally only.

## Studio check (2026-11-12)

Local Studio (`sanity dev`, port 3333, `SANITY_STUDIO_DATASET=development`), opened in the user's signed-in browser. Page: Kontakt (`page-634daaa2c8ceab10fa93a044`), which has both blocks. No draft or version of that page existed beforehand.

| Block | "Teksty formularza" expands | Placeholders equal code defaults | Typing saves to the draft |
|---|---|---|---|
| `contactForm` (`ccf5ee43b3d5`) | yes (`contact-copy-expanded.jpg`) | all 13 fields, including "Wyślij zapytanie", "Zaczekaj chwilę…", the privacy note and the newsletter consent | `copy.submitLabel = "T75 test"` read back from `drafts.page-…` (`contact-submit-edit.jpg`) |
| `newsletterSignup` (`0e4d402edda3`) | yes (`newsletter-copy-expanded.jpg`) | Newsletter, Sales Atlas, Adres e-mail ×2, Zapisuję się, Zaczekaj chwilę…, legal paragraph | `copy.submitLabel = "T75 test"` read back from the draft (`newsletter-submit-edit.jpg`) |

After each test, "Discard changes" removed the draft. A query for `drafts.` and `versions.**.` of the page returned 0 documents. Nothing was published, and Studio was not deployed.

Not covered: the Presentation preview pane showed "Unable to connect" because it points at preview.zawlodzki.pl, which was not serving this build. The T53 evidence (`t53-form-copy/override-dom.txt`) already proves that filled fields render on the site.
