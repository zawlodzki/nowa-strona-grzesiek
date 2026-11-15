# T87 evidence

All captures come from the verify-web Worker (`wrangler dev`, port 8790) built from this branch, with consent rejected through its own UI. Form submits went only to the local n8n stub (`form-mock-receiver.mjs`, port 8791).

`capture.mjs` produces everything here. Rerun it against a healthy Worker:

```bash
node migration/lanes/web/out/t87-contact-form/capture.mjs --base http://127.0.0.1:8790 --phase after --out migration/lanes/web/out/t87-contact-form
node migration/lanes/web/out/t87-contact-form/capture.mjs --diff <before.jsonl> <after.jsonl>
```

- `before-*.png` and `after-*.png`. The contact section on `/`, `/kontakt` and `/szkolenie-i-wdrozenie-pipedrive` at 390, 768 and 1440 px. The newsletter band on `/` and the form on `/newsletter` at 390 and 1440 px. `*-contact-error-w390.png` is the `/kontakt` form after an empty submit.
- `before-results.json` and `after-results.json`. Per page and width: intro left edge, card left edge, intro text alignment, checkbox row height, portrait size, radius and placement, label visibility, placeholders, submit geometry. Also the keyboard pass on `/kontakt` and the empty-submit error state.
- `payload-diff.json`. Field names, count and order of the last `main-contact-form` payload the stub received before and after the change.
