# Sanity Studio

Project `8u2zjhvn` belongs to the Sanity organization Grzesiek Zawłodzki. Studio uses `production` by default. `development` is a separate dataset for editor verification.

## Run Studio locally

From the repository root, run these commands.

```sh
pnpm install --frozen-lockfile
SANITY_STUDIO_DATASET=development pnpm --filter studio dev --port 3333
```

Open `http://localhost:3333` and sign in with your Sanity account. The project allows credentialed CORS requests from this origin.

To use production, omit `SANITY_STUDIO_DATASET`. Obtain the owner's explicit approval before the first content write to production. Running a schema check, building Studio and generating types do not write content.

## Check schemas and generate types

```sh
pnpm --filter studio check
pnpm --filter studio verify
pnpm build
```

`verify` extracts the schema, generates types, compares the twelve page blocks and Portable Text members with the contract, and validates sample documents through the Sanity CLI. It proves invalid language, SEO lengths, uppercase paths, missing image alt and unknown diagram keys fail. Validation reads the development dataset for uniqueness checks but does not write documents.

Generated types are committed at `apps/studio/sanity.types.ts`. A frontend module under `apps/web/src/` can import types from `../../studio/sanity.types`. Extracted `apps/studio/schema.json` is local generated input and is ignored. Types keep draft fields optional because an editor can save an incomplete draft.

## Create and translate a page

1. In Studio, create a `page (PL)` document from the new-document menu.
2. Enter a title, a path, SEO and a section. Paths include the leading slash, such as `/o-mnie` or `/blog/tytul`.
3. Open the language menu and create an English translation. The plugin links both documents through `translation.metadata`.
4. Edit the English title, path and SEO. The frontend later adds `/en` to English paths.
5. Switch between Polish and English through the language menu.

A matching path is allowed across languages. Pages and posts cannot use the same path within one language. The production EN website remains gated by T23 and G5.

## Shared content and settings

Person and organization open as fixed singleton documents from the structure menu. Their JSON-LD IDs are initialized from `entities.json` and cannot change in Studio. The new-document menu omits their templates, and their duplicate and delete actions are unavailable.

Site settings use the translation plugin. Create the PL settings once, then create the EN translation through its language menu. Validation prevents publishing a second settings document for the same language. The duplicate action is unavailable.

## Import and renderer representation

`blocks.json` is the current source of block names. The older list in PLAN section 3 includes names replaced by the contract.

Sanity arrays cannot contain nested arrays directly. Portable Text table rows therefore use `rows: {_key, _type: 'tableRow', cells: string[]}[]`. The importer must wrap each source row in a `tableRow` object. The renderer reads `row.cells`.

A shared `contentImage` object contains asset, required alt, optional caption and hotspot information. Portable Text embeds use the native `_type: 'image'` with the same fields and validation. Media objects select either an image or a diagram key from the contract.

FAQ sections use `{question, answer}` pairs. Post FAQ uses `{q, a}` pairs from PLAN. Dates use native `datetime` fields. No raw JSON-LD text field or ISO date mirror is included.

Studio deployment, production content import, preview, public frontend queries and webhooks belong to later tasks.
