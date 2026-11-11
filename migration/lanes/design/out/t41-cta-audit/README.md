# Audyt rozmieszczenia CTA

Celem jest ułatwienie kontaktu w chwili, gdy czytelnik rozpozna swój problem. Największe luki są w kursie AI, ofercie wdrożenia AI i audycie AI. Nie dodawać CTA na każdej stronie. Oferta no-code ma ich już dużo.

## Zakres i metoda

Pomiar 11 listopada 2026, viewport 1280 × 900, opublikowana treść stagingu `https://zawlodzki-web.zawlodzki.workers.dev` i porównanie tych samych ścieżek z `https://zawlodzki.pl`. [facts.json](facts.json) zawiera etykiety, cele, nagłówki i współrzędne obu wersji. To publiczny render, bez inventory i bez zapisu do Sanity. Przeanalizowano wszystkie strony poza artykułami, siedem widoków listy bloga i próbę czterech wpisów: AI, cennik Asany, audyt CRM i instrukcję obsługi leadów. Pozostałe wpisy są wymienione w `discovered`, ale nie były oceniane indywidualnie. Próba obejmuje różne intencje, długości i daty publikacji. `/blog/pipedrive-cennik` nie występuje w sitemapie, więc nie jest częścią próby.

CTA oznacza tu wezwanie do kontaktu, zakupu, zapisu lub przejścia do oferty. Linki spisu treści i powiązanych wpisów są nawigacją. Tabele stagingu dotyczą treści głównej. Live nie zawsze ma semantyczny `main`, wtedy kolektor odczytuje `body`, łącznie z nagłówkiem i stopką; porównanie live jest jakościowe, bez porównywania liczby CTA. Globalny przycisk "Bezpłatna konsultacja" w nagłówku jest stale dostępny i nie zastępuje CTA w treści. Zwykłe linki prawne nie są CTA.

Współrzędna `y` jest odległością od góry dokumentu, nie procentem przeczytanej treści. Ekrany to przybliżenie `różnica y / 900`, nie pomiar zaangażowania. Najdłuższa przerwa liczy się między wezwanami do konwersji, w tym formularzami i odsyłaczami do ofert. Lista nagłówków w luce pomaga znaleźć jej kontekst. Nie każda luka wymaga przycisku, zwłaszcza w artykułach i dokumentach prawnych. Ukryte odpowiedzi FAQ i nieaktywne zakładki nie są osobnymi ekranami.

Rekomendacje zachowują PRODUCT.md i DESIGN.md: jedna podstawowa ścieżka do konsultacji, newsletter dla niezdecydowanych, pierwsza osoba, brak wymyślonych wyników. Docelowo około dwóch ekranów między promocyjnymi CTA. Przed wdrożeniem ponownie zmierzyć odstępy na 390 i 1440 px. Nie dodawać równocześnie wszystkich propozycji, jeśli po zmianie treści wypadają blisko cennika lub obecnego przycisku. W blogu rekomenduję jeden zwykły link w treści, bez nowego PromoCard.

Ranking to ocena intencji i długości przerwy, bez danych analitycznych lub obietnicy wzrostu konwersji. Nie testowano wysyłki formularzy, zakupu ani zapisu. Obecne etykiety "30 minut" i kalendarz `/30min` odbiegają od 25 minut w PRODUCT.md. Nie powielać długości rozmowy w nowych CTA przed ujednoliceniem treści. Nie traktować dat przedsprzedaży ani cen jako zatwierdzonej oferty.

## Dziesięć rekomendacji według spodziewanego wpływu

| Miejsce | Strona | Priorytet | Propozycja i powód |
| --- | --- | --- | --- |
| 1 | `/kurs-ai-w-sprzedazy` | wysoki | Sprawdź, czy kurs pasuje do Twojego procesu; drugi: Zapytaj o pracę na Twoim CRM. Czytelnik może zweryfikować dopasowanie, zanim przeczyta cały program. Nie kopiować linku zakupu bez potwierdzenia aktualności przedsprzedaży. |
| 2 | `/wdrozenie-ai-w-sprzedazy-b2b` | wysoki | Sprawdźmy pierwszy proces dla AI. Po rozpoznaniu problemu można od razu przejść do rozmowy, bez kolejnych kroków i cennika. |
| 3 | `/audyt-ai-sprzedaz` | wysoki | Sprawdźmy, czy audyt AI ma u Was sens. Hero i cennik dzieli niemal sześć ekranów, a kwalifikacja jest naturalnym miejscem decyzji. |
| 4 | `/sales-atlas-system` | wysoki | Ustalmy, od której warstwy zacząć. Wynik samooceny powinien prowadzić do rozmowy, bez szukania kontaktu w FAQ. |
| 5 | `/blog/ai-w-sprzedazy` | średni | Chcesz sprawdzić taki proces w swojej firmie? Porozmawiajmy.. Czytelnik właśnie poznał konkretny obieg. Jeden spokojny link wystarczy; bez baneru w środku artykułu. |
| 6 | `/szkolenie-i-wdrozenie-pipedrive` | średni | Omówmy migrację Twoich danych. Zmniejsza niepewność dotyczącą migracji w długim opisie procesu. |
| 7 | `/program-ai-dla-zespolu-sprzedazy` | średni | Sprawdźmy, czy zespół jest gotowy. Dopasowanie jest ważniejsze niż ponawianie komunikatu o pierwszej grupie. Najpierw potwierdzić aktualność terminu programu. |
| 8 | `/blog/audyt-wdrozonego-crm` | średni | Chcesz omówić wynik swojej checklisty? Napisz do mnie.. Pomaga przejść od samodzielnej diagnozy do rozmowy, bez przerywania checklisty. |
| 9 | `/automatyzacje-dla-pipedrive` | średni | Omówmy jeden przepływ w Twoim CRM. Wypełnia lukę pomiędzy opisem problemu a końcowym formularzem. |
| 10 | `/blog/asana-cennik` | średni | Chcesz policzyć koszt dla swojego zespołu? Napisz do mnie.. Pomoc jest powiązana z obliczeniem kosztu, bez nowego cennika i obietnic oszczędności. |

## Pełnostronicowe zrzuty pięciu pierwszych stron

Czerwone linie i numery oznaczają miejsca wstawienia, nie wdrożone przyciski. Numer 1 na każdej stronie odpowiada jej rekomendacji poniżej. Kurs ma dodatkowy opcjonalny punkt 2. Surowe PNG i DOM są w `screens/`, pliki `marks.json` zapisują kotwicę i pozycję. Zrzuty pochodzą z lokalnego Workera przy HEAD `3102f47`, zbudowanego z opublikowanego datasetu production, a nie z hosta staging. Analiza stagingu i live jest oddzielnie w `facts.json`. Zgodność kotwic potwierdzono przy przechwyceniu; pikselowej identyczności deploymentów nie zakładam.

Uruchomiono `web.sh up --port 8790 --no-build` po wcześniejszym pełnym buildzie, `doctor`, `probe` i `shot`, a na końcu `down`. Wszystkie pięć URL zwróciło 200 i `X-Robots-Tag: noindex, nofollow`. [probes.tsv](screens/probes.tsv) zapisuje wyniki. Standardowy helper ma stałą wysokość 900 px. Adapter [shot-chrome.mjs](shot-chrome.mjs) podany przez `CHROME_BIN` zachowuje viewport 1280 × 900, przewija lazy content i przechwytuje cały dokument przez CDP. Nie zmienia helpera ani aplikacji. Wspólna przeglądarka T3 nie otworzyła się z powodu blokady AppArmor. Odczyt wykonano Chrome przez CDP.

- `/kurs-ai-w-sprzedazy`: [z adnotacjami](screens/_kurs-ai-w-sprzedazy-w1280-annotated.png), [oryginał](screens/_kurs-ai-w-sprzedazy-w1280.png), [DOM](screens/_kurs-ai-w-sprzedazy-w1280.dom.html).
- `/wdrozenie-ai-w-sprzedazy-b2b`: [z adnotacjami](screens/_wdrozenie-ai-w-sprzedazy-b2b-w1280-annotated.png), [oryginał](screens/_wdrozenie-ai-w-sprzedazy-b2b-w1280.png), [DOM](screens/_wdrozenie-ai-w-sprzedazy-b2b-w1280.dom.html).
- `/audyt-ai-sprzedaz`: [z adnotacjami](screens/_audyt-ai-sprzedaz-w1280-annotated.png), [oryginał](screens/_audyt-ai-sprzedaz-w1280.png), [DOM](screens/_audyt-ai-sprzedaz-w1280.dom.html).
- `/sales-atlas-system`: [z adnotacjami](screens/_sales-atlas-system-w1280-annotated.png), [oryginał](screens/_sales-atlas-system-w1280.png), [DOM](screens/_sales-atlas-system-w1280.dom.html).
- `/blog/ai-w-sprzedazy`: [z adnotacjami](screens/_blog_ai-w-sprzedazy-w1280-annotated.png), [oryginał](screens/_blog_ai-w-sprzedazy-w1280.png), [DOM](screens/_blog_ai-w-sprzedazy-w1280.dom.html).

Zastrzeżenie dla Sales Atlas: zrzut pokazuje dużą pustą przestrzeń pod zakładkami. Wysokość tej sekcji zwiększa podany odstęp. Proponowany CTA jest po samoocenie, nie w pustej przestrzeni. Ewentualna korekta układu to osobne zadanie, przed ponownym pomiarem rytmu CTA.

Odtworzenie danych: `CHROME_BIN=/opt/agent-vm/chromium/chrome node migration/lanes/design/out/t41-cta-audit/collect.mjs`. Przy kolejnym uruchomieniu dane mogą się zmienić wraz z publikacją treści. Dla zrzutów po `web.sh up` i `doctor` ustawić `CHROME_BIN` na absolutną ścieżkę `shot-chrome.mjs`, uruchomić `web.sh shot <ścieżka> --port 8790` i zakończyć przez `web.sh down --port 8790`. Adapter jest narzędziem audytu, nie zmianą aplikacji.

## Wykonalność

`ctaBand` pozwala ustawić nagłówek, treść i link. `feature.cta` daje przycisk przy danym kroku. Oba wymagają tylko treści Sanity. Link w Portable Text także nie wymaga kodu. `PromoCard` generuje etykietę "Zobacz {tytuł strony}" i wskazuje referencję strony, więc nie nadaje się do dowolnej etykiety konsultacji. Przycisk wewnątrz elementu `tabs` wymaga nowego pola i renderowania. Kurs ma program w zakładkach, więc drugi proponowany punkt należy traktować jako osobną zmianę kodu. W tym zadaniu niczego z tych zmian nie wykonano.

## Ocena każdej strony

### `/`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Umów bezpłatną konsultację | `/kontakt` | 530 px |
| Dowiedz się więcej o pipedrive.com | `/szkolenie-i-wdrozenie-pipedrive` | 3488 px |
| Dowiedz się więcej o AI dla sprzedaży | `/wdrozenie-ai-w-sprzedazy-b2b` | 3987 px |
| Dowiedz się więcej o automatyzacji | `/automatyzacje-dla-pipedrive` | 4370 px |
| Dowiedz się więcej o asana.com | `/szkolenie-i-wdrozenie-asana` | 4835 px |
| Porozmawiajmy o współpracy | `/kontakt` | 5089 px |
| Dowiedz się o mnie więcej | `/o-mnie` | 5692 px |
| Wyślij zapytanie | `submit` | 7367 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 7215 px |
| +48571088338 | `tel:+48571088338` | 7263 px |
| Zapisuję się | `submit` | 7746 px |

Najdłuższy odcinek bez powyższych CTA: y=530–3488 px, około 3.3 ekranu. Obejmuje: "Firmy które korzystają już z mojego doświadczenia"; "Aplikacje nie współpracują, więc handlowiec robi za integrację"; "Skąd wiedzieć, że to dobry moment na współpracę?"; "Dane o kliencie są rozproszone między CRM, pocztą i dokumentami, excelami.". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 9411 px wobec 8595 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Umów bezpłatną konsultację" → `/kontakt` przy y=598. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać teraz. Linki usług prowadzą kolejno do ofert, dalej jest kontakt i formularz. Długa przerwa na początku obejmuje rozpoznanie problemu. Jeśli testować skrócenie, przenieść istniejący link do współpracy po tej diagnozie zamiast mnożyć przyciski.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/audyt-ai-sprzedaz`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Umów rozmowę o audycie | `/kontakt` | 547 px |
| Umów audyt AI | `/kontakt` | 5816 px |
| Umów audyt AI | `/kontakt` | 6358 px |
| Zobacz Sales Atlas System | `/sales-atlas-system` | 6828 px |
| Wyślij zapytanie | `submit` | 8620 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 8469 px |
| +48571088338 | `tel:+48571088338` | 8517 px |

Najdłuższy odcinek bez powyższych CTA: y=547–5816 px, około 5.9 ekranu. Obejmuje: "Doświadczenie z wdrożeń CRM i automatyzacji w ponad 50 firmach"; "Najdroższy błąd: wdrożyć AI tam, gdzie nie ma to sensu."; "Dla kogo jest audyt AI w sprzedaży"; "Macie kilka pomysłów na AI, ale nie wiecie, który ma najlepszy stosunek efektu do kosztu.". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 10691 px wobec 9424 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Umów rozmowę o audycie" → `/kontakt` przy y=690. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet wysoki: Po "Dla kogo jest audyt AI w sprzedaży", przed "Dwa tygodnie pracy. Pięć kroków do decyzji.".

- Typ: CtaBand.
- Tekst: "Sprawdźmy, czy audyt AI ma u Was sens".
- Cel: `/kontakt`. To wejście na stronę kontaktu, nie bezpośrednie wysłanie formularza.
- Wdrożenie: Tylko Sanity: ctaBand.
- Powód: Hero i cennik dzieli niemal sześć ekranów, a kwalifikacja jest naturalnym miejscem decyzji.

### `/audyt-crm-pipedrive`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Umów audyt Pipedrive | `/kontakt` | 530 px |
| Sprawdźmy, co jest zepsute | `/kontakt` | 1943 px |
| Umów audyt Pipedrive | `/kontakt` | 6050 px |
| Ustalmy zakres i cenę | `/kontakt` | 6050 px |
| Umów audyt Pipedrive | `/kontakt` | 7352 px |
| Zobacz Sales Atlas System | `/sales-atlas-system` | 8956 px |
| kontakt | `/kontakt` | 9763 px |
| kontakt | `/kontakt` | 10026 px |
| Wyślij zapytanie | `submit` | 10814 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 10663 px |
| +48571088338 | `tel:+48571088338` | 10711 px |

Najdłuższy odcinek bez powyższych CTA: y=1943–6050 px, około 4.6 ekranu. Obejmuje: "Audyt ma sens, jeśli Pipedrive działa u Was, ale nie tak, jak oczekiwałeś"; "Pipedrive działa od kilkunastu miesięcy, a handlowcy dalej trzymają najważniejsze ustalenia poza systemem."; "Raporty nie zgadzają się z tym, co sam widzisz w sprzedaży, więc przestałeś na nie patrzeć."; "Lejek ma etapy ustawione w pierwszym tygodniu wdrożenia i nikt ich od tamtej pory nie ruszał.". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 12727 px wobec 11618 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Umów audyt Pipedrive" → `/kontakt` przy y=598. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet średni: Po "Struktura danych i pól", przed "Konfiguracja, automatyzacje i integracje".

- Typ: Przycisk inline.
- Tekst: "Omówmy problemy z danymi w Pipedrive".
- Cel: `/kontakt`. To wejście na stronę kontaktu, nie bezpośrednie wysłanie formularza.
- Wdrożenie: Tylko Sanity: feature.cta.
- Powód: Jedno wezwanie w procesie wystarczy, bo cennik i końcowy baner już prowadzą do kontaktu.

### `/audyt-procesow-asana`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Umów audyt Asany | `/kontakt` | 530 px |
| Sprawdźmy, gdzie utykają projekty | `/kontakt` | 1861 px |
| Umów audyt Asany | `/kontakt` | 5931 px |
| Ustalmy zakres i cenę | `/kontakt` | 5931 px |
| Umów audyt Asany | `/kontakt` | 7158 px |
| Wyślij zapytanie | `submit` | 10281 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 10130 px |
| +48571088338 | `tel:+48571088338` | 10178 px |

Najdłuższy odcinek bez powyższych CTA: y=1861–5931 px, około 4.5 ekranu. Obejmuje: "Audyt ma sens, jeśli Asana działa u Was, ale nikt jej nie ufa"; "Asana działa od roku albo dłużej, ale każdy zespół zbudował w niej własny porządek."; "Projekty startują z szablonów, których nikt nie aktualizował, więc połowa zadań idzie do kasowania już na starcie."; "Status projektu i tak trzeba odtwarzać na odprawie, bo w systemie nie widać, co realnie stoi.". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 12173 px wobec 11085 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Umów audyt Asany" → `/kontakt` przy y=598. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet średni: Po "Praca zespołu na realnych projektach", przed "Automatyzacje, raporty, integracje i AI".

- Typ: Przycisk inline.
- Tekst: "Porozmawiajmy o Waszych projektach".
- Cel: `/kontakt`. To wejście na stronę kontaktu, nie bezpośrednie wysłanie formularza.
- Wdrożenie: Tylko Sanity: feature.cta.
- Powód: Domyka rozpoznanie problemu przed techniczną częścią audytu.

### `/audyt-sprzedazy`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Umów audyt sprzedaży | `/kontakt` | 547 px |
| Sprawdźmy, gdzie jest blokada | `/kontakt` | 1895 px |
| Umów audyt sprzedaży | `/kontakt` | 6015 px |
| Porozmawiajmy o wdrożeniu | `/kontakt` | 6015 px |
| Umów audyt sprzedaży | `/kontakt` | 6725 px |
| Sales Atlas System | `/sales-atlas-system` | 7377 px |
| Umów rozmowę | `/kontakt` | 7377 px |
| Zobacz Sales Atlas System | `/sales-atlas-system` | 8319 px |
| Wyślij zapytanie | `submit` | 10177 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 10026 px |
| +48571088338 | `tel:+48571088338` | 10074 px |

Najdłuższy odcinek bez powyższych CTA: y=1895–6015 px, około 4.6 ekranu. Obejmuje: "Audyt ma sens, jeśli firma nie realizuje planu i nie wie dlaczego"; "Właściciel, dyrektor sprzedaży i handlowcy inaczej oceniają przyczynę słabszego wyniku."; "Korzystacie z inboundu, outboundu, poleceń albo partnerów, ale nie wiecie, które źródła dowożą wartościowe szanse."; "Handlowcy opowiadają o ofercie na kilka różnych sposobów, a cena zbyt często staje się głównym argumentem.". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 12194 px wobec 10981 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Umów audyt sprzedaży" → `/kontakt` przy y=630. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet średni: Po "Proces sprzedaży", przed "Zespół i wynagradzanie".

- Typ: Przycisk inline.
- Tekst: "Ustalmy zakres diagnozy sprzedaży".
- Cel: `/kontakt`. To wejście na stronę kontaktu, nie bezpośrednie wysłanie formularza.
- Wdrożenie: Tylko Sanity: feature.cta.
- Powód: Pomaga wybrać zakres po pierwszych trzech obszarach audytu.

### `/automatyzacja-procesow-biznesowych-nocode`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Porozmawiajmy o automatyzacji | `/kontakt` | 543 px |
| Sprawdź, co da się uprościć | `/kontakt` | 1877 px |
| Wskaż swój powtarzalny proces | `/kontakt` | 2883 px |
| Zapytaj o swój przypadek | `/kontakt` | 3586 px |
| Zapytaj o abonament | `/kontakt` | 4220 px |
| Zapytaj o pakiet Standard | `/kontakt` | 4729 px |
| Zapytaj o pakiet PRO | `/kontakt` | 4729 px |
| Sprawdź Newsletter | `/newsletter` | 4729 px |
| Opisz swój proces | `/kontakt` | 5784 px |
| Zobacz Sales Atlas System | `/sales-atlas-system` | 6755 px |
| Wyślij zapytanie | `submit` | 8416 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 8264 px |
| +48571088338 | `tel:+48571088338` | 8312 px |

Najdłuższy odcinek bez powyższych CTA: y=6755–8264 px, około 1.7 ekranu. Obejmuje: "Najczęściej zadawane pytania"; "Skontaktuj się ze mną"; "Formularz kontaktowy"; "Bezpośredni kontakt".

Porównanie live: wysokość 9603 px wobec 9220 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Porozmawiajmy o automatyzacji" → `/kontakt` przy y=620. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać. Kolejne CTA w opisie zastosowań i abonamentu występują częściej niż co dwa ekrany. Najpierw rozważyć ograniczenie powtórzeń.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/automatyzacje-dla-pipedrive`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Porozmawiajmy o automatyzacjach | `/kontakt` | 603 px |
| Policzmy, ile czasu to zjada | `/kontakt` | 1948 px |
| Opisz swój proces | `/kontakt` | 5331 px |
| Zobacz Sales Atlas System | `/sales-atlas-system` | 5801 px |
| Wyślij zapytanie | `submit` | 7528 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 7376 px |
| +48571088338 | `tel:+48571088338` | 7424 px |

Najdłuższy odcinek bez powyższych CTA: y=1948–5331 px, około 3.8 ekranu. Obejmuje: "Sprawdź, czy automatyzacje coś zmienią w Twojej firmie"; "Leady z reklam i formularzy trafiają do skrzynki, a do CRM „jak ktoś ma czas"."; "Handlowcy spędzają godziny na wpisywaniu danych, tworzeniu folderów i potwierdzeniach zamiast na rozmowach."; "Po wygranej szansie realizacja dostaje maila o nowym kliencie, zamiast kompletu danych.". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 9012 px wobec 8331 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Porozmawiajmy o automatyzacjach" → `/kontakt` przy y=725. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet średni: Po "Budowa i testy", przed "Uruchomienie z zespołem".

- Typ: Przycisk inline.
- Tekst: "Omówmy jeden przepływ w Twoim CRM".
- Cel: `/kontakt`. To wejście na stronę kontaktu, nie bezpośrednie wysłanie formularza.
- Wdrożenie: Tylko Sanity: feature.cta.
- Powód: Wypełnia lukę pomiędzy opisem problemu a końcowym formularzem.

### `/blog`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Następne wpisy | `/blog/strona/2` | 2713 px |
| Zapisuję się | `submit` | 3035 px |

Najdłuższy odcinek bez powyższych CTA: y=0–2713 px, około 3.0 ekranu. Obejmuje: "Blog"; "Asana vs Jira: co ma wiedzieć zespół i szef?"; "Asana vs Trello: kiedy tablice wystarczają, a kiedy potrzebny jest portfel projektów"; "Asana vs monday.com: pięć decyzji przed wdrożeniem". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 3674 px wobec 3883 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Zapisuję się" → `submit` przy y=2797. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać CTA między kartami. Lista służy wyborowi artykułu, a newsletter jest pod paginacją. Zachować ten sam układ na kolejnych stronach.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/blog/5-krokow-do-obslugi-kazdego-leada-w-5-minut`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Porozmawiajmy | `/kontakt` | 6075 px |
| Umów konsultację | `/kontakt` | 6405 px |
| Zapisuję się | `submit` | 7464 px |

Najdłuższy odcinek bez powyższych CTA: y=0–6075 px, około 6.8 ekranu. Obejmuje: "5 kroków do obsługi każdego leada w 5 minut"; "Krok 1: zbierz informacje o nowym kontakcie"; "Krok 2: dodaj informacje o nowym kontakcie do systemu CRM"; "Krok 3: dodaj nowy kontakt do aplikacji mailingowej". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 6909 px wobec 8313 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Porozmawiajmy" → `/kontakt` przy y=410. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać. Zachować pięć kroków jako całość. Po podsumowaniu jest już "Porozmawiajmy", następnie końcowa konsultacja i newsletter.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/blog/ai-w-sprzedazy`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| umówić 30 minut rozmowy | `/kontakt` | 16300 px |
| Porozmawiajmy | `/kontakt` | 17425 px |
| Umów konsultację | `/kontakt` | 17779 px |
| Zapisuję się | `submit` | 18862 px |

Najdłuższy odcinek bez powyższych CTA: y=0–16300 px, około 18.1 ekranu. Obejmuje: "AI w sprzedaży działa dopiero wtedy, gdy zmienia cały proces"; "Czym różni się narzędzie AI, automatyzacja i wdrożenie AI w sprzedaży?"; "Do czego AI w sprzedaży B2B nadaje się na początek?"; "Z czego składa się wdrożenie AI w sprzedaży?". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 22998 px wobec 19710 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Porozmawiajmy" → `/kontakt` przy y=460. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet średni: Po "Jak wygląda proces od spotkania do następnego działania?", przed "Jak wdrożyć AI w sprzedaży krok po kroku?".

- Typ: Link kontaktowy w akapicie.
- Tekst: "Chcesz sprawdzić taki proces w swojej firmie? Porozmawiajmy.".
- Cel: `https://www.zawlodzki.pl/kontakt`. To wejście na stronę kontaktu, nie bezpośrednie wysłanie formularza.
- Wdrożenie: Tylko Sanity: link w Portable Text.
- Powód: Czytelnik właśnie poznał konkretny obieg. Jeden spokojny link wystarczy; bez baneru w środku artykułu.

### `/blog/asana-cennik`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| umów 30 minut rozmowy | `/kontakt` | 13610 px |
| Porozmawiajmy | `/kontakt` | 14711 px |
| Umów konsultację | `/kontakt` | 15041 px |
| Zapisuję się | `submit` | 16100 px |

Najdłuższy odcinek bez powyższych CTA: y=0–13610 px, około 15.1 ekranu. Obejmuje: "Ile kosztuje Asana i za które funkcje warto dopłacić przy wdrożeniu"; "Asana Personal: kiedy darmowy plan wystarczy"; "Asana Starter: plan do pierwszego procesu zespołowego"; "Asana Advanced: kiedy portfolio uzasadnia dopłatę". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 19794 px wobec 16948 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Porozmawiajmy" → `/kontakt` przy y=385. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet średni: Po "Ile miejsc Asana doliczy do rachunku", przed "Rocznie czy miesięcznie".

- Typ: Link kontaktowy w akapicie.
- Tekst: "Chcesz policzyć koszt dla swojego zespołu? Napisz do mnie.".
- Cel: `https://www.zawlodzki.pl/kontakt`. To wejście na stronę kontaktu, nie bezpośrednie wysłanie formularza.
- Wdrożenie: Tylko Sanity: Portable Text.
- Powód: Pomoc jest powiązana z obliczeniem kosztu, bez nowego cennika i obietnic oszczędności.

### `/blog/audyt-wdrozonego-crm`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Porozmawiajmy | `/kontakt` | 14428 px |
| Umów konsultację | `/kontakt` | 14758 px |
| Zapisuję się | `submit` | 15817 px |

Najdłuższy odcinek bez powyższych CTA: y=0–14428 px, około 16.0 ekranu. Obejmuje: "Audyt wdrożonego CRM: jak sprawdzić, czy system daje to, co miał dawać"; "Po czym poznać, że wdrożony CRM nie działa"; "Dziewięć rzeczy do sprawdzenia w CRM, którego nikt nie używa"; "Co zrobić z wynikiem". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 18895 px wobec 16666 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Porozmawiajmy" → `/kontakt` przy y=385. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet średni: Po "Co zrobić z wynikiem", przed "Czego ta lista nie sprawdzi".

- Typ: Link kontaktowy w akapicie.
- Tekst: "Chcesz omówić wynik swojej checklisty? Napisz do mnie.".
- Cel: `https://www.zawlodzki.pl/kontakt`. To wejście na stronę kontaktu, nie bezpośrednie wysłanie formularza.
- Wdrożenie: Tylko Sanity: Portable Text.
- Powód: Pomaga przejść od samodzielnej diagnozy do rozmowy, bez przerywania checklisty.

### `/darmowe-materialy-dla-biznesow-uslugowych`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Zapisuję się | `submit` | 1159 px |

Najdłuższy odcinek bez powyższych CTA: y=0–1159 px, około 1.3 ekranu. Obejmuje: "Darmowe materiały dla biznesów usługowych"; "Darmowe materiały dla biznesów usługowych"; "Podstawowe zasady jak korzystać z asana.com Dobry system pracy w asanie można poznać, po tym że spełnia swoje zadanie i jest skalowalny."; "Lista wskazówek podstawowego wdrożenia CRM pipedrive.com Dobre zaplanowanie wdrożenia systemu CRM zadecyduje o jego późniejszym sukcesie lub porażce.". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 2323 px wobec 2008 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Zapisuję się" → `submit` przy y=1446. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać. Opisy materiałów i zapis na newsletter wystarczają. Karty nie mają osobnych aktywnych linków w renderze stagingu. Sprzedażowy baner odciągałby od pobrania.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/kontakt`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Wyślij zapytanie | `submit` | 784 px |
| przejdź do mojego kalendarza ↗︎ | `https://cal.com/zawlodzki/30min` | 513 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 1280 px |
| +48 571 088 338 | `tel:+48571088338` | 1328 px |
| Zapisuję się | `submit` | 1738 px |

Najdłuższy odcinek bez powyższych CTA: y=1738–2587 px, około 0.9 ekranu. Brak osobnych nagłówków w tym odcinku.

Porównanie live: wysokość 2749 px wobec 2587 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Wyślij zapytanie" → `submit` przy y=910. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać. Formularz i kalendarz są dostępne od początku. Dodatkowa akcja konkurowałaby z wyborem sposobu kontaktu.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/kurs-ai-w-sprzedazy`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Kup w przedsprzedaży | `https://cart.easy.tools/checkout/53466467/kurs-ai-w-sprzedazy` | 664 px |
| Kup w przedsprzedaży | `https://cart.easy.tools/checkout/53466467/kurs-ai-w-sprzedazy` | 12171 px |
| Zadaj pytanie o kurs | `/kontakt` | 13103 px |
| Zobacz Sales Atlas System | `/sales-atlas-system` | 13548 px |
| Wyślij zapytanie | `submit` | 15472 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 15321 px |
| +48571088338 | `tel:+48571088338` | 15369 px |

Najdłuższy odcinek bez powyższych CTA: y=664–12171 px, około 12.8 ekranu. Obejmuje: "Metoda z ponad 50 wdrożeń CRM i automatyzacji"; "Prompty przechodzą. Proces zostaje."; "Sprawdź, czy ten kurs jest dla ciebie"; "Chcesz zacząć od najtańszej rzeczy i sam sprawdzić, czy AI ma sens w waszej sprzedaży.". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 17144 px wobec 16276 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Kup w przedsprzedaży" → `https://cart.easy.tools/checkout/53466467/kurs-ai-w-sprzedazy` przy y=749. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet wysoki: Po sekcji "Sprawdź, czy ten kurs jest dla ciebie", przed "Osiem modułów, osiem rozwiązań na koniec". Drugi, opcjonalny punkt po "Pierwszy skill w Claude albo ChatGPT", przed "Automatyzacje CRM i porządek w danych".

- Typ: Przycisk inline.
- Tekst: "Sprawdź, czy kurs pasuje do Twojego procesu; drugi: Zapytaj o pracę na Twoim CRM".
- Cel: `/kontakt`. To wejście na stronę kontaktu, nie bezpośrednie wysłanie formularza.
- Wdrożenie: Kod dla przycisku między elementami tabs; pierwszy punkt może być osobnym CtaBand w Sanity.
- Powód: Czytelnik może zweryfikować dopasowanie, zanim przeczyta cały program. Nie kopiować linku zakupu bez potwierdzenia aktualności przedsprzedaży.

### `/newsletter`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Zapisuję się | `submit` | 281 px |

Najdłuższy odcinek bez powyższych CTA: y=281–1630 px, około 1.5 ekranu. Obejmuje: "Ostatnie wpisy"; "System premiowy, który nie karze firmy za wzrost sprzedaży"; "Co da się wyciągnąć z transkrypcji spotkań handlowych"; "Co da się wyczytać z CRM w trakcie audytu".

Porównanie live: wysokość 1903 px wobec 1630 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Zapisuję się" → `submit` przy y=368. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać. Formularz jest w pierwszym ekranie, archiwum buduje zaufanie i całość ma mniej niż dwa ekrany.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/o-mnie`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Porozmawiajmy o wdrożeniu | `/kontakt` | 2765 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 3215 px |
| +48 571 088 338 | `tel:+48571088338` | 3263 px |
| Zapisuję się | `submit` | 5254 px |

Najdłuższy odcinek bez powyższych CTA: y=0–2765 px, około 3.1 ekranu. Obejmuje: "Grzegorz Zawłodzki - konsultant CRM i automatyzacji sprzedaży B2B"; "Jak zaczynałem?"; "Komu Pomagam?"; "Jak pracuję?". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 6621 px wobec 6102 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Porozmawiajmy o wdrożeniu" → `/kontakt` przy y=2940. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać. Po opisie rezultatów jest już "Porozmawiajmy o wdrożeniu", potem kanały kontaktu. CTA po opiniach byłoby blisko obecnego kontaktu i newslettera.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/polityka-prywatnosci`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Brak wezwań sprzedażowych | — | — |

Najdłuższy odcinek bez powyższych CTA: y=0–20363 px, około 22.6 ekranu. Obejmuje: "Polityka prywatności www.zawlodzki.pl"; "1. Administrator danych"; "2. Jakie dane przetwarzamy, po co i jak długo"; "3. Odbiorcy danych". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 12971 px wobec 20363 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "/* Sales Atlas System — badge z pulsującym promieniem. Pierścień z gradientu stożkowego przycięty maską do samej ramki plakietki, plus jego rozmyta kopia jako poświata. Rozmiar: --sas-szer / --sas-wys. */ .sas-beam{--sas-czas:11s;--sas-moc:1.15;--sas-rozmycie:2.6cqw;--sas-ramka:3.099%;--sas-szer:3.4135rem;--sas-wys:5rem;position:relative;display:block;width:var(--sas-szer);height:var(--sas-wys);border-radius:14.648% / 10%;container-type:inline-size;isolation:isolate} .sas-beam__plyta{position:absolute;inset:0;width:100%;height:100%;display:block} .sas-beam__ring{position:absolute;inset:0;display:block;overflow:hidden;border-radius:inherit;padding:var(--sas-ramka);pointer-events:none;mix-blend-mode:screen;-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude;animation:sas-iskra 6.7s ease-in-out infinite} .sas-beam__ring>i{position:absolute;left:50%;top:50%;width:170%;aspect-ratio:1;display:block;transform:translate(-50%,-50%) rotate(0deg);animation:sas-obieg var(--sas-czas) linear infinite,sas-oddech 4.4s ease-in-out infinite;background:conic-gradient(from 0deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0) 56%,rgba(182,241,255,.05) 60%,rgba(182,241,255,.22) 64.5%,rgba(235,237,250,.6) 68%,#fff 69.8%,rgba(235,237,250,.6) 71.5%,rgba(10,207,254,.3) 75%,rgba(10,207,254,.08) 80%,rgba(255,255,255,0) 85%)} .sas-beam__glow{position:absolute;inset:0;border-radius:inherit;pointer-events:none;mix-blend-mode:screen;opacity:.75;filter:blur(2px) saturate(1.25)} @supports (width:1cqw){.sas-beam__glow{filter:blur(var(--sas-rozmycie)) saturate(1.25)}} .sas-beam__glow .sas-beam__ring{mix-blend-mode:normal} @keyframes sas-obieg{to{transform:translate(-50%,-50%) rotate(360deg)}} @keyframes sas-oddech{0%,100%{opacity:calc(var(--sas-moc)*.32)}38%{opacity:calc(var(--sas-moc)*1)}62%{opacity:calc(var(--sas-moc)*.78)}} @keyframes sas-iskra{0%,62%,100%{filter:brightness(1)}74%{filter:brightness(1.45)}86%{filter:brightness(1.05)}} @media (prefers-reduced-motion:reduce){.sas-beam__ring{animation:none}.sas-beam__ring>i{animation:none;opacity:var(--sas-moc);transform:translate(-50%,-50%) rotate(288deg)}}" → `/sales-atlas-system` przy y=12359. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać promocyjnego CTA. Dokument prawny, potwierdzenie zapisu lub widok błędu powinien prowadzić do zakończenia swojej podstawowej czynności.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/program-ai-dla-zespolu-sprzedazy`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Zapisz się na pierwszą grupę | `/kontakt` | 664 px |
| Zapisz się na pierwszą grupę | `/kontakt` | 7389 px |
| Zapisz się na pierwszą grupę | `/kontakt` | 8354 px |
| Zobacz Sales Atlas System | `/sales-atlas-system` | 8800 px |
| Wyślij zapytanie | `submit` | 10593 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 10441 px |
| +48571088338 | `tel:+48571088338` | 10489 px |

Najdłuższy odcinek bez powyższych CTA: y=664–7389 px, około 7.5 ekranu. Obejmuje: "Doświadczenie z wdrożeń CRM i automatyzacji w ponad 50 firmach"; "Szkolenie kończy się w piątek. W poniedziałek nic się nie zmienia."; "Sprawdź, czy ten program pasuje do twojej firmy"; "Macie czas zespołu, ale nie macie budżetu na pełne wdrożenie.". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 12233 px wobec 11397 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Zapisz się na pierwszą grupę" → `/kontakt` przy y=749. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet średni: Po "Sprawdź, czy ten program pasuje do twojej firmy", przed "Pięć kroków w osiem tygodni".

- Typ: CtaBand.
- Tekst: "Sprawdźmy, czy zespół jest gotowy".
- Cel: `/kontakt`. To wejście na stronę kontaktu, nie bezpośrednie wysłanie formularza.
- Wdrożenie: Tylko Sanity: ctaBand.
- Powód: Dopasowanie jest ważniejsze niż ponawianie komunikatu o pierwszej grupie. Najpierw potwierdzić aktualność terminu programu.

### `/program-partnerski`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Poleć klienta | `/kontakt` | 505 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl?subject=Program%20partnerski%20zg%C5%82oszenie` | 1626 px |
| Poleć klienta | `/kontakt` | 1843 px |
| Wyślij zapytanie | `submit` | 2751 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 2600 px |
| +48571088338 | `tel:+48571088338` | 2648 px |

Najdłuższy odcinek bez powyższych CTA: y=505–1626 px, około 1.2 ekranu. Obejmuje: "Firmy które korzystają już z mojego doświadczenia"; "Program partnerski krok po kroku".

Porównanie live: wysokość 3927 px wobec 3555 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Poleć klienta" → `/kontakt` przy y=569. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać. Hero, opis kroków i formularz już zapewniają trzy miejsca kontaktu.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/regulamin`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Brak wezwań sprzedażowych | — | — |

Najdłuższy odcinek bez powyższych CTA: y=0–15732 px, około 17.5 ekranu. Obejmuje: "Regulamin sklepu www.zawlodzki.pl"; "§ 1. Postanowienia ogólne"; "§ 2. Definicje"; "§ 3. Usługi elektroniczne i wymagania techniczne". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 12458 px wobec 15732 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "/* Sales Atlas System — badge z pulsującym promieniem. Pierścień z gradientu stożkowego przycięty maską do samej ramki plakietki, plus jego rozmyta kopia jako poświata. Rozmiar: --sas-szer / --sas-wys. */ .sas-beam{--sas-czas:11s;--sas-moc:1.15;--sas-rozmycie:2.6cqw;--sas-ramka:3.099%;--sas-szer:3.4135rem;--sas-wys:5rem;position:relative;display:block;width:var(--sas-szer);height:var(--sas-wys);border-radius:14.648% / 10%;container-type:inline-size;isolation:isolate} .sas-beam__plyta{position:absolute;inset:0;width:100%;height:100%;display:block} .sas-beam__ring{position:absolute;inset:0;display:block;overflow:hidden;border-radius:inherit;padding:var(--sas-ramka);pointer-events:none;mix-blend-mode:screen;-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude;animation:sas-iskra 6.7s ease-in-out infinite} .sas-beam__ring>i{position:absolute;left:50%;top:50%;width:170%;aspect-ratio:1;display:block;transform:translate(-50%,-50%) rotate(0deg);animation:sas-obieg var(--sas-czas) linear infinite,sas-oddech 4.4s ease-in-out infinite;background:conic-gradient(from 0deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0) 56%,rgba(182,241,255,.05) 60%,rgba(182,241,255,.22) 64.5%,rgba(235,237,250,.6) 68%,#fff 69.8%,rgba(235,237,250,.6) 71.5%,rgba(10,207,254,.3) 75%,rgba(10,207,254,.08) 80%,rgba(255,255,255,0) 85%)} .sas-beam__glow{position:absolute;inset:0;border-radius:inherit;pointer-events:none;mix-blend-mode:screen;opacity:.75;filter:blur(2px) saturate(1.25)} @supports (width:1cqw){.sas-beam__glow{filter:blur(var(--sas-rozmycie)) saturate(1.25)}} .sas-beam__glow .sas-beam__ring{mix-blend-mode:normal} @keyframes sas-obieg{to{transform:translate(-50%,-50%) rotate(360deg)}} @keyframes sas-oddech{0%,100%{opacity:calc(var(--sas-moc)*.32)}38%{opacity:calc(var(--sas-moc)*1)}62%{opacity:calc(var(--sas-moc)*.78)}} @keyframes sas-iskra{0%,62%,100%{filter:brightness(1)}74%{filter:brightness(1.45)}86%{filter:brightness(1.05)}} @media (prefers-reduced-motion:reduce){.sas-beam__ring{animation:none}.sas-beam__ring>i{animation:none;opacity:var(--sas-moc);transform:translate(-50%,-50%) rotate(288deg)}}" → `/sales-atlas-system` przy y=11846. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać promocyjnego CTA. Dokument prawny, potwierdzenie zapisu lub widok błędu powinien prowadzić do zakończenia swojej podstawowej czynności.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/regulamin-newslettera`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Brak wezwań sprzedażowych | — | — |

Najdłuższy odcinek bez powyższych CTA: y=0–7092 px, około 7.9 ekranu. Obejmuje: "Regulamin newslettera i materiałów bezpłatnych"; "§ 1. Kto wysyła newsletter"; "§ 2. Co dostajesz"; "§ 3. Wymagania techniczne". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 5695 px wobec 7092 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "/* Sales Atlas System — badge z pulsującym promieniem. Pierścień z gradientu stożkowego przycięty maską do samej ramki plakietki, plus jego rozmyta kopia jako poświata. Rozmiar: --sas-szer / --sas-wys. */ .sas-beam{--sas-czas:11s;--sas-moc:1.15;--sas-rozmycie:2.6cqw;--sas-ramka:3.099%;--sas-szer:3.4135rem;--sas-wys:5rem;position:relative;display:block;width:var(--sas-szer);height:var(--sas-wys);border-radius:14.648% / 10%;container-type:inline-size;isolation:isolate} .sas-beam__plyta{position:absolute;inset:0;width:100%;height:100%;display:block} .sas-beam__ring{position:absolute;inset:0;display:block;overflow:hidden;border-radius:inherit;padding:var(--sas-ramka);pointer-events:none;mix-blend-mode:screen;-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude;animation:sas-iskra 6.7s ease-in-out infinite} .sas-beam__ring>i{position:absolute;left:50%;top:50%;width:170%;aspect-ratio:1;display:block;transform:translate(-50%,-50%) rotate(0deg);animation:sas-obieg var(--sas-czas) linear infinite,sas-oddech 4.4s ease-in-out infinite;background:conic-gradient(from 0deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0) 56%,rgba(182,241,255,.05) 60%,rgba(182,241,255,.22) 64.5%,rgba(235,237,250,.6) 68%,#fff 69.8%,rgba(235,237,250,.6) 71.5%,rgba(10,207,254,.3) 75%,rgba(10,207,254,.08) 80%,rgba(255,255,255,0) 85%)} .sas-beam__glow{position:absolute;inset:0;border-radius:inherit;pointer-events:none;mix-blend-mode:screen;opacity:.75;filter:blur(2px) saturate(1.25)} @supports (width:1cqw){.sas-beam__glow{filter:blur(var(--sas-rozmycie)) saturate(1.25)}} .sas-beam__glow .sas-beam__ring{mix-blend-mode:normal} @keyframes sas-obieg{to{transform:translate(-50%,-50%) rotate(360deg)}} @keyframes sas-oddech{0%,100%{opacity:calc(var(--sas-moc)*.32)}38%{opacity:calc(var(--sas-moc)*1)}62%{opacity:calc(var(--sas-moc)*.78)}} @keyframes sas-iskra{0%,62%,100%{filter:brightness(1)}74%{filter:brightness(1.45)}86%{filter:brightness(1.05)}} @media (prefers-reduced-motion:reduce){.sas-beam__ring{animation:none}.sas-beam__ring>i{animation:none;opacity:var(--sas-moc);transform:translate(-50%,-50%) rotate(288deg)}}" → `/sales-atlas-system` przy y=5083. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać promocyjnego CTA. Dokument prawny, potwierdzenie zapisu lub widok błędu powinien prowadzić do zakończenia swojej podstawowej czynności.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/sales-atlas-system`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Umów bezpłatną konsultację | `/kontakt` | 472 px |
| Umów bezpłatną konsultację | `/kontakt` | 1784 px |
| kontakt | `/kontakt` | 7729 px |

Najdłuższy odcinek bez powyższych CTA: y=1784–7729 px, około 6.6 ekranu. Obejmuje: "Buduje się od dołu, czyta od góry"; "Czym Sales Atlas System nie jest"; "Nie jest metodyką rozmowy handlowej. SPIN, Challenger i SPICED opisują samą rozmowę w szczegółowy sposób."; "Nie jest zestawem kryteriów kwalifikacji. BANT czy MEDDIC pokrywają jeden element czwartej warstwy, nie cały system.". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 5838 px wobec 8352 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Umów bezpłatną konsultację" → `/kontakt` przy y=1898. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet wysoki: Po "Sprawdź, czy masz już system", przed "Skąd wziął się system sprzedaży".

- Typ: CtaBand.
- Tekst: "Ustalmy, od której warstwy zacząć".
- Cel: `/kontakt`. To wejście na stronę kontaktu, nie bezpośrednie wysłanie formularza.
- Wdrożenie: Tylko Sanity: ctaBand.
- Powód: Wynik samooceny powinien prowadzić do rozmowy, bez szukania kontaktu w FAQ.

### `/szkolenie-i-wdrozenie-asana`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Umów rozmowę o wdrożeniu | `/kontakt` | 578 px |
| Porozmawiajmy o waszych projektach | `/kontakt` | 1923 px |
| Zacznijmy wdrożenie | `/kontakt` | 5757 px |
| Ustalmy zakres i cenę | `/kontakt` | 5757 px |
| Umów rozmowę o wdrożeniu | `/kontakt` | 6984 px |
| Wyślij zapytanie | `submit` | 10139 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 9988 px |
| +48571088338 | `tel:+48571088338` | 10036 px |

Najdłuższy odcinek bez powyższych CTA: y=1923–5757 px, około 4.3 ekranu. Obejmuje: "Sprawdź, czy wdrożenie Asany pasuje do Twojej firmy"; "Prowadzicie równolegle kilka podobnych projektów klientów, ale każdy startuje inaczej."; "Ustalenia z klientem zostają w mailu albo w głowie prowadzącego. Realizacja dopytuje o rzeczy już uzgodnione."; "Status projektów znasz dopiero po odprawie, a nieobecność jednej osoby zatrzymuje pracę.". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 12246 px wobec 10943 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Umów rozmowę o wdrożeniu" → `/kontakt` przy y=700. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet średni: Po "Praca na realnych projektach", przed "Szkolenie z organizacji pracy".

- Typ: Przycisk inline.
- Tekst: "Omówmy pierwszy proces w Asanie".
- Cel: `/kontakt`. To wejście na stronę kontaktu, nie bezpośrednie wysłanie formularza.
- Wdrożenie: Tylko Sanity: feature.cta.
- Powód: Łączy opis wdrożenia z konkretnym projektem czytelnika.

### `/szkolenie-i-wdrozenie-pipedrive`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Umów rozmowę o wdrożeniu | `/kontakt` | 671 px |
| Porozmawiajmy o waszym procesie | `/kontakt` | 2098 px |
| Zacznijmy wdrożenie | `/kontakt` | 5954 px |
| Ustalmy zakres i cenę | `/kontakt` | 5954 px |
| Umów rozmowę o wdrożeniu | `/kontakt` | 7257 px |
| Zobacz Sales Atlas System | `/sales-atlas-system` | 8861 px |
| kontakt | `/kontakt` | 9701 px |
| kontakt | `/kontakt` | 9964 px |
| Wyślij zapytanie | `submit` | 10719 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 10567 px |
| +48571088338 | `tel:+48571088338` | 10615 px |

Najdłuższy odcinek bez powyższych CTA: y=2098–5954 px, około 4.3 ekranu. Obejmuje: "Sprawdź, czy to wdrożenie Pipedrive pasuje do Twojej firmy"; "Sprzedaż żyje w Excelu, skrzynkach mailowych i pamięci handlowców, a Ty nie wiesz, ile naprawdę wartościowych szans jest w lejku."; "Macie już Pipedrive, ale handlowcy go omijają, a raporty nie nadają się do decyzji."; "Po wygranej szansie zespół realizacyjny dopytuje klienta o rzeczy, które sprzedaż już ustaliła.". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 12956 px wobec 11523 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Umów rozmowę o wdrożeniu" → `/kontakt` przy y=795. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet średni: Po "Struktura danych i migracja", przed "Konfiguracja, automatyzacje i integracje".

- Typ: Przycisk inline.
- Tekst: "Omówmy migrację Twoich danych".
- Cel: `/kontakt`. To wejście na stronę kontaktu, nie bezpośrednie wysłanie formularza.
- Wdrożenie: Tylko Sanity: feature.cta.
- Powód: Zmniejsza niepewność dotyczącą migracji w długim opisie procesu.

### `/szkolenie-i-wdrozenie-salesforce`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Umów rozmowę o wdrożeniu | `/kontakt` | 547 px |
| Porozmawiajmy o waszym procesie | `/kontakt` | 1943 px |
| Umów diagnozę | `/kontakt` | 5882 px |
| Zacznijmy wdrożenie | `/kontakt` | 5882 px |
| Ustalmy zakres i cenę | `/kontakt` | 5882 px |
| Umów rozmowę o wdrożeniu | `/kontakt` | 7184 px |
| Zobacz Sales Atlas System | `/sales-atlas-system` | 8264 px |
| kontakt | `/kontakt` | 9172 px |
| kontakt | `/kontakt` | 9401 px |
| Wyślij zapytanie | `submit` | 10122 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 9971 px |
| +48571088338 | `tel:+48571088338` | 10019 px |

Najdłuższy odcinek bez powyższych CTA: y=1943–5882 px, około 4.4 ekranu. Obejmuje: "Sprawdź, czy wdrożenie Salesforce pasuje do Twojej firmy"; "Pipedrive, HubSpot albo Excel przestały wystarczać, bo potrzebujesz własnych obiektów, osobnego procesu dla serwisu albo kilku oddziałów z różnymi uprawnieniami."; "Macie już Salesforce, ale handlowcy go omijają, a raporty nie nadają się do decyzji."; "Po wygranej szansie obsługa klienta dopytuje o rzeczy, które sprzedaż już ustaliła.". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 12347 px wobec 10926 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Umów rozmowę o wdrożeniu" → `/kontakt` przy y=630. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet średni: Po "Struktura danych i migracja", przed "Konfiguracja, automatyzacje i integracje".

- Typ: Przycisk inline.
- Tekst: "Omówmy migrację do Salesforce".
- Cel: `/kontakt`. To wejście na stronę kontaktu, nie bezpośrednie wysłanie formularza.
- Wdrożenie: Tylko Sanity: feature.cta.
- Powód: Odpowiada na ryzyko migracji, zanim czytelnik dojdzie do konfiguracji.

### `/wdrozenie-ai-w-sprzedazy-b2b`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Umów rozmowę o wdrożeniu AI | `/kontakt` | 578 px |
| Zacznijmy wdrożenie | `/kontakt` | 6467 px |
| Ustalmy zakres i cenę | `/kontakt` | 6467 px |
| Umów bezpłatną konsultację | `/kontakt` | 7229 px |
| Zobacz Sales Atlas System | `/sales-atlas-system` | 7674 px |
| Wyślij zapytanie | `submit` | 9467 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 9315 px |
| +48571088338 | `tel:+48571088338` | 9363 px |

Najdłuższy odcinek bez powyższych CTA: y=578–6467 px, około 6.5 ekranu. Obejmuje: "Doświadczenie z wdrożeń CRM i automatyzacji w ponad 50 firmach"; "AI przyspiesza handlowca. Firma nadal czeka na wynik."; "Sprawdź czy moja usługa pasuje do Twojej firmy"; "Kupiliście ChatGPT albo Copilota. Ludzie mówią, że oszczędzają czas, ale wynik tego nie pokazuje.". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 11334 px wobec 10271 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Umów rozmowę o wdrożeniu AI" → `/kontakt` przy y=665. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet wysoki: Po "Sprawdź czy moja usługa pasuje do Twojej firmy", przed "Pięć kroków do pierwszych procesów sprzedaży obsługiwanych przez AI".

- Typ: CtaBand.
- Tekst: "Sprawdźmy pierwszy proces dla AI".
- Cel: `/kontakt`. To wejście na stronę kontaktu, nie bezpośrednie wysłanie formularza.
- Wdrożenie: Tylko Sanity: ctaBand między blokami.
- Powód: Po rozpoznaniu problemu można od razu przejść do rozmowy, bez kolejnych kroków i cennika.

### `/wspolpraca`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Umów wstępną rozmowę | `/kontakt` | 497 px |
| Zacznijmy współpracę | `/kontakt` | 3246 px |
| wypełnij formularz | `/kontakt` | 4246 px |
| kontakt | `/kontakt` | 4246 px |
| kontakt | `/kontakt` | 4345 px |
| Wyślij zapytanie | `submit` | 5105 px |

Najdłuższy odcinek bez powyższych CTA: y=497–3246 px, około 3.1 ekranu. Obejmuje: "Wsparcie w cyfrowej transformacji"; "Współpraca krok po kroku"; "Umów rozmowę rozpoznawczą"; "Wybierzemy formę współpracy". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 5111 px wobec 5909 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Umów wstępną rozmowę" → `/kontakt` przy y=580. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać. Kroki współpracy zawierają ścieżkę do rozmowy, a FAQ kończy się formularzem.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/lista-cookies-i-identyfikatorow`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Brak wezwań sprzedażowych | — | — |

Najdłuższy odcinek bez powyższych CTA: y=0–5348 px, około 5.9 ekranu. Obejmuje: "Lista cookies i identyfikatorów"; "Przed dokonaniem wyboru"; "Niezbędne — zawsze aktywne"; "Analityczne — po zgodzie na analitykę". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 3620 px wobec 5348 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "/* Sales Atlas System — badge z pulsującym promieniem. Pierścień z gradientu stożkowego przycięty maską do samej ramki plakietki, plus jego rozmyta kopia jako poświata. Rozmiar: --sas-szer / --sas-wys. */ .sas-beam{--sas-czas:11s;--sas-moc:1.15;--sas-rozmycie:2.6cqw;--sas-ramka:3.099%;--sas-szer:3.4135rem;--sas-wys:5rem;position:relative;display:block;width:var(--sas-szer);height:var(--sas-wys);border-radius:14.648% / 10%;container-type:inline-size;isolation:isolate} .sas-beam__plyta{position:absolute;inset:0;width:100%;height:100%;display:block} .sas-beam__ring{position:absolute;inset:0;display:block;overflow:hidden;border-radius:inherit;padding:var(--sas-ramka);pointer-events:none;mix-blend-mode:screen;-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude;animation:sas-iskra 6.7s ease-in-out infinite} .sas-beam__ring>i{position:absolute;left:50%;top:50%;width:170%;aspect-ratio:1;display:block;transform:translate(-50%,-50%) rotate(0deg);animation:sas-obieg var(--sas-czas) linear infinite,sas-oddech 4.4s ease-in-out infinite;background:conic-gradient(from 0deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0) 56%,rgba(182,241,255,.05) 60%,rgba(182,241,255,.22) 64.5%,rgba(235,237,250,.6) 68%,#fff 69.8%,rgba(235,237,250,.6) 71.5%,rgba(10,207,254,.3) 75%,rgba(10,207,254,.08) 80%,rgba(255,255,255,0) 85%)} .sas-beam__glow{position:absolute;inset:0;border-radius:inherit;pointer-events:none;mix-blend-mode:screen;opacity:.75;filter:blur(2px) saturate(1.25)} @supports (width:1cqw){.sas-beam__glow{filter:blur(var(--sas-rozmycie)) saturate(1.25)}} .sas-beam__glow .sas-beam__ring{mix-blend-mode:normal} @keyframes sas-obieg{to{transform:translate(-50%,-50%) rotate(360deg)}} @keyframes sas-oddech{0%,100%{opacity:calc(var(--sas-moc)*.32)}38%{opacity:calc(var(--sas-moc)*1)}62%{opacity:calc(var(--sas-moc)*.78)}} @keyframes sas-iskra{0%,62%,100%{filter:brightness(1)}74%{filter:brightness(1.45)}86%{filter:brightness(1.05)}} @media (prefers-reduced-motion:reduce){.sas-beam__ring{animation:none}.sas-beam__ring>i{animation:none;opacity:var(--sas-moc);transform:translate(-50%,-50%) rotate(288deg)}}" → `/sales-atlas-system` przy y=3008. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać promocyjnego CTA. Dokument prawny, potwierdzenie zapisu lub widok błędu powinien prowadzić do zakończenia swojej podstawowej czynności.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/404`

Akcja naprawcza: "Wróć na stronę główną" → `/`, y=135 px. Zachować ją jako jedyne główne wezwanie.

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Brak wezwań sprzedażowych | — | — |

Najdłuższy odcinek bez powyższych CTA: y=0–900 px, około 1.0 ekranu. Obejmuje: "Nie znaleziono strony".

Porównanie live: wysokość 900 px wobec 900 px na stagingu. Brak porównywalnych wezwań w treści. Nie przenosić automatycznie rozmieszczenia z live.

Rekomendacja, priorytet niski: Nie dodawać promocyjnego CTA. Dokument prawny, potwierdzenie zapisu lub widok błędu powinien prowadzić do zakończenia swojej podstawowej czynności.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/podziekowanie-konsultacja`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| przejdź do mojego kalendarza ↗︎ | `https://cal.com/zawlodzki/30min` | 375 px |

Najdłuższy odcinek bez powyższych CTA: y=375–1207 px, około 0.9 ekranu. Brak osobnych nagłówków w tym odcinku.

Porównanie live: wysokość 1547 px wobec 1207 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "przejdź do mojego kalendarza ↗︎" → `https://cal.com/zawlodzki/30min` przy y=648. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać promocyjnego CTA. Dokument prawny, potwierdzenie zapisu lub widok błędu powinien prowadzić do zakończenia swojej podstawowej czynności.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/podziekowanie-newsletter`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Brak wezwań sprzedażowych | — | — |

Najdłuższy odcinek bez powyższych CTA: y=0–1449 px, około 1.6 ekranu. Obejmuje: "Miło mi że jesteś na pokładzie!"; "Ostatnia kwestia.".

Porównanie live: wysokość 1727 px wobec 1449 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "/* Sales Atlas System — badge z pulsującym promieniem. Pierścień z gradientu stożkowego przycięty maską do samej ramki plakietki, plus jego rozmyta kopia jako poświata. Rozmiar: --sas-szer / --sas-wys. */ .sas-beam{--sas-czas:11s;--sas-moc:1.15;--sas-rozmycie:2.6cqw;--sas-ramka:3.099%;--sas-szer:3.4135rem;--sas-wys:5rem;position:relative;display:block;width:var(--sas-szer);height:var(--sas-wys);border-radius:14.648% / 10%;container-type:inline-size;isolation:isolate} .sas-beam__plyta{position:absolute;inset:0;width:100%;height:100%;display:block} .sas-beam__ring{position:absolute;inset:0;display:block;overflow:hidden;border-radius:inherit;padding:var(--sas-ramka);pointer-events:none;mix-blend-mode:screen;-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude;animation:sas-iskra 6.7s ease-in-out infinite} .sas-beam__ring>i{position:absolute;left:50%;top:50%;width:170%;aspect-ratio:1;display:block;transform:translate(-50%,-50%) rotate(0deg);animation:sas-obieg var(--sas-czas) linear infinite,sas-oddech 4.4s ease-in-out infinite;background:conic-gradient(from 0deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0) 56%,rgba(182,241,255,.05) 60%,rgba(182,241,255,.22) 64.5%,rgba(235,237,250,.6) 68%,#fff 69.8%,rgba(235,237,250,.6) 71.5%,rgba(10,207,254,.3) 75%,rgba(10,207,254,.08) 80%,rgba(255,255,255,0) 85%)} .sas-beam__glow{position:absolute;inset:0;border-radius:inherit;pointer-events:none;mix-blend-mode:screen;opacity:.75;filter:blur(2px) saturate(1.25)} @supports (width:1cqw){.sas-beam__glow{filter:blur(var(--sas-rozmycie)) saturate(1.25)}} .sas-beam__glow .sas-beam__ring{mix-blend-mode:normal} @keyframes sas-obieg{to{transform:translate(-50%,-50%) rotate(360deg)}} @keyframes sas-oddech{0%,100%{opacity:calc(var(--sas-moc)*.32)}38%{opacity:calc(var(--sas-moc)*1)}62%{opacity:calc(var(--sas-moc)*.78)}} @keyframes sas-iskra{0%,62%,100%{filter:brightness(1)}74%{filter:brightness(1.45)}86%{filter:brightness(1.05)}} @media (prefers-reduced-motion:reduce){.sas-beam__ring{animation:none}.sas-beam__ring>i{animation:none;opacity:var(--sas-moc);transform:translate(-50%,-50%) rotate(288deg)}}" → `/sales-atlas-system` przy y=1115. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać promocyjnego CTA. Dokument prawny, potwierdzenie zapisu lub widok błędu powinien prowadzić do zakończenia swojej podstawowej czynności.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/blog/strona/2`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Następne wpisy | `/blog/strona/3` | 2291 px |
| Zapisuję się | `submit` | 2613 px |

Najdłuższy odcinek bez powyższych CTA: y=0–2291 px, około 2.5 ekranu. Obejmuje: "Blog"; "Co zrobić, żeby zespół aktualizował Asanę i nie traktował jej jak kolejnego obowiązku"; "Jak połączyć Asanę z Outlookiem, Teams i Microsoft 365 bez dublowania pracy"; "Zarządzanie wieloma projektami w Asanie: co musi widzieć lider". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 900 px wobec 3462 px na stagingu. Brak porównywalnych wezwań w treści. Nie przenosić automatycznie rozmieszczenia z live.

Rekomendacja, priorytet niski: Nie dodawać CTA między kartami. Lista służy wyborowi artykułu, a newsletter jest pod paginacją. Zachować ten sam układ na kolejnych stronach.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/blog/strona/3`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Następne wpisy | `/blog/strona/4` | 2291 px |
| Zapisuję się | `submit` | 2613 px |

Najdłuższy odcinek bez powyższych CTA: y=0–2291 px, około 2.5 ekranu. Obejmuje: "Blog"; "Szkolenie CRM dla zespołu handlowego: jak je poprowadzić na własnych szansach"; "Dane w CRM, na których automatyzacje i AI dadzą radę pracować"; "CRM dla biura rachunkowego: jak poukładać w nim pozyskiwanie klientów". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 900 px wobec 3462 px na stagingu. Brak porównywalnych wezwań w treści. Nie przenosić automatycznie rozmieszczenia z live.

Rekomendacja, priorytet niski: Nie dodawać CTA między kartami. Lista służy wyborowi artykułu, a newsletter jest pod paginacją. Zachować ten sam układ na kolejnych stronach.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/blog/strona/4`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Następne wpisy | `/blog/strona/5` | 2193 px |
| Zapisuję się | `submit` | 2515 px |

Najdłuższy odcinek bez powyższych CTA: y=0–2193 px, około 2.4 ekranu. Obejmuje: "Blog"; "System CRM dla firmy: co ustalić, zanim wybierzesz narzędzie"; "Kryteria wejścia i wyjścia na etapach lejka sprzedaży: jak je ustalić"; "AI nie zna Twojej firmy. Ten kontekst trzeba mu zbudować". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 900 px wobec 3364 px na stagingu. Brak porównywalnych wezwań w treści. Nie przenosić automatycznie rozmieszczenia z live.

Rekomendacja, priorytet niski: Nie dodawać CTA między kartami. Lista służy wyborowi artykułu, a newsletter jest pod paginacją. Zachować ten sam układ na kolejnych stronach.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/blog/strona/5`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Następne wpisy | `/blog/strona/6` | 2193 px |
| Zapisuję się | `submit` | 2515 px |

Najdłuższy odcinek bez powyższych CTA: y=0–2193 px, około 2.4 ekranu. Obejmuje: "Blog"; "Jak działa AI w Asanie i co da się z nim zrobić w pracy zespołu"; "Systemy CRM - który wybrać do sprzedaży, marketingu i pracy w terenie"; "Jak ułożyć proces sprzedaży w firmie B2B i po czym poznać, że nie działa". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 900 px wobec 3364 px na stagingu. Brak porównywalnych wezwań w treści. Nie przenosić automatycznie rozmieszczenia z live.

Rekomendacja, priorytet niski: Nie dodawać CTA między kartami. Lista służy wyborowi artykułu, a newsletter jest pod paginacją. Zachować ten sam układ na kolejnych stronach.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/blog/strona/6`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Następne wpisy | `/blog/strona/7` | 2259 px |
| Zapisuję się | `submit` | 2581 px |

Najdłuższy odcinek bez powyższych CTA: y=0–2259 px, około 2.5 ekranu. Obejmuje: "Blog"; "Który CRM nadaje się pod agenta AI? Porównanie API ośmiu systemów"; "Wdrożenie agenta AI w firmie zacznij od spisania procesu, nie od narzędzia"; "Bezpieczne przekazywanie poufnych danych i haseł". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 900 px wobec 3429 px na stagingu. Brak porównywalnych wezwań w treści. Nie przenosić automatycznie rozmieszczenia z live.

Rekomendacja, priorytet niski: Nie dodawać CTA między kartami. Lista służy wyborowi artykułu, a newsletter jest pod paginacją. Zachować ten sam układ na kolejnych stronach.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/blog/strona/7`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Zapisuję się | `submit` | 2071 px |

Najdłuższy odcinek bez powyższych CTA: y=0–2071 px, około 2.3 ekranu. Obejmuje: "Blog"; "5 kroków do obsługi każdego leada w 5 minut"; "Prosty system do elektronicznych wniosków urlopowych, który stworzysz w 45 minut"; "Pisz bloga 2x szybciej robiąc automatyczny research z ChatGPT". Dalsze nagłówki w facts.json.

Porównanie live: wysokość 900 px wobec 2920 px na stagingu. Brak porównywalnych wezwań w treści. Nie przenosić automatycznie rozmieszczenia z live.

Rekomendacja, priorytet niski: Nie dodawać CTA między kartami. Lista służy wyborowi artykułu, a newsletter jest pod paginacją. Zachować ten sam układ na kolejnych stronach.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.
