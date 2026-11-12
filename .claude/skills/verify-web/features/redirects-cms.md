# Redirects from Sanity

An editor publishes a "Przekierowanie" document (`from`, `to`). The next build writes it to `dist/_redirects`, and the Worker answers `from` with a 301 to `to`. Contract redirects from `url-map.csv` run first and are not affected.

## What must hold

- `from` answers `301` with `Location: <to>`; the query string is kept.
- Matching is exact and case-sensitive. Other casings and the trailing-slash form stay `404`.
- `/_redirects` itself is `404`.
- Live pages and contract redirects behave as before. The build skips, with a `[cms-redirects] skipped redirect …` warning, any rule that would shadow them.

## How to check

1. `web.sh up --port 8790`, then read the build log for `[cms-redirects] N redirect(s) from Sanity`.
2. With no redirect documents in the dataset, append a rule to the built file and restart without rebuilding:
   ```bash
   printf '/stary-testowy-adres /kontakt 301\n' >> apps/web/dist/_redirects
   web.sh down --port 8790 && web.sh up --port 8790 --no-build
   web.sh probe /stary-testowy-adres --port 8790        # 301 /kontakt
   web.sh probe /STARY-TESTOWY-ADRES --port 8790        # 404
   web.sh probe /konsultacja --port 8790                # 301 /wspolpraca (contract)
   web.sh probe /kontakt --port 8790                    # 200
   ```
3. `node --test apps/web/src/worker/cms-redirects.test.mjs` covers the skip rules.
