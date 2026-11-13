# T90 hero review

The Sanity proposal covers 14 pages. The homepage keeps its monogram asset and gets a corrected portrait alt. Salesforce and Sales Atlas have no content changes. The other heroes use the existing Salesforce cut-out. Wide wordmarks sit on a light background so they remain legible over the dark shirt.

- [Plan](plan.json) lists the scope and sources. Pipedrive reuses the published Authorized Partner badge. Asana reuses its published logo. Claude uses the color wordmark from the official homepage. n8n uses the pink and black wordmark from its current brand system.
- [Before and after](changes.json) lists the page IDs, hero keys, and exact field changes. The Claude and n8n refs are based on the local file hashes. After an authorized upload, use the asset IDs returned by Sanity.
- [Render checks](renders.tsv) record HTTP status, alt text, badge position, eager loading and unchanged Open Graph images. JSON-LD primaryImageOfPage follows the hero portrait.

To reproduce, place claude.svg and n8n.svg in /tmp/t90-hero/assets. The plan links to the n8n SVG. For Claude, take the first svg with a class beginning ClaudeWordmark on the official homepage. Replace the class attribute with width="573" height="125". Leave paths and fills intact. Serve that directory at 127.0.0.1:8797 during the preview.

Run prepare.py with /tmp/t90-hero as its argument to generate the overlay from the public Sanity API. Start the Worker with verify-web, then run capture.mjs with the Worker origin, before, and the output directory as arguments. Stop the Worker. Restart with T34_LOCAL_PROOF=1 and T34_LOCAL_DOCUMENTS=/tmp/t90-hero/overlay.json. Run capture.mjs again with after in place of before.

Both SVGs are uploaded and all 14 drafts are saved in Sanity production. The asset IDs match the preview. Before publishing, check the current draft revisions against the approved hero fields in changes.json. Sanity rejected publication because existing SEO metadata exceeds the schema limits. See the [proposed edits](seo-proposal.md). Verify staging after publication.
