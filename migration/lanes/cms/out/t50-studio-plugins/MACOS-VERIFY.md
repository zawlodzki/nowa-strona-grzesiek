# T50: read-only Studio verification on Grzesiek's macOS

Use the existing local clone of zawlodzki/nowa-strona-grzesiek. Work on T50 only; do not use the T49 branch. If the clone has unrelated uncommitted changes, stop rather than overwrite them.

## Start

From the repository root:

```bash
git status --short
git fetch origin
git switch task/T50-studio-plugins-legal
# If the branch does not exist locally:
# git switch --track origin/task/T50-studio-plugins-legal
git pull --ff-only origin task/T50-studio-plugins-legal
pnpm install
pnpm --filter studio dev
```

Open **http://localhost:3333** in Grzesiek's ordinary Chrome profile that is logged in to Sanity. Do not use Incognito, a fresh automation profile, the hosted Studio, or 127.0.0.1. The VM API check confirmed that this exact localhost origin already allows credentials for project **8u2zjhvn**; do not change CORS.

If Studio still asks for login, complete its browser login using the account with project access. CLI `sanity login` alone does not authenticate Studio's browser session. Keep the server running during verification. If port 3333 is occupied, identify the existing server; do not silently switch ports.

## Read-only checks and three screenshots

Save actual screenshots as PNG files under:

`migration/lanes/cms/out/t50-studio-plugins/`

Use a wide enough Chrome window that the navigation and inspected content are readable. Never edit fields, create drafts or translations, publish, delete, upload media, change asset metadata, or write to any dataset. If a check fails, record what happened in Handoff; do not alter data to make it pass.

1. **legal-pages.png** — open the Structure tool, then **Strony prawne**. Capture the menu and the complete four-item list together. Open each item only to read its slug, confirming the set is exactly:
   - /polityka-prywatnosci
   - /regulamin
   - /regulamin-newslettera
   - /lista-cookies-i-identyfikatorow

   Confirm these are existing page documents. Open the main **Strony** list and verify that none of these four documents appears there (clear any search/filter first; inspect the full list). Record that exclusion check and the observed slugs in Handoff. Do not rename, republish or change slugs.

2. **media-tool.png** — select the **Media** tool in the Studio toolbar (or its tool overflow menu). Wait for the library to load, then capture its navigation and library UI. Confirm it renders without an error. An empty library is acceptable if it is genuinely empty; document that fact. Do not upload, edit or delete anything.

3. **toc-inspector.png** — return to Structure > **Strony** and open an existing long service page with many sections. Open the table-of-contents inspector from the document's inspector controls/menu (look for “Table of contents” / TOC). Capture the page title, section content and populated TOC together. Click a TOC entry and confirm it navigates to its corresponding section without editing the document. Record the page title/slug and result in Handoff. The configured scope is page/post, fields sections/body. If no suitable document or inspector exists, record failure rather than creating content.

## Hand back on the same branch

Update only `migration/tasks/T50.md` under Handoff with the macOS date, Chrome/local URL, three screenshot paths and each observed result, including the main Strony exclusion check and TOC navigation. Tick Done when boxes only where the complete requirement is now proven. Preserve the existing PR URL and review status; do not mark done.

Commit **only the three screenshots and that Handoff update**. Do not commit local dependency/configuration changes from installation.

```bash
git diff -- migration/tasks/T50.md
git status --short
git add migration/lanes/cms/out/t50-studio-plugins/legal-pages.png migration/lanes/cms/out/t50-studio-plugins/media-tool.png migration/lanes/cms/out/t50-studio-plugins/toc-inspector.png migration/tasks/T50.md
git commit -m "T50: Add macOS Studio verification screenshots"
git push origin task/T50-studio-plugins-legal
```

This updates the existing T50 PR; do not open another PR. Do not run sanity deploy, typegen, sanity schema extract, dataset migrations, or any write to the production dataset. Do not merge.

Finally stop the dev server with Ctrl+C in its terminal, including if verification fails. Confirm port 3333 is no longer served by the process you started.
