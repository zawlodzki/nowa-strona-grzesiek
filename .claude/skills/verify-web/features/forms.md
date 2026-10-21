# Lead forms

A visitor fills the contact form (`ContactForm` block, Webflow names "Landing Contact Form" and "main-contact-form") or the newsletter form (`NewsletterSignup`, "Newsletter bottom CTA form"). The form posts to `/api/form?form=<formId>` behind Turnstile. The Worker forwards every field to the n8n webhook under its Webflow name and answers 303 to `/podziekowanie-konsultacja` or `/podziekowanie-newsletter`. With JavaScript the page follows that redirect. On any other status it shows the Worker's Polish message in a live region under the button.

## Sub-features

- `field-names` means each rendered form carries exactly the field names `forms.json` has for its Webflow form, including the 32 hidden attribution inputs inside `div[data-zaw-attribution-fields="v1"]`.
- `turnstile` means the widget renders and puts a `cf-turnstile-response` token in the form before submit.
- `delivery` means a submit reaches the webhook with the Webflow envelope and every field, checkboxes as `"true"`/`"false"`.
- `thank-you` means a successful submit lands on the thank-you path.
- `error-message` means a non-303 answer shows its text in `.status` and re-enables the button.

## How to get to it (user POV)

- Today: the catalog `/_ds/blocks-b` has two contact forms and two newsletter forms.
- After T18: every page with a `contactForm` or `newsletterSignup` section, such as `/`, `/kontakt` and every blog post.

## Driving it with web.sh

Preconditions:

- The inventory clone is in place (`migration/00-inventory/webflow/forms.json`).
- `apps/web/.env` (gitignored) holds `N8N_FORM_WEBHOOK=http://127.0.0.1:8791/webhook/mock` and Cloudflare's always-pass Turnstile test secret `1x0000000000000000000000000000000AA`. Without `PUBLIC_TURNSTILE_SITE_KEY` the build uses the matching always-pass test site key.
- `node apps/web/src/worker/form-mock-receiver.mjs --port 8791 --out "$VERIFY_WEB_HOME/payloads.jsonl"` runs in the background.
- `web.sh up --port 8790` started after `.env` was written, and `web.sh doctor --port 8790` prints `doctor: healthy`.

- **Field names.** Run `node migration/tools/check-form-fields.mjs --url http://127.0.0.1:8790/_ds/blocks-b`. Every line starts `OK` with `37/37 fields, 32 hidden` (contact) or `34/34 fields, 32 hidden` (newsletter), and the exit code is 0.
- **Delivery.** In the browser pane, open `/_ds/blocks-b`, wait until `[name=cf-turnstile-response]` in `#kontakt-form` has a value, fill the textbox `E-mail` with a test address and click the button `Wyślij zapytanie` by ref. The tab lands on `/podziekowanie-konsultacja`. `wrangler.log` shows `POST /api/form 303`. The last line of `payloads.jsonl` has `payload.name` `Landing Contact Form` and 37 keys in `payload.data`.
- **Error message.** On the same page run a script that sets `#newsletter-form`'s `action` to `/api/form?form=nope` and calls `requestSubmit()`. `.status` reads `Nieznany formularz.` with `data-state="error"`, and the tab stays on `/_ds/blocks-b`.

## Gotchas

- The thank-you pages return 404 until T18 adds them. The landing path is the proof, not the page.
- The attribution inputs stay empty here, because the filler (`cmp-v1.js`) is not on the catalog page. Prove filling on staging (T21).
- The test site key shows a "testing only" strip in the widget. Staging and production builds need `PUBLIC_TURNSTILE_SITE_KEY` set to the live key.
- `check-form-fields.mjs` reads static HTML. `cf-turnstile-response` is added by the widget at runtime, so it never shows up there.
