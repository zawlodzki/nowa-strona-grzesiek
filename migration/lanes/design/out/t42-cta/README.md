# T42. Zmiany CTA

Dry-run z publicznego odczytu production z 2026-11-11. Bez zapisu do Sanity. 54 zmiany w 19 dokumentach. 39 zmian copy i 15 dodatków. Drugie uruchomienie na poprawionej kopii daje zero mutacji.

## Odtworzenie

Pobierz świeży eksport page i post do pliku JSON lub NDJSON. Skrypt przyjmuje też publiczną odpowiedź GROQ z tablicą result.

```sh
node migration/tools/import/pages-t42-cta-patch.mjs export.json report.json patched.json
node migration/tools/import/pages-t42-cta-patch.mjs patched.json second.json
```

`report.json` zawiera mutacje z `ifRevisionID`. `patched.json` jest lokalną kopią do przeglądu. Skrypt nie wysyła żądań sieciowych. Zmienia tylko sections i body zmodyfikowanych dokumentów. Zastępuje całe tablice pod ochroną rewizji. Po jakiejkolwiek publikacji lub zastosowaniu T40 pobierz nowy eksport i wygeneruj mutacje ponownie. Nie usuwaj ochrony rewizji.

`plan.json` zapisuje unikalne reguły copy i kotwice z T41. Brak oczekiwanego tekstu lub kotwicy przerywa generowanie. Klucze nowych bloków są stałe. `changes.json` zawiera tylko zmienione pola, bez surowego eksportu.

## Nakładanie z T40

Sprawdzono `origin/task/T40-asana-results-quotes:migration/tools/import/pages-t40-patch.mjs` z PR #61. Hero `/audyt-sprzedazy` pozostaje poza T42. T40 ustawia tam "Umów audyt sprzedaży". Rekomendacja T41 "Umów rozmowę o audycie sprzedaży" dla tego hero pozostaje do uzgodnienia po T40. Pozostałe wystąpienia na tej stronie są objęte T42. Nazw pakietów pricing.plans[].name nie zmieniamy. Nie kopiujemy zakupowego linku kursu. Aktualność przedsprzedaży, ceny i daty wymaga potwierdzenia właściciela.

## Wymaga zmian w kodzie

- Opcjonalny drugi przycisk kursu "Zapytaj o pracę na Twoim CRM" wewnątrz zakładek. `apps/studio/schemaTypes/blocks.ts` i `apps/web/src/components/blocks/Tabs.astro`. Nie dodano go obok pierwszego CTA.
- Własna etykieta PromoCard wymaga pola i renderowania w `apps/web/src/components/blocks/PromoCard.astro`. T42 używa ctaBand oraz zwykłych linków, więc nie wymaga tej zmiany.
- Nie znaleziono zmian copy z tabeli T41 zablokowanych przez hardcoded label. 39 wystąpień istnieje w treści.

## Dowody i ograniczenia

`verify-web` wykonał build, up, doctor, probe i shot przez wrangler dev --local na 8790. Doctor healthy. Pięć ścieżek zwróciło 200 i noindex, nofollow. Wyniki w `probes.tsv`. Na końcu wykonano down. Port 8791 nie był używany.

Toolchain ma SANITY_DATASET, ale nie ma lokalnego plikowego override. Zgodnie z wariantem awaryjnym T42 porównania `compare-*.png` pokazują pierwszy ekran live po lewej i obecny render nowej strony przed patchem po prawej. Nie dowodzą wyrenderowania nowych CTA. `diff-*.html` pokazują dokładne różnice JSON pięciu priorytetowych stron. Pełna lista poniżej obejmuje pozostałe strony.

Dodano jedno CTA w każdym rekomendowanym miejscu i pominięto opcjonalny drugi punkt kursu. Blog AI ma jeden nowy spokojny link, bez baneru. Brak lokalnego override uniemożliwia rzetelny pomiar odstępów po zmianie na 390 i 1440 px. Przed zatwierdzonym importem trzeba sprawdzić rytm około dwóch ekranów na datasetcie testowym. Nie twierdzimy, że ten pomiar przeszedł.

Weryfikacja offline sprawdziła rewizję każdej mutacji, puste mutacje drugiego przebiegu oraz zachowanie pól poza sections i body. `node --check` przeszedł. Odtwarzalny test uruchom przez `node migration/tools/import/pages-t42-verify.mjs export.json`. Wynik w `verification.json`.

## Lista zmian

| Strona | Pole lub pozycja | Przed | Po |
| --- | --- | --- | --- |
| `/` | `sections[_key=="c012de6e7add"].cta.label` | Dowiedz się więcej o pipedrive.com | Zobacz ofertę wdrożenia Pipedrive |
| `/` | `sections[_key=="60f9ae32aab0"].cta.label` | Dowiedz się więcej o asana.com | Zobacz ofertę wdrożenia Asany |
| `/audyt-ai-sprzedaz` | `sections[_key=="2dcc7dcbde3e"].plans[_key=="fd2cd45154d2"].cta.label` | Umów audyt AI | Umów rozmowę o audycie AI |
| `/audyt-ai-sprzedaz` | `sections[_key=="b7576e9b7f87"].cta.label` | Umów audyt AI | Umów rozmowę o audycie AI |
| `/audyt-crm-pipedrive` | `sections[_key=="8c0622e03138"].cta.label` | Umów audyt Pipedrive | Umów rozmowę o audycie Pipedrive |
| `/audyt-crm-pipedrive` | `sections[_key=="5b1bec6112f1"].plans[_key=="9dcf21d61b2e"].cta.label` | Umów audyt Pipedrive | Umów rozmowę o audycie Pipedrive |
| `/audyt-crm-pipedrive` | `sections[_key=="508ab63e8521"].cta.label` | Umów audyt Pipedrive | Umów rozmowę o audycie Pipedrive |
| `/audyt-crm-pipedrive` | `sections[_key=="c1db6f9efc84"].cta.label` | Sprawdźmy, co jest zepsute | Porozmawiajmy o problemach z Pipedrive |
| `/audyt-crm-pipedrive` | `sections[_key=="5b1bec6112f1"].plans[_key=="11bd71bbc50d"].cta.label` | Ustalmy zakres i cenę | Porozmawiajmy o zakresie i cenie |
| `/audyt-procesow-asana` | `sections[_key=="3da351d67a9b"].cta.label` | Umów audyt Asany | Umów rozmowę o audycie Asany |
| `/audyt-procesow-asana` | `sections[_key=="09a865c29e2d"].plans[_key=="46fc940a558a"].cta.label` | Umów audyt Asany | Umów rozmowę o audycie Asany |
| `/audyt-procesow-asana` | `sections[_key=="b807063d1456"].cta.label` | Umów audyt Asany | Umów rozmowę o audycie Asany |
| `/audyt-procesow-asana` | `sections[_key=="464329076d4c"].cta.label` | Sprawdźmy, gdzie utykają projekty | Porozmawiajmy o Waszych projektach |
| `/audyt-procesow-asana` | `sections[_key=="09a865c29e2d"].plans[_key=="f8baa8cc8c2f"].cta.label` | Ustalmy zakres i cenę | Porozmawiajmy o zakresie i cenie |
| `/audyt-sprzedazy` | `sections[_key=="c7b932fd4a38"].plans[_key=="eafcf2b09841"].cta.label` | Umów audyt sprzedaży | Umów rozmowę o audycie sprzedaży |
| `/audyt-sprzedazy` | `sections[_key=="96c919be71ee"].cta.label` | Umów audyt sprzedaży | Umów rozmowę o audycie sprzedaży |
| `/audyt-sprzedazy` | `sections[_key=="b180dcc0746e"].cta.label` | Sprawdźmy, gdzie jest blokada | Porozmawiajmy o problemach w sprzedaży |
| `/automatyzacja-procesow-biznesowych-nocode` | `sections[_key=="068fea56a0a5"].cta.label` | Sprawdź, co da się uprościć | Porozmawiajmy o automatyzacji |
| `/automatyzacja-procesow-biznesowych-nocode` | `sections[_key=="6a0eb24741ab"].cta.label` | Wskaż swój powtarzalny proces | Opisz proces, o którym chcesz porozmawiać |
| `/automatyzacje-dla-pipedrive` | `sections[_key=="e12a62aabc1f"].cta.label` | Policzmy, ile czasu to zjada | Porozmawiajmy o ręcznej pracy w CRM |
| `/blog/ai-w-sprzedazy` | `body[_key=="49563366e79c"].children[_key=="64ba326829f7"].text` | umówić 30 minut rozmowy | umówić bezpłatną konsultację |
| `/blog/asana-cennik` | `body[_key=="dc89d863bb0e"].children[_key=="d26e4b70e9cb"].text` | umów 30 minut rozmowy | umów bezpłatną konsultację |
| `/kurs-ai-w-sprzedazy` | `sections[_key=="5f8ee255ce49"].plans[_key=="01ed356782dd"].cta.label` | Zacznijmy wdrożenie | Zobacz ofertę wdrożenia AI |
| `/program-ai-dla-zespolu-sprzedazy` | `sections[_key=="112a72884d90"].cta.label` | Zapisz się na pierwszą grupę | Zapytaj o udział w programie |
| `/program-ai-dla-zespolu-sprzedazy` | `sections[_key=="5b88d19461fc"].plans[_key=="37b341994f4a"].cta.label` | Zapisz się na pierwszą grupę | Zapytaj o udział w programie |
| `/program-ai-dla-zespolu-sprzedazy` | `sections[_key=="b1f73e6161d3"].cta.label` | Zapisz się na pierwszą grupę | Zapytaj o udział w programie |
| `/program-ai-dla-zespolu-sprzedazy` | `sections[_key=="5b88d19461fc"].plans[_key=="b7d70f0fd8e4"].cta.label` | Zacznijmy wdrożenie | Zobacz ofertę wdrożenia AI |
| `/program-partnerski` | `sections[_key=="f458099bf565"].cta.label` | Poleć klienta | Zapytaj o polecenie klienta |
| `/program-partnerski` | `sections[_key=="c03ca8f8e94e"].cta.label` | Poleć klienta | Zapytaj o polecenie klienta |
| `/szkolenie-i-wdrozenie-asana` | `sections[_key=="c8814f3c258d"].plans[_key=="35d735f10d4c"].cta.label` | Zacznijmy wdrożenie | Umów rozmowę o wdrożeniu |
| `/szkolenie-i-wdrozenie-asana` | `sections[_key=="c8814f3c258d"].plans[_key=="b1668bcbd371"].cta.label` | Ustalmy zakres i cenę | Porozmawiajmy o zakresie i cenie |
| `/szkolenie-i-wdrozenie-pipedrive` | `sections[_key=="328441a18e1a"].plans[_key=="b35213838ccc"].cta.label` | Zacznijmy wdrożenie | Umów rozmowę o wdrożeniu |
| `/szkolenie-i-wdrozenie-pipedrive` | `sections[_key=="328441a18e1a"].plans[_key=="5decc2fc9eed"].cta.label` | Ustalmy zakres i cenę | Porozmawiajmy o zakresie i cenie |
| `/szkolenie-i-wdrozenie-salesforce` | `sections[_key=="be52c45bb7cc"].plans[_key=="a8f5d3b249c7"].cta.label` | Umów diagnozę | Umów rozmowę o diagnozie CRM |
| `/szkolenie-i-wdrozenie-salesforce` | `sections[_key=="be52c45bb7cc"].plans[_key=="1ac71b72f47e"].cta.label` | Zacznijmy wdrożenie | Umów rozmowę o wdrożeniu |
| `/szkolenie-i-wdrozenie-salesforce` | `sections[_key=="be52c45bb7cc"].plans[_key=="4d0402316e00"].cta.label` | Ustalmy zakres i cenę | Porozmawiajmy o zakresie i cenie |
| `/wdrozenie-ai-w-sprzedazy-b2b` | `sections[_key=="1faf7b0e232f"].plans[_key=="92adad1a54fd"].cta.label` | Zacznijmy wdrożenie | Umów rozmowę o wdrożeniu AI |
| `/wdrozenie-ai-w-sprzedazy-b2b` | `sections[_key=="1faf7b0e232f"].plans[_key=="dc59c71b12c6"].cta.label` | Ustalmy zakres i cenę | Porozmawiajmy o zakresie i cenie |
| `/wspolpraca` | `sections[_key=="9cf03f74aae7"].cta.label` | Zacznijmy współpracę | Porozmawiajmy o współpracy |
| `/audyt-ai-sprzedaz` | `sections (before Dwa tygodnie pracy. Pięć kroków do decyzji.)` | brak | {"_key": "t42-band", "_type": "ctaBand", "cta": {"_type": "link", "label": "Porozmawiajmy o audycie AI w Waszej firmie", "href": "/kontakt"}} |
| `/audyt-crm-pipedrive` | `sections[_key=="32be34a848e3"].cta` | brak | {"_type": "link", "label": "Omówmy problemy z danymi w Pipedrive", "href": "/kontakt"} |
| `/audyt-procesow-asana` | `sections[_key=="ad90b70dc0a3"].cta` | brak | {"_type": "link", "label": "Porozmawiajmy o Waszych projektach", "href": "/kontakt"} |
| `/audyt-sprzedazy` | `sections[_key=="4b43461595f5"].cta` | brak | {"_type": "link", "label": "Porozmawiajmy o zakresie diagnozy sprzedaży", "href": "/kontakt"} |
| `/automatyzacje-dla-pipedrive` | `sections[_key=="274d58f994d0"].cta` | brak | {"_type": "link", "label": "Omówmy jeden przepływ w Twoim CRM", "href": "/kontakt"} |
| `/blog/ai-w-sprzedazy` | `body (before Jak wdrożyć AI w sprzedaży krok po kroku?)` | brak | {"_key": "t42-pt", "_type": "block", "style": "normal", "markDefs": [{"_key": "contact", "_type": "internalLink", "reference": {"_type": "reference", "_ref": "page-634daaa2c8ceab10fa93a044"}}], "children": [{"_key": "text", "_type": "span", "marks": ["contact"], "text": "Chcesz sprawdzić taki proces w swojej firmie? Porozmawiajmy."}]} |
| `/blog/asana-cennik` | `body (before Rocznie czy miesięcznie)` | brak | {"_key": "t42-pt", "_type": "block", "style": "normal", "markDefs": [{"_key": "contact", "_type": "internalLink", "reference": {"_type": "reference", "_ref": "page-634daaa2c8ceab10fa93a044"}}], "children": [{"_key": "text", "_type": "span", "marks": ["contact"], "text": "Chcesz policzyć koszt dla swojego zespołu? Napisz do mnie."}]} |
| `/blog/audyt-wdrozonego-crm` | `body (before Czego ta lista nie sprawdzi)` | brak | {"_key": "t42-pt", "_type": "block", "style": "normal", "markDefs": [{"_key": "contact", "_type": "internalLink", "reference": {"_type": "reference", "_ref": "page-634daaa2c8ceab10fa93a044"}}], "children": [{"_key": "text", "_type": "span", "marks": ["contact"], "text": "Chcesz omówić wynik swojej checklisty? Napisz do mnie."}]} |
| `/kurs-ai-w-sprzedazy` | `sections (before Osiem modułów, osiem rozwiązań na koniec)` | brak | {"_key": "t42-band", "_type": "ctaBand", "cta": {"_type": "link", "label": "Zapytaj, czy kurs pasuje do Twojego procesu", "href": "/kontakt"}} |
| `/program-ai-dla-zespolu-sprzedazy` | `sections (before Pięć kroków w osiem tygodni)` | brak | {"_key": "t42-band", "_type": "ctaBand", "cta": {"_type": "link", "label": "Zapytaj o udział zespołu w programie", "href": "/kontakt"}} |
| `/sales-atlas-system` | `sections (before Skąd wziął się system sprzedaży)` | brak | {"_key": "t42-band", "_type": "ctaBand", "cta": {"_type": "link", "label": "Umów konsultację o swoim systemie sprzedaży", "href": "/kontakt"}} |
| `/szkolenie-i-wdrozenie-asana` | `sections[_key=="eb2dcc0cc004"].cta` | brak | {"_type": "link", "label": "Omówmy pierwszy proces w Asanie", "href": "/kontakt"} |
| `/szkolenie-i-wdrozenie-pipedrive` | `sections[_key=="a53c621aa426"].cta` | brak | {"_type": "link", "label": "Porozmawiajmy o migracji Twoich danych", "href": "/kontakt"} |
| `/szkolenie-i-wdrozenie-salesforce` | `sections[_key=="515242387b26"].cta` | brak | {"_type": "link", "label": "Porozmawiajmy o migracji do Salesforce", "href": "/kontakt"} |
| `/wdrozenie-ai-w-sprzedazy-b2b` | `sections (before Pięć kroków do pierwszych procesów sprzedaży obsługiwanych przez AI)` | brak | {"_key": "t42-band", "_type": "ctaBand", "cta": {"_type": "link", "label": "Porozmawiajmy o pierwszym procesie dla AI", "href": "/kontakt"}} |
