# Migracja zawlodzki.pl: Webflow → Astro + Sanity + Cloudflare

Stan na 2026-10-21. Plan do realizacji równoległej przez kilku agentów. Źródłem faktów jest `00-inventory/` (zebrane dziś, tylko odczyt). Każde twierdzenie poniżej ma odnośnik do pliku albo etykietę "decyzja" lub "założenie".

## 1. Cel i warunki brzegowe

1. Strona PL działa pod tymi samymi adresami co dziś. 105 indeksowalnych URL zachowuje dokładną ścieżkę (`00-inventory/live-site/urls.csv`).
2. Host kanoniczny zostaje `https://www.zawlodzki.pl`, bez końcowego slasha (`live-site/redirects.csv`).
3. Pozycje SEO/AEO nie spadają. Bramka przed przełączeniem to automatyczny diff starej i nowej strony (`tools/diff-crawls.mjs`).
4. CMS pozwala składać podstrony z bloków, tak jak sekcje w Webflow.
5. Strona jest dwujęzyczna. PL jest główny i bez prefiksu, EN pod `/en/` (decyzja domyślna, patrz sekcja 10).
6. Zgody obsługuje dalej self-hostowany c15t pod `consent.zawlodzki.com` (`live-site/third-party.md`).
7. Obejścia Webflow (JSON-LD w czterech miejscach, FAQ jako 7 par pól, daty ISO jako tekst) znikają. Zastępuje je typowany model danych.
8. Audyt designu robi skill impeccable, a jego wynikiem jest design system w kodzie.

## 2. Co ustaliła inwentaryzacja

### Strona i treść (`00-inventory/webflow/SUMMARY.md`)
- 31 żywych stron statycznych, 1 kolekcja CMS `Wpisy` z 80 wpisami, 44 szkice (głównie szablon SystemFlow, do pominięcia).
- Na żywych stronach używanych jest 24 z 384 komponentów. Sekcje stron usługowych mają wspólny szkielet. Około 14 typów bloków pokrywa wszystko.
- Treść wpisów to HTML z 251 tabelami, figurami, iframe, embedami i kodem. Wymaga konwertera do Portable Text.
- Obrazy CMS leżą na CDN Webflow innego site id (`6a5e86920abd7b640ce8fad2`). 307 wartości w JSON-LD wskazuje na CDN Webflow. Trzeba je przenieść.
- 256 z 425 assetów nie ma alt.
- 11+ animowanych diagramów to skrypty inline w embedach, przypięte do id elementów.

### SEO (`live-site/SUMMARY.md`, `gsc/SUMMARY.md`)
- GSC to jedyna właściwość `sc-domain:zawlodzki.pl`. 16 miesięcy daje 462 kliknięcia i 26,7 tys. wyświetleń, a ostatnie 3 miesiące średnią pozycję 9,5.
- Najważniejsze strony to `/szkolenie-i-wdrozenie-pipedrive`, `/`, `/szkolenie-i-wdrozenie-asana` oraz wpis o aplikacjach do śledzenia ofert (`gsc/pages-16m.csv`).
- 15 wpisów z 30.09 do 04.10 brakuje w `sitemap.xml`, choć są w RSS. Nowa strona to naprawia.
- 6 przekierowań 301 z Webflow wciąż dostaje wyświetlenia (`webflow-settings/redirects.csv`).
- `/blog?f95bbc04_page=99` zwraca 200 (ryzyko soft 404). `/search` jest w sitemapie i jest cienką stroną.
- Backlinki są słabe. 78 z 88 to spam na domenę bez www (`live-site/seo-visibility/`). O widoczności decyduje Google organic.

### Dane strukturalne (`live-site/jsonld-summary.md`)
- `@id` są już spójne i dobrze nazwane. To zostaje.
- Do poprawy są cztery rzeczy. Na stronę przypada 2 lub 3 osobne bloki. Wpisy nie mają węzła `WebPage`. W 14 wpisach schema jest wklejona w rich text. Zostały typy wycofane przez Google (`SearchAction`, `HowTo`).
- Otwarta kwestia produktowa dotyczy tego, kto jest głównym bytem marki. Do wyboru jest Person albo Wellbiz sp. z o.o.

### Tracking i zgody (`gtm/SUMMARY.md`, `webflow-settings/SUMMARY.md`)
- `cmp-v1.js` z c15t ładuje GTM-P5V3CJ5 (wersja 54, 11 tagów) i wysyła zdarzenie `consent-update`. Tagi atrybucji czytają `window.__zawlodzkiConsentState`.
- Backend c15t zwraca 403 bez dozwolonego Origin. Nowe originy (preview, staging) trzeba dopisać przed testami.
- Formularze mają 32 ukryte pola atrybucji i Turnstile. Wysyłka idzie webhookiem do n8n (`flows.zawlodzki.com`). Nowa strona musi trafiać do tego samego flow.

### DNS (`dns/zone-zawlodzki.pl.csv`, `dns/SUMMARY.md`)
- 33 rekordy. Poczta to Google Workspace, do tego Mailgun (`email.`), Resend/SES (`tech.`), n8n na Railway, `secure` na Vercel.
- **DNSSEC jest włączony w OVH.** Trzeba go wyłączyć i odczekać TTL rekordu DS przed zmianą NS. Inaczej padnie strona i poczta.
- zawlodzki.com jest już na Cloudflare i robi 301 na www.zawlodzki.pl.

### Ryzyka wykryte przy okazji
- **Webflow pokazuje ostrzeżenie o płatności i możliwym anulowaniu planu Premium** (`webflow-settings/SUMMARY.md`). Jeśli plan wygaśnie przed przełączeniem, strona znika z indeksu. To trzeba załatwić niezależnie od migracji.
- Dashboard Webflow pokazuje "Last updated 2026-10-21 11:13". Agenci nic nie zapisywali. Przyczyna nieustalona (zgadywanie: sesja API MCP).

## 3. Architektura docelowa

| Warstwa | Wybór | Uzasadnienie |
|---|---|---|
| Frontend | Astro, wyjście statyczne (SSG) | Najszybszy HTML, pełna kontrola nad `<head>` i JSON-LD |
| Hosting | Cloudflare Workers ze static assets | Cloudflare rozwija Workers zamiast Pages. Jeden Worker obsługuje statykę, formularze i przekierowania |
| Preview | Osobny Worker w trybie SSR z tokenem Sanity | Podgląd szkiców i Visual Editing (Presentation tool) bez psucia statycznej produkcji |
| Rebuild | Webhook Sanity → deploy hook Cloudflare Workers Builds | Publikacja w CMS daje nową wersję strony w kilka minut |
| CMS | Sanity, dataset `production` | Page builder jako tablica bloków |
| i18n treści | `@sanity/document-internationalization` (dokument na język, połączone metadanymi tłumaczeń) | Osobne slugi PL/EN, osobne SEO, czyste hreflang |
| i18n UI | Słownik w kodzie (`src/i18n/{pl,en}.ts`) | Etykiety interfejsu nie są treścią redakcyjną |
| Formularze | Endpoint w Workerze → walidacja Turnstile → POST do istniejącego webhooka n8n | Ten sam lejek leadów, te same pola atrybucji |
| Zgody | c15t self-hosted, ten sam `cmp-v1.js`, Consent Mode v2 inline w `<head>` | Zero zmian w GTM, najmniejsze ryzyko |
| Obrazy | Sanity image CDN (AVIF/WebP, wymiary, LQIP) | Koniec z PNG po 570 KB |
| Fonty | Satoshi i Erode jako WOFF2 z subsetem latin-ext, self-host | Dziś to TTF. Material Icons zastępują inline SVG |

### Model treści (Sanity)
Ten kształt danych jest kontraktem dla wszystkich linii. Właścicielem jest linia CMS.

```
page        { language, title, slug, seo, sections: Block[] }
post        { language, title, slug, excerpt, body: PortableText, mainImage, thumbnail,
              publishedAt, updatedAt, kind: 'blog'|'newsletter', readingTime, cta,
              faq: {q, a}[], schemaExtras: { softwareMentioned[], itemList[] }, seo }
siteSettings{ language, nav, footer, defaultSeo }      // jeden na język
person, organization                                   // singletony, źródło JSON-LD
testimonial, logo, service                             // dokumenty referencyjne, współdzielone
redirect    { from, to, status }                       // przekierowania zarządzane w CMS
seo         { title, description, ogImage, noindex, canonicalOverride }
```

Bloki `Block` to unia dyskryminowana po `_type`: `hero`, `logoStrip`, `problem`, `audienceFit`, `processSteps`, `outcomes`, `pricing`, `ctaBand`, `testimonials`, `crossLink`, `faq`, `contactForm`, `newsletterSignup`, `richText`, `animatedDiagram`. Rejestr bloków (`contracts/blocks.json`) mapuje każdy typ na źródło w Webflow, schemat Sanity, komponent Astro i fragment JSON-LD. Jeden rejestr zastępuje rozsiane warunki w trzech warstwach.

Daty są typem `datetime`. Kopie ISO jako tekst znikają. FAQ to tablica par. `json-ld-extra` zastępują typowane `schemaExtras`.

### JSON-LD docelowo
Na stronę przypada jeden `<script type="application/ld+json">` z jednym `@graph`. Składa go jedna funkcja `buildGraph(page)` z danych Sanity.
- Zawsze `Organization`, `Person` i `WebSite` (bez `SearchAction`).
- Strona to `WebPage` (`<url>#webpage`) z `breadcrumb`, `isPartOf` i `primaryImageOfPage`.
- Wpis to dodatkowo `BlogPosting` (`<url>#article`, `mainEntityOfPage: #webpage`, `ImageObject` z wymiarami, `wordCount`, `inLanguage`).
- Usługa to `Service` + `Offer`. Kurs to `Course`.
- `FAQPage` pojawia się tylko tam, gdzie pytania są widoczne na stronie. `HowTo` znika.
- Referencja do bytu z innej strony dostaje typowany stub (`@type`, `@id`, `name`, `url`).
- `@id` pozostają identyczne jak dziś, żeby nie zrywać ciągłości encji.

## 4. Miejsce wymiany danych między agentami

Repozytorium git `nowa-strona-grzesiek` (do założenia, dziś to nie jest repo). Zasada brzmi "każdy plik ma jednego pisarza". Linie nie piszą do wspólnych plików, więc nie potrzebują blokad.

```
migration/
  00-inventory/          tylko do odczytu po fazie 0 (zebrane 2026-10-21)
  contracts/             pisze WYŁĄCZNIE koordynator; linie czytają
    url-map.csv          stara ścieżka → nowa PL → nowa EN → typ → status → właściciel
    blocks.json          rejestr bloków: webflow source → sanity type → astro component → jsonld
    entities.json        Person/Organization/WebSite: @id, nazwy, sameAs (po decyzji o bycie głównym)
    tokens.json          tokeny design systemu (kopiowane przez koordynatora z lanes/design)
    decisions.md         rejestr decyzji z datą i autorem
  lanes/<linia>/
    STATUS.md            pisze tylko ta linia: stan, blokery, pytania do koordynatora
    out/                 artefakty linii dla innych (np. ndjson, raporty crawli)
  tools/                 dźwignie: crawl, diff, redirects, jsonld_audit (już są), importery
apps/web/                Astro (linia Platform + Design + SEO, rozdzielone katalogami)
apps/studio/             Sanity Studio (linia CMS)
```

Przepływ zmian:
1. Linia potrzebuje zmiany kontraktu. Wpisuje prośbę do swojego `STATUS.md` w sekcji "Do koordynatora".
2. Koordynator aktualizuje `contracts/`, dopisuje wpis do `decisions.md` i robi commit na `main`.
3. Każda linia pracuje na swojej gałęzi `lane/<nazwa>` w osobnym worktree. Przed startem kroku robi rebase na `main`, żeby mieć aktualne kontrakty.
4. Koordynator scala gałęzie po zielonej weryfikacji linii.

Własność kodu w `apps/web/`:
- Platform ma `astro.config.*`, `wrangler.*`, `src/worker/`, CI.
- Design ma `src/styles/`, `src/components/blocks/`, `src/components/ui/`.
- SEO ma `src/seo/` (buildGraph, meta, sitemap, hreflang) i `public/_redirects`.
- i18n ma `src/i18n/`.

Uwaga praktyczna. W tej sesji subagenci mieli blokadę zapisu plików raportów. Dlatego linie startują jako osobne sesje Claude Code (każda z worktree), a nie jako subagenci jednej rozmowy.

## 5. Linie (agenci) i ich zakres

| Linia | Właściciel | Wejście | Wyjście | Weryfikacja |
|---|---|---|---|---|
| **K. Koordynator** | `contracts/`, `main`, merge, bramki | inventory | kontrakty, decyzje, scalanie | każda bramka z sekcji 7 |
| **P. Platform** | `apps/web` szkielet, Cloudflare, CI, formularze | blocks.json (tylko nazwy) | repo, Worker prod + preview, endpoint formularzy → n8n | `wrangler deploy` na staging, test formularza dochodzi do n8n z polami atrybucji |
| **C. CMS** | `apps/studio`, schematy, i18n plugin, Presentation, webhook | blocks.json, url-map.csv | wdrożony schemat, Studio, TypeGen | `sanity schema validate`, typy generują się, dokument PL i EN łączy się w Studio |
| **M. Migracja treści** | `tools/import/*`, `lanes/migration/out/*.ndjson` | `00-inventory/webflow/`, schemat z C | idempotentny import (deterministyczne `_id`), assety w Sanity z alt | import 2× daje ten sam stan, 80/80 wpisów i 31/31 stron, 0 linków do CDN Webflow |
| **D. Design** | impeccable, DESIGN.md, tokeny, komponenty bloków, animacje | live site, `webflow/design-tokens.json` | PRODUCT.md, DESIGN.md, tokens.json, komponenty, strona katalogu `/_ds` (noindex) | `impeccable audit` na stagingu, porównanie zrzutów, Lighthouse mobile |
| **S. SEO/AEO** | `src/seo/`, `_redirects`, url-map, sitemap, RSS, llms.txt, robots | inventory SEO, entities.json | buildGraph z testami, metadane, przekierowania | `tools/diff-crawls.mjs` stara vs staging = 0 niezamierzonych różnic, walidacja schema.org |
| **T. Tracking i DNS** | c15t originy, GTM QA, strefa Cloudflare, runbook przełączenia | gtm/, dns/ | przygotowana strefa CF, checklisty, runbook | Tag Assistant na stagingu, `dig` na każdy rekord w CF przed zmianą NS |
| **E. Wersja EN** | treści EN, slugi EN, glosariusz | strony PL w Sanity | dokumenty EN, url-map kolumna EN | hreflang wzajemny, brak EN bez pary PL |

### Szczegóły linii

**P. Platform**
1. Inicjalizacja repo, monorepo `apps/web` + `apps/studio`, pnpm.
2. Astro z `trailingSlash: 'never'`, `build.format: 'file'` lub odpowiednik zgodny z obsługą HTML w Workers static assets. Sprawdzić prototypem, który wariant daje `/o-mnie` bez slasha i bez przekierowania (to fakt do zaobserwowania, nie do dyskusji).
3. Worker `zawlodzki-web` (prod) i `zawlodzki-web-preview` (SSR, Sanity token, `noindex` + Basic Auth lub Cloudflare Access).
4. Endpoint `/api/form`. Walidacja Turnstile, przepisanie wszystkich 32 pól atrybucji, POST do webhooka n8n, przekierowanie na `/podziekowanie-konsultacja`. Klucz webhooka w sekretach Workera.
5. Deploy hook dla webhooka Sanity.

**C. CMS**
1. Projekt Sanity (sprawdzić `list_projects`, czy już istnieje).
2. Schematy z sekcji 3, bloki zgodne z `contracts/blocks.json`, walidacje (długość title/description, wymagany alt).
3. Plugin document-internationalization dla `page`, `post`, `siteSettings`, z językami `pl` (domyślny) i `en`.
4. Struktura Studio z sekcjami Strony, Blog, Usługi, Ustawienia i Przekierowania.
5. Presentation tool wpięty w Worker preview.
6. TypeGen, z którego typy konsumują Design i SEO.

**M. Migracja treści** (dźwignia, nie ręczna praca)
1. `tools/import/posts.mjs` mapuje `cms/blog.items.json` na `post`. HTML body przechodzi na Portable Text z blokami `table`, `figure`, `embed`, `code`, `downloadLink`. FAQ 1..7 zamienia się w tablicę. `json-ld-extra` parsuje się do `schemaExtras`.
2. `tools/import/pages.mjs` mapuje `page-trees/` i `page-content/` na `page.sections[]` według `blocks.json`. Brakujące drzewa (9 stron) i embedy spoza 5 próbek pobiera z żywego HTML w `live-site/html/`.
3. `tools/import/assets.mjs` przenosi obrazy z obu CDN Webflow do Sanity i zostawia mapę `stary URL → asset id` w `lanes/migration/out/asset-map.json`. Brakujące alt uzupełnia jako szkic do przeglądu.
4. Każdy dokument dostaje `_id` wyliczony z Webflow id, więc ponowny import nadpisuje, a nie duplikuje.
5. Raport kontrolny porównuje liczby, wykrywa puste pola i linki do `website-files.com`.

**D. Design** (impeccable)
1. `impeccable init` zapisuje PRODUCT.md (oferta, odbiorcy, ton). Tryb strony to Persuade.
2. `impeccable critique` i `impeccable audit` na żywej stronie: home, `/szkolenie-i-wdrozenie-pipedrive`, `/wdrozenie-ai-w-sprzedazy-b2b`, `/sales-atlas-system`, `/blog`, jeden wpis. Wynik trafia do `lanes/design/out/audit.md`.
3. `impeccable document` zapisuje DESIGN.md opisujący obecny świat wizualny, a `extract` daje tokeny do `tokens.json`.
4. Decyzja użytkownika "refine czy redesign" (sekcja 10). Domyślnie refine.
5. Każdy CSS (style, klasy, inline, komponenty) powstaje z załadowanym skillem `good-css`. Dotyczy to każdej linii, która dotyka styli, nie tylko Design. Tokeny jako CSS custom properties. Paleta SystemFlow zostaje przycięta do realnie używanych kolorów. Skala typografii przestaje polegać na `html { font-size: 20px }`.
6. Komponent Astro na każdy blok z `blocks.json` plus UI (Button, Section, Container, Icon).
7. Strona katalogu `/_ds` pokazuje każdy blok z danymi skrajnymi (skill `break-ui`).
8. Animowane diagramy przechodzą na komponenty Astro z `prefers-reduced-motion` (skille `animate`, `animation-performance`).

**S. SEO/AEO**
1. `contracts/url-map.csv` jako propozycja dla koordynatora. Zawiera 105 URL, 6 starych 301 i nowe EN.
2. `src/seo/graph.ts` z `buildGraph` i testami snapshot na 6 typach stron, porównanymi z `00-inventory/live-site/jsonld/`.
3. Meta generowane z Sanity. Jeden `og:type`, canonical na www, `hreflang` pl, en i `x-default` → pl tylko dla par.
4. `sitemap.xml` (sitemap index per język), `robots.txt`, `/blog/rss.xml` pod tą samą ścieżką, `llms.txt` generowany z treści.
5. Przekierowania: 6 z Webflow, `/index.html` → `/`, `/search` → `/blog` (301), paginacja `?f95bbc04_page=` → `/blog?page=` lub 301 na `/blog`, wielkie litery zostają 404.
6. Strony podziękowań dostają `noindex`. `/podziekowanie-newsletter` wypada z sitemapy.
7. Bramka: `tools/crawl.mjs` na stagingu i `tools/diff-crawls.mjs` względem `00-inventory/live-site/urls.json`. Każda różnica jest zamierzona i opisana w `lanes/seo/out/diff-accepted.md`.

**T. Tracking i DNS**
1. Dopisanie originów stagingu i preview w backendzie c15t. Sprawdzenie, czy token "zawlodzki-webflow" jest wiązany z originem.
2. QA w Tag Assistant: domyślne denied, `consent-update` po akceptacji, GA4, Ads, Clarity, Meta i Leadfeeder odpalają się tylko po zgodzie, pola atrybucji wypełnione w formularzu.
3. Strefa zawlodzki.pl w Cloudflare z importem 33 rekordów minus lista do usunięcia (`dns/zone-zawlodzki.pl.csv`, kolumna notes). Mailgun, n8n i Vercel jako DNS only.
4. Runbook przełączenia (sekcja 8).

**E. Wersja EN**
1. Zakres EN to decyzja (sekcja 10). Domyślnie start obejmuje home, strony usługowe, `/o-mnie`, `/kontakt`, `/sales-atlas-system` i 10 najlepszych wpisów z GSC.
2. Glosariusz terminów (CRM, lejek, wdrożenie) w `lanes/en/out/glossary.md`.
3. Tłumaczenie robi agent, przegląd człowiek. Bez przeglądu nie ma publikacji.
4. Slugi EN tłumaczone, na przykład `/en/pipedrive-training-and-implementation`.

## 6. Kolejność i równoległość

```
Faza 0  Inwentaryzacja                     GOTOWE (00-inventory/)
Faza 1  Kontrakty (1-2 dni)                K: url-map, blocks.json, entities.json, decisions.md
        równolegle:                        D: init + critique + audit + document (nie potrzebuje kontraktów)
                                           P: repo + szkielet Astro + Worker staging
                                           T: strefa CF (bez zmiany NS), originy c15t
Faza 2  Budowa (równolegle)                C: schematy → TypeGen
                                           D: tokeny + komponenty bloków (na typach z C)
                                           S: buildGraph, meta, sitemap, redirects
                                           M: importery (startuje, gdy C ma schemat w staging dataset)
                                           P: formularze, preview, deploy hook
Faza 3  Integracja PL                      M: pełny import → S: crawl-diff → D: audit na stagingu
                                           T: QA trackingu → K: bramka G3
Faza 4  Przełączenie PL                    runbook (sekcja 8), wymaga zgody użytkownika
Faza 5  Monitoring 4-8 tygodni             S: GSC tygodniowo, K: decyzje o poprawkach
Faza 6  EN                                 E + C + S: treści, hreflang, sitemap EN
```

Najpierw migracja 1:1 dla PL, potem EN jako osobne wydanie. Dzięki temu każda zmiana w Google jest przypisywalna do jednej przyczyny. Jeśli spadek przyjdzie po przełączeniu, wiadomo, że to nie hreflang.

## 7. Bramki (każda kończy się sprawdzalnym stanem)

| Bramka | Warunek przejścia | Dowód |
|---|---|---|
| G1 kontrakty | url-map pokrywa 105 URL + 6 starych 301, blocks.json pokrywa każdą sekcję z `pageSections` | skrypt porównujący url-map z `urls.csv` |
| G2 import | 80 wpisów, 31 stron, 0 odwołań do `website-files.com`, import idempotentny | raport `lanes/migration/out/import-report.json` |
| G3 staging parity | crawl-diff bez niezamierzonych różnic. Każda strona ma 200, ten sam title, description, canonical i H1. JSON-LD przechodzi walidację. Lighthouse mobile ≥ 90. Formularz dociera do n8n. Tag Assistant zielony | pliki w `lanes/seo/out/`, `lanes/tracking/out/` |
| G4 cutover | DNS rozwiązuje się z Cloudflare, poczta działa (test wysyłki i odbioru), `www` i apex odpowiadają nową stroną, przekierowania działają | `tools/redirects.mjs` na produkcji, `dig` |
| G5 stabilizacja | po 28 dniach kliknięcia i wyświetlenia w GSC w granicach zwykłych wahań, brak nowych błędów indeksowania | eksport GSC porównany z `gsc/pages-3m.csv` |

## 8. Runbook przełączenia (każdy krok nieodwracalny wymaga zgody użytkownika)

1. T-7 dni. W OVH obniżyć TTL rekordów `@` i `www` do 300 s.
2. T-3 dni. **Wyłączyć DNSSEC w OVH** i odczekać, aż rekord DS zniknie z rejestru `.pl` (sprawdzać `dig DS zawlodzki.pl`).
3. T-1 dzień. Strefa w Cloudflare gotowa i zweryfikowana rekord po rekordzie przez `dig @<ns-cloudflare>`. Custom domain dla Workera przygotowana.
4. T0. Zmiana NS w OVH na Cloudflare. Następnie podpięcie `www.zawlodzki.pl` i `zawlodzki.pl` do Workera (apex → www 301).
5. T0 + 1 h. `tools/redirects.mjs` i `tools/crawl.mjs` na produkcji, test poczty, test formularza, Tag Assistant.
6. T0 + 1 h. W GSC zgłosić sitemapę i sprawdzić URL Inspection dla 20 najważniejszych stron.
7. T0 + 48 h. Włączyć DNSSEC w Cloudflare i dodać DS w OVH.
8. Plan Webflow trzymać aktywny co najmniej 14 dni po przełączeniu jako drogę odwrotu (powrót NS na OVH). Usunąć rekordy `proxy-ssl.webflow.com` i stare OVH mail dopiero po G5.

## 9. Jak uruchomić linie

Każda linia to osobna sesja Claude Code w osobnym worktree, na gałęzi `lane/<nazwa>`. Brief każdej sesji zawiera:
- ścieżkę do tego planu i do `contracts/`,
- listę plików, których jest właścicielem (sekcja 4),
- swoją bramkę i dowód (sekcja 7),
- zakaz pisania poza swoimi katalogami i zakaz kroków nieodwracalnych (DNS, publikacja, usuwanie w Webflow),
- wymóg użycia skilla `good-css` przy pisaniu lub zmianie jakiegokolwiek CSS.

Maksymalna równoległość w fazie 2 to 5 linii (P, C, D, S, M). T działa w tle z niską intensywnością. E rusza po G5.

## 10. Decyzje dla użytkownika

Stan 2026-10-21. Decyzje 1-6 zostały potwierdzone przez użytkownika w wartościach domyślnych. Decyzja 7 (płatność Webflow) czeka na działanie użytkownika.

| # | Pytanie | Domyślnie | Alternatywa |
|---|---|---|---|
| 1 | Gdzie EN | `www.zawlodzki.pl/en/` (cały autorytet na jednej domenie) | `zawlodzki.com` jako domena EN |
| 2 | Design | refine (zachowuje konwersję i rozpoznawalność, mniejsze ryzyko SEO) | redesign po audycie |
| 3 | Główny byt marki w JSON-LD | Person (marka osobista, Wellbiz jako `worksFor` i wydawca prawny) | Organization Wellbiz jako główny |
| 4 | EN razem z PL | nie, osobne wydanie po G5 | jedno wydanie |
| 5 | Zakres EN | strony usługowe, o mnie, kontakt, sales atlas, top 10 wpisów | cały blog |
| 6 | `/search` | usunąć i dać 301 na `/blog` | własna wyszukiwarka (Pagefind) |
| 7 | Płatność Webflow | naprawić teraz, przed wszystkim innym | brak |
