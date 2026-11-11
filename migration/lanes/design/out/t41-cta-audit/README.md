# Audyt rozmieszczenia CTA

Celem jest ułatwienie kontaktu w chwili, gdy czytelnik rozpozna swój problem. Największe luki są w kursie AI, ofercie wdrożenia AI i audycie AI. Nie dodawać CTA na każdej stronie. Oferta no-code ma ich już dużo.

## Zakres i metoda

Pomiar 11 listopada 2026, viewport 1280 × 900, opublikowana treść stagingu `https://zawlodzki-web.zawlodzki.workers.dev` i porównanie tych samych ścieżek z `https://zawlodzki.pl`. [facts.json](facts.json) zawiera etykiety, cele, nagłówki i współrzędne obu wersji. To publiczny render, bez inventory i bez zapisu do Sanity. Przeanalizowano wszystkie strony poza artykułami, siedem widoków listy bloga i próbę czterech wpisów: AI, cennik Asany, audyt CRM i instrukcję obsługi leadów. Pozostałe wpisy są wymienione w `discovered`, ale nie były oceniane indywidualnie. Próba obejmuje różne intencje, długości i daty publikacji. `/blog/pipedrive-cennik` nie występuje w sitemapie, więc nie jest częścią próby.

CTA oznacza tu wezwanie do kontaktu, zakupu, zapisu lub przejścia do oferty. Linki spisu treści i powiązanych wpisów są nawigacją. Tabele stagingu dotyczą treści głównej. Live nie zawsze ma semantyczny `main`, wtedy kolektor odczytuje `body`, łącznie z nagłówkiem i stopką; porównanie live jest jakościowe, bez porównywania liczby CTA. Globalny przycisk "Bezpłatna konsultacja" w nagłówku jest stale dostępny i nie zastępuje CTA w treści. Zwykłe linki prawne nie są CTA.

Współrzędna `y` jest odległością od góry dokumentu, nie procentem przeczytanej treści. Ekrany to przybliżenie `różnica y / 900`, nie pomiar zaangażowania. Najdłuższa przerwa liczy się między wezwanami do konwersji, w tym formularzami i odsyłaczami do ofert. Lista nagłówków w luce pomaga znaleźć jej kontekst. Nie każda luka wymaga przycisku, zwłaszcza w artykułach i dokumentach prawnych. Ukryte odpowiedzi FAQ i nieaktywne zakładki nie są osobnymi ekranami.

Rekomendacje zachowują PRODUCT.md i DESIGN.md: jedna podstawowa ścieżka do konsultacji, newsletter dla niezdecydowanych, pierwsza osoba, brak wymyślonych wyników. Docelowo około dwóch ekranów między promocyjnymi CTA. Przed wdrożeniem ponownie zmierzyć odstępy na 390 i 1440 px. Nie dodawać równocześnie wszystkich propozycji, jeśli po zmianie treści wypadają blisko cennika lub obecnego przycisku. W blogu rekomenduję jeden zwykły link w treści, bez nowego PromoCard.

Ranking łączy rozmieszczenie i copy. Pierwsze pięć pozycji ma adnotowane zrzuty, kolejne obejmują najgorsze istniejące teksty. Ranking to ocena intencji i długości przerwy, bez danych analitycznych lub obietnicy wzrostu konwersji. Nie testowano wysyłki formularzy, zakupu ani zapisu. Obecne etykiety "30 minut" i kalendarz `/30min` odbiegają od 25 minut w PRODUCT.md. Nie powielać długości rozmowy w nowych CTA przed ujednoliceniem treści. Nie traktować dat przedsprzedaży ani cen jako zatwierdzonej oferty.

## Dziesięć rekomendacji według spodziewanego wpływu

| Miejsce | Strona | Priorytet | Propozycja i powód |
| --- | --- | --- | --- |
| 1 | `/kurs-ai-w-sprzedazy` | wysoki | Zapytaj, czy kurs pasuje do Twojego procesu; drugi: Zapytaj o pracę na Twoim CRM. Czytelnik może zweryfikować dopasowanie, zanim przeczyta cały program. Nie kopiować linku zakupu bez potwierdzenia aktualności przedsprzedaży. |
| 2 | `/wdrozenie-ai-w-sprzedazy-b2b` | wysoki | Porozmawiajmy o pierwszym procesie dla AI. Po rozpoznaniu problemu można od razu przejść do rozmowy, bez kolejnych kroków i cennika. |
| 3 | `/audyt-ai-sprzedaz` | wysoki | Porozmawiajmy o audycie AI w Waszej firmie. Hero i cennik dzieli niemal sześć ekranów, a kwalifikacja jest naturalnym miejscem decyzji. |
| 4 | `/sales-atlas-system` | wysoki | Umów konsultację o swoim systemie sprzedaży. Wynik samooceny powinien prowadzić do rozmowy, bez szukania kontaktu w FAQ. |
| 5 | `/blog/ai-w-sprzedazy` | średni | Chcesz sprawdzić taki proces w swojej firmie? Porozmawiajmy. Czytelnik właśnie poznał konkretny obieg. Jeden spokojny link wystarczy; bez baneru w środku artykułu. |
| 6 | Cenniki wdrożeń, kurs i program AI | wysoki | Zmienić "Zacznijmy wdrożenie". Dla kontaktu: "Umów rozmowę o wdrożeniu", dla AI: "Umów rozmowę o wdrożeniu AI". Dla linku do oferty: "Zobacz ofertę wdrożenia AI". Kliknięcie nie rozpoczyna projektu. |
| 7 | Audyty AI, Pipedrive, Asany, sprzedaży i diagnoza Salesforce | wysoki | "Umów audyt…" i "Umów diagnozę" zastąpić przez "Umów rozmowę o audycie…" i "Umów rozmowę o diagnozie CRM". Kontakt nie rezerwuje płatnej diagnozy. |
| 8 | `/program-ai-dla-zespolu-sprzedazy` | wysoki | "Zapisz się na pierwszą grupę" zastąpić przez "Zapytaj o udział w programie". Formularz nie wykonuje zapisu, a termin grupy wymaga potwierdzenia. |
| 9 | `/wspolpraca` i przyciski zakresu/ceny | średni | "Zacznijmy współpracę" zmienić na "Porozmawiajmy o współpracy"; "Ustalmy zakres i cenę" na "Porozmawiajmy o zakresie i cenie". Rozmowa poprzedza uzgodnienie oferty. |
| 10 | `/blog/audyt-wdrozonego-crm` | średni | Po "Co zrobić z wynikiem" dodać "Chcesz omówić wynik swojej checklisty? Napisz do mnie." do kontaktu. Konkretny krok po samodzielnej diagnozie. |

## Pełnostronicowe zrzuty pięciu pierwszych stron

Czerwone linie i numery oznaczają miejsca wstawienia, nie wdrożone przyciski. Numer 1 na każdej stronie odpowiada jej rekomendacji poniżej. Kurs ma dodatkowy opcjonalny punkt 2. Surowe PNG i DOM są w `screens/`, pliki `marks.json` zapisują kotwicę i pozycję. Zrzuty pochodzą z lokalnego Workera przy HEAD `3102f47`, zbudowanego z opublikowanego datasetu production, a nie z hosta staging. Analiza stagingu i live jest oddzielnie w `facts.json`. Zgodność kotwic potwierdzono przy przechwyceniu; pikselowej identyczności deploymentów nie zakładam.

Uruchomiono `web.sh up --port 8790 --no-build` po wcześniejszym pełnym buildzie, `doctor`, `probe` i `shot`, a na końcu `down`. Wszystkie pięć URL zwróciło 200 i `X-Robots-Tag: noindex, nofollow`. [probes.tsv](screens/probes.tsv) zapisuje wyniki. Standardowy helper ma stałą wysokość 900 px. Adapter [shot-chrome.mjs](shot-chrome.mjs) podany przez `CHROME_BIN` zachowuje viewport 1280 × 900, przewija lazy content i przechwytuje cały dokument przez CDP. Nie zmienia helpera ani aplikacji. Wspólna przeglądarka T3 nie otworzyła się z powodu blokady AppArmor. Odczyt wykonano Chrome przez CDP.

- `/kurs-ai-w-sprzedazy`: [z adnotacjami](screens/_kurs-ai-w-sprzedazy-w1280-annotated.png), [oryginał](screens/_kurs-ai-w-sprzedazy-w1280.png), [DOM](screens/_kurs-ai-w-sprzedazy-w1280.dom.html).
- `/wdrozenie-ai-w-sprzedazy-b2b`: [z adnotacjami](screens/_wdrozenie-ai-w-sprzedazy-b2b-w1280-annotated.png), [oryginał](screens/_wdrozenie-ai-w-sprzedazy-b2b-w1280.png), [DOM](screens/_wdrozenie-ai-w-sprzedazy-b2b-w1280.dom.html).
- `/audyt-ai-sprzedaz`: [z adnotacjami](screens/_audyt-ai-sprzedaz-w1280-annotated.png), [oryginał](screens/_audyt-ai-sprzedaz-w1280.png), [DOM](screens/_audyt-ai-sprzedaz-w1280.dom.html).
- `/sales-atlas-system`: [z adnotacjami](screens/_sales-atlas-system-w1280-annotated.png), [oryginał](screens/_sales-atlas-system-w1280.png), [DOM](screens/_sales-atlas-system-w1280.dom.html).
- `/blog/ai-w-sprzedazy`: [z adnotacjami](screens/_blog_ai-w-sprzedazy-w1280-annotated.png), [oryginał](screens/_blog_ai-w-sprzedazy-w1280.png), [DOM](screens/_blog_ai-w-sprzedazy-w1280.dom.html).

Zastrzeżenie dla Sales Atlas: zrzut pokazuje dużą pustą przestrzeń pod zakładkami. Wysokość tej sekcji zwiększa podany odstęp. Proponowany CTA jest po samoocenie, nie w pustej przestrzeni. Ewentualna korekta układu to osobne zadanie, przed ponownym pomiarem rytmu CTA.

Odtworzenie tabel copy: `python3 migration/lanes/design/out/t41-cta-audit/audit-copy.py`.

Odtworzenie danych: `CHROME_BIN=/opt/agent-vm/chromium/chrome node migration/lanes/design/out/t41-cta-audit/collect.mjs`. Przy kolejnym uruchomieniu dane mogą się zmienić wraz z publikacją treści. Dla zrzutów po `web.sh up` i `doctor` ustawić `CHROME_BIN` na absolutną ścieżkę `shot-chrome.mjs`, uruchomić `web.sh shot <ścieżka> --port 8790` i zakończyć przez `web.sh down --port 8790`. Adapter jest narzędziem audytu, nie zmianą aplikacji.

## Wykonalność

`ctaBand` pozwala ustawić nagłówek, treść i link. `feature.cta` daje przycisk przy danym kroku. Oba wymagają tylko treści Sanity. Link w Portable Text także nie wymaga kodu. `PromoCard` generuje etykietę "Zobacz {tytuł strony}" i wskazuje referencję strony, więc nie nadaje się do dowolnej etykiety konsultacji. Przycisk wewnątrz elementu `tabs` wymaga nowego pola i renderowania. Kurs ma program w zakładkach, więc drugi proponowany punkt należy traktować jako osobną zmianę kodu. W tym zadaniu niczego z tych zmian nie wykonano.

## Teksty istniejących CTA

CTA nazywa rzeczywisty następny krok i wymaga tylko takiego zobowiązania, jakie wynika z celu linku. "Bezpłatna konsultacja" oraz "Umów rozmowę o wdrożeniu AI" są poprawne. Kontakt poprzedza decyzję o zakupie. Przycisk prowadzący do oferty nazywa obejrzenie oferty. Przycisk checkoutu powinien jawnie nazywać zakup, a przycisk zapisu jawnie nazywać zapis.

Poniżej oceniono każde wystąpienie CTA w treści wszystkich 38 zbadanych ścieżek stagingu, w tym przyciski cenników, odsyłacze kontaktowe, paginację i akcję powrotu z 404. Powtórzenia w obrębie jednej strony rozróżnia y. Tabela dotyczy istniejącego renderu, nie propozycji wdrożonych w aplikacji. Dla `ok` zamiennik powtarza tekst do zachowania. Nawigacja do artykułów, linki prawne, przełączniki zakładek i ustawienia zgód pozostają poza marketingowym audytem copy. Pełny korpus artykułów pozostaje poza zakresem, zgodnie z próbą T41.

Stały przycisk nagłówka "Bezpłatna konsultacja" → `/kontakt`: **ok**. Zamiennik: "Bezpłatna konsultacja". Nazywa znaną, niezobowiązującą formę pierwszego kontaktu. Na live zachować tę samą zasadę; etykiety ze starego Webflow nie są automatycznie wzorcem dla stagingu. Porównawcze dane live są w facts.json.

| Strona i pozycja y | Obecny tekst | Cel | Werdykt | Proponowany tekst | Powód |
| --- | --- | --- | --- | --- | --- |
| `/` y=530 | Umów bezpłatną konsultację | `/kontakt` | ok | Umów bezpłatną konsultację | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/` y=3488 | Dowiedz się więcej o pipedrive.com | `/szkolenie-i-wdrozenie-pipedrive` | change | Zobacz ofertę wdrożenia Pipedrive | Link otwiera ofertę konsultanta, nie stronę producenta. |
| `/` y=3987 | Dowiedz się więcej o AI dla sprzedaży | `/wdrozenie-ai-w-sprzedazy-b2b` | ok | Dowiedz się więcej o AI dla sprzedaży | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/` y=4370 | Dowiedz się więcej o automatyzacji | `/automatyzacje-dla-pipedrive` | ok | Dowiedz się więcej o automatyzacji | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/` y=4835 | Dowiedz się więcej o asana.com | `/szkolenie-i-wdrozenie-asana` | change | Zobacz ofertę wdrożenia Asany | Link otwiera usługę, nie domenę Asany. |
| `/` y=5089 | Porozmawiajmy o współpracy | `/kontakt` | ok | Porozmawiajmy o współpracy | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/` y=5692 | Dowiedz się o mnie więcej | `/o-mnie` | ok | Dowiedz się o mnie więcej | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/` y=7367 | Wyślij zapytanie | `submit` | ok | Wyślij zapytanie | Formularz wysyła zapytanie, bez zamawiania usługi. |
| `/` y=7215 | grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | ok | grzesiek@zawlodzki.pl | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/` y=7263 | +48571088338 | `tel:+48571088338` | ok | +48571088338 | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/` y=7746 | Zapisuję się | `submit` | ok | Zapisuję się | Przycisk wysyła formularz zapisu. Sąsiedni nagłówek wyjaśnia, że chodzi o newsletter. |
| `/audyt-ai-sprzedaz` y=547 | Umów rozmowę o audycie | `/kontakt` | ok | Umów rozmowę o audycie | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/audyt-ai-sprzedaz` y=5816 | Umów audyt AI | `/kontakt` | change | Umów rozmowę o audycie AI | Kontakt rozpoczyna rozmowę, nie rezerwację płatnego audytu. |
| `/audyt-ai-sprzedaz` y=6358 | Umów audyt AI | `/kontakt` | change | Umów rozmowę o audycie AI | Kontakt rozpoczyna rozmowę, nie rezerwację płatnego audytu. |
| `/audyt-ai-sprzedaz` y=6828 | Zobacz Sales Atlas System | `/sales-atlas-system` | ok | Zobacz Sales Atlas System | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/audyt-ai-sprzedaz` y=8620 | Wyślij zapytanie | `submit` | ok | Wyślij zapytanie | Formularz wysyła zapytanie, bez zamawiania usługi. |
| `/audyt-ai-sprzedaz` y=8469 | grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | ok | grzesiek@zawlodzki.pl | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/audyt-ai-sprzedaz` y=8517 | +48571088338 | `tel:+48571088338` | ok | +48571088338 | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/audyt-crm-pipedrive` y=530 | Umów audyt Pipedrive | `/kontakt` | change | Umów rozmowę o audycie Pipedrive | Najpierw trzeba omówić potrzeby i zakres audytu. |
| `/audyt-crm-pipedrive` y=1943 | Sprawdźmy, co jest zepsute | `/kontakt` | change | Porozmawiajmy o problemach z Pipedrive | Formularz otwiera rozmowę, nie wykonuje diagnozy. |
| `/audyt-crm-pipedrive` y=6050 | Umów audyt Pipedrive | `/kontakt` | change | Umów rozmowę o audycie Pipedrive | Najpierw trzeba omówić potrzeby i zakres audytu. |
| `/audyt-crm-pipedrive` y=6050 | Zobacz wdrożenie Pipedrive | `/szkolenie-i-wdrozenie-pipedrive` | ok | Zobacz wdrożenie Pipedrive | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/audyt-crm-pipedrive` y=6050 | Ustalmy zakres i cenę | `/kontakt` | change | Porozmawiajmy o zakresie i cenie | Rozmowa nie zobowiązuje do uzgodnienia oferty. |
| `/audyt-crm-pipedrive` y=7352 | Umów audyt Pipedrive | `/kontakt` | change | Umów rozmowę o audycie Pipedrive | Najpierw trzeba omówić potrzeby i zakres audytu. |
| `/audyt-crm-pipedrive` y=8956 | Zobacz Sales Atlas System | `/sales-atlas-system` | ok | Zobacz Sales Atlas System | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/audyt-crm-pipedrive` y=9763 | kontakt | `/kontakt` | ok | kontakt | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/audyt-crm-pipedrive` y=10026 | kontakt | `/kontakt` | ok | kontakt | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/audyt-crm-pipedrive` y=10814 | Wyślij zapytanie | `submit` | ok | Wyślij zapytanie | Formularz wysyła zapytanie, bez zamawiania usługi. |
| `/audyt-crm-pipedrive` y=10663 | grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | ok | grzesiek@zawlodzki.pl | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/audyt-crm-pipedrive` y=10711 | +48571088338 | `tel:+48571088338` | ok | +48571088338 | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/audyt-procesow-asana` y=530 | Umów audyt Asany | `/kontakt` | change | Umów rozmowę o audycie Asany | Kliknięcie otwiera kontakt, nie zamówienie audytu. |
| `/audyt-procesow-asana` y=1861 | Sprawdźmy, gdzie utykają projekty | `/kontakt` | change | Porozmawiajmy o Waszych projektach | Nie obiecywać rozpoczęcia analizy po kliknięciu. |
| `/audyt-procesow-asana` y=5931 | Umów audyt Asany | `/kontakt` | change | Umów rozmowę o audycie Asany | Kliknięcie otwiera kontakt, nie zamówienie audytu. |
| `/audyt-procesow-asana` y=5931 | Zobacz wdrożenie Asany | `/szkolenie-i-wdrozenie-asana` | ok | Zobacz wdrożenie Asany | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/audyt-procesow-asana` y=5931 | Ustalmy zakres i cenę | `/kontakt` | change | Porozmawiajmy o zakresie i cenie | Rozmowa nie zobowiązuje do uzgodnienia oferty. |
| `/audyt-procesow-asana` y=7158 | Umów audyt Asany | `/kontakt` | change | Umów rozmowę o audycie Asany | Kliknięcie otwiera kontakt, nie zamówienie audytu. |
| `/audyt-procesow-asana` y=10281 | Wyślij zapytanie | `submit` | ok | Wyślij zapytanie | Formularz wysyła zapytanie, bez zamawiania usługi. |
| `/audyt-procesow-asana` y=10130 | grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | ok | grzesiek@zawlodzki.pl | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/audyt-procesow-asana` y=10178 | +48571088338 | `tel:+48571088338` | ok | +48571088338 | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/audyt-sprzedazy` y=547 | Umów audyt sprzedaży | `/kontakt` | change | Umów rozmowę o audycie sprzedaży | Nie sugerować podjęcia decyzji o zakupie audytu. |
| `/audyt-sprzedazy` y=1895 | Sprawdźmy, gdzie jest blokada | `/kontakt` | change | Porozmawiajmy o problemach w sprzedaży | To zaproszenie do rozmowy przed audytem. |
| `/audyt-sprzedazy` y=6015 | Zobacz audyt CRM | `/audyt-crm-pipedrive` | ok | Zobacz audyt CRM | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/audyt-sprzedazy` y=6015 | Umów audyt sprzedaży | `/kontakt` | change | Umów rozmowę o audycie sprzedaży | Nie sugerować podjęcia decyzji o zakupie audytu. |
| `/audyt-sprzedazy` y=6015 | Porozmawiajmy o wdrożeniu | `/kontakt` | ok | Porozmawiajmy o wdrożeniu | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/audyt-sprzedazy` y=6725 | Umów audyt sprzedaży | `/kontakt` | change | Umów rozmowę o audycie sprzedaży | Nie sugerować podjęcia decyzji o zakupie audytu. |
| `/audyt-sprzedazy` y=7377 | Sales Atlas System | `/sales-atlas-system` | ok | Sales Atlas System | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/audyt-sprzedazy` y=7377 | Umów rozmowę | `/kontakt` | ok | Umów rozmowę | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/audyt-sprzedazy` y=8319 | Zobacz Sales Atlas System | `/sales-atlas-system` | ok | Zobacz Sales Atlas System | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/audyt-sprzedazy` y=10177 | Wyślij zapytanie | `submit` | ok | Wyślij zapytanie | Formularz wysyła zapytanie, bez zamawiania usługi. |
| `/audyt-sprzedazy` y=10026 | grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | ok | grzesiek@zawlodzki.pl | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/audyt-sprzedazy` y=10074 | +48571088338 | `tel:+48571088338` | ok | +48571088338 | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/automatyzacja-procesow-biznesowych-nocode` y=543 | Porozmawiajmy o automatyzacji | `/kontakt` | ok | Porozmawiajmy o automatyzacji | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/automatyzacja-procesow-biznesowych-nocode` y=1877 | Sprawdź, co da się uprościć | `/kontakt` | change | Porozmawiajmy o automatyzacji | Cel nie jest samoobsługowym testem, tylko stroną kontaktową. |
| `/automatyzacja-procesow-biznesowych-nocode` y=2883 | Wskaż swój powtarzalny proces | `/kontakt` | change | Opisz proces, o którym chcesz porozmawiać | Wyjaśnia, po co użytkownik ma opisać proces w formularzu. |
| `/automatyzacja-procesow-biznesowych-nocode` y=3586 | Zapytaj o swój przypadek | `/kontakt` | ok | Zapytaj o swój przypadek | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/automatyzacja-procesow-biznesowych-nocode` y=4220 | Zapytaj o abonament | `/kontakt` | ok | Zapytaj o abonament | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/automatyzacja-procesow-biznesowych-nocode` y=4729 | Zapytaj o pakiet Standard | `/kontakt` | ok | Zapytaj o pakiet Standard | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/automatyzacja-procesow-biznesowych-nocode` y=4729 | Zapytaj o pakiet PRO | `/kontakt` | ok | Zapytaj o pakiet PRO | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/automatyzacja-procesow-biznesowych-nocode` y=4729 | Sprawdź Newsletter | `/newsletter` | ok | Sprawdź Newsletter | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/automatyzacja-procesow-biznesowych-nocode` y=5498 | Program partnerski | `/program-partnerski` | ok | Program partnerski | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/automatyzacja-procesow-biznesowych-nocode` y=5784 | Opisz swój proces | `/kontakt` | ok | Opisz swój proces | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/automatyzacja-procesow-biznesowych-nocode` y=6755 | Zobacz Sales Atlas System | `/sales-atlas-system` | ok | Zobacz Sales Atlas System | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/automatyzacja-procesow-biznesowych-nocode` y=8416 | Wyślij zapytanie | `submit` | ok | Wyślij zapytanie | Formularz wysyła zapytanie, bez zamawiania usługi. |
| `/automatyzacja-procesow-biznesowych-nocode` y=8264 | grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | ok | grzesiek@zawlodzki.pl | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/automatyzacja-procesow-biznesowych-nocode` y=8312 | +48571088338 | `tel:+48571088338` | ok | +48571088338 | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/automatyzacje-dla-pipedrive` y=603 | Porozmawiajmy o automatyzacjach | `/kontakt` | ok | Porozmawiajmy o automatyzacjach | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/automatyzacje-dla-pipedrive` y=1948 | Policzmy, ile czasu to zjada | `/kontakt` | change | Porozmawiajmy o ręcznej pracy w CRM | Nie sugeruje kalkulatora ani wyceny dostępnej po kliknięciu. |
| `/automatyzacje-dla-pipedrive` y=5331 | Opisz swój proces | `/kontakt` | ok | Opisz swój proces | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/automatyzacje-dla-pipedrive` y=5801 | Zobacz Sales Atlas System | `/sales-atlas-system` | ok | Zobacz Sales Atlas System | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/automatyzacje-dla-pipedrive` y=7528 | Wyślij zapytanie | `submit` | ok | Wyślij zapytanie | Formularz wysyła zapytanie, bez zamawiania usługi. |
| `/automatyzacje-dla-pipedrive` y=7376 | grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | ok | grzesiek@zawlodzki.pl | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/automatyzacje-dla-pipedrive` y=7424 | +48571088338 | `tel:+48571088338` | ok | +48571088338 | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/blog` y=2713 | Następne wpisy | `/blog/strona/2` | ok | Następne wpisy | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/blog` y=3035 | Zapisuję się | `submit` | ok | Zapisuję się | Przycisk wysyła formularz zapisu. Sąsiedni nagłówek wyjaśnia, że chodzi o newsletter. |
| `/blog/5-krokow-do-obslugi-kazdego-leada-w-5-minut` y=6075 | Porozmawiajmy | `/kontakt` | ok | Porozmawiajmy | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/blog/5-krokow-do-obslugi-kazdego-leada-w-5-minut` y=6405 | Umów konsultację | `/kontakt` | ok | Umów konsultację | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/blog/5-krokow-do-obslugi-kazdego-leada-w-5-minut` y=7464 | Zapisuję się | `submit` | ok | Zapisuję się | Przycisk wysyła formularz zapisu. Sąsiedni nagłówek wyjaśnia, że chodzi o newsletter. |
| `/blog/ai-w-sprzedazy` y=16300 | umówić 30 minut rozmowy | `/kontakt` | change | umówić bezpłatną konsultację | Usuwa rozbieżną długość rozmowy, zachowując składnię zdania. |
| `/blog/ai-w-sprzedazy` y=17425 | Porozmawiajmy | `/kontakt` | ok | Porozmawiajmy | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/blog/ai-w-sprzedazy` y=17779 | Umów konsultację | `/kontakt` | ok | Umów konsultację | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/blog/ai-w-sprzedazy` y=18862 | Zapisuję się | `submit` | ok | Zapisuję się | Przycisk wysyła formularz zapisu. Sąsiedni nagłówek wyjaśnia, że chodzi o newsletter. |
| `/blog/asana-cennik` y=13610 | umów 30 minut rozmowy | `/kontakt` | change | umów bezpłatną konsultację | Nie utrwala nieuzgodnionego czasu rozmowy. |
| `/blog/asana-cennik` y=14711 | Porozmawiajmy | `/kontakt` | ok | Porozmawiajmy | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/blog/asana-cennik` y=15041 | Umów konsultację | `/kontakt` | ok | Umów konsultację | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/blog/asana-cennik` y=16100 | Zapisuję się | `submit` | ok | Zapisuję się | Przycisk wysyła formularz zapisu. Sąsiedni nagłówek wyjaśnia, że chodzi o newsletter. |
| `/blog/audyt-wdrozonego-crm` y=14428 | Porozmawiajmy | `/kontakt` | ok | Porozmawiajmy | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/blog/audyt-wdrozonego-crm` y=14758 | Umów konsultację | `/kontakt` | ok | Umów konsultację | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/blog/audyt-wdrozonego-crm` y=15817 | Zapisuję się | `submit` | ok | Zapisuję się | Przycisk wysyła formularz zapisu. Sąsiedni nagłówek wyjaśnia, że chodzi o newsletter. |
| `/darmowe-materialy-dla-biznesow-uslugowych` y=1159 | Zapisuję się | `submit` | ok | Zapisuję się | Przycisk wysyła formularz zapisu. Sąsiedni nagłówek wyjaśnia, że chodzi o newsletter. |
| `/kontakt` y=784 | Wyślij zapytanie | `submit` | ok | Wyślij zapytanie | Formularz wysyła zapytanie, bez zamawiania usługi. |
| `/kontakt` y=513 | przejdź do mojego kalendarza ↗︎ | `https://cal.com/zawlodzki/30min` | ok | przejdź do mojego kalendarza ↗︎ | Otwiera kalendarz, w którym dopiero wybiera się termin. |
| `/kontakt` y=1280 | grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | ok | grzesiek@zawlodzki.pl | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/kontakt` y=1328 | +48 571 088 338 | `tel:+48571088338` | ok | +48 571 088 338 | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/kontakt` y=1738 | Zapisuję się | `submit` | ok | Zapisuję się | Przycisk wysyła formularz zapisu. Sąsiedni nagłówek wyjaśnia, że chodzi o newsletter. |
| `/kurs-ai-w-sprzedazy` y=664 | Kup w przedsprzedaży | `https://cart.easy.tools/checkout/53466467/kurs-ai-w-sprzedazy` | ok | Kup w przedsprzedaży | Rzeczywisty cel to checkout. Nie maskować zakupu jako rozmowy. Zachować tylko po potwierdzeniu aktywnej przedsprzedaży. |
| `/kurs-ai-w-sprzedazy` y=12171 | Kup w przedsprzedaży | `https://cart.easy.tools/checkout/53466467/kurs-ai-w-sprzedazy` | ok | Kup w przedsprzedaży | Rzeczywisty cel to checkout. Nie maskować zakupu jako rozmowy. Zachować tylko po potwierdzeniu aktywnej przedsprzedaży. |
| `/kurs-ai-w-sprzedazy` y=12171 | Zobacz program grupowy | `/program-ai-dla-zespolu-sprzedazy` | ok | Zobacz program grupowy | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/kurs-ai-w-sprzedazy` y=12171 | Zacznijmy wdrożenie | `/wdrozenie-ai-w-sprzedazy-b2b` | change | Zobacz ofertę wdrożenia AI | Kliknięcie pokazuje ofertę. Nie rozpoczyna wdrożenia ani rozmowy. |
| `/kurs-ai-w-sprzedazy` y=13103 | Zadaj pytanie o kurs | `/kontakt` | ok | Zadaj pytanie o kurs | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/kurs-ai-w-sprzedazy` y=13548 | Zobacz Sales Atlas System | `/sales-atlas-system` | ok | Zobacz Sales Atlas System | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/kurs-ai-w-sprzedazy` y=15472 | Wyślij zapytanie | `submit` | ok | Wyślij zapytanie | Formularz wysyła zapytanie, bez zamawiania usługi. |
| `/kurs-ai-w-sprzedazy` y=15321 | grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | ok | grzesiek@zawlodzki.pl | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/kurs-ai-w-sprzedazy` y=15369 | +48571088338 | `tel:+48571088338` | ok | +48571088338 | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/newsletter` y=281 | Zapisuję się | `submit` | ok | Zapisuję się | Przycisk wysyła formularz zapisu. Sąsiedni nagłówek wyjaśnia, że chodzi o newsletter. |
| `/o-mnie` y=2765 | Porozmawiajmy o wdrożeniu | `/kontakt` | ok | Porozmawiajmy o wdrożeniu | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/o-mnie` y=3215 | grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | ok | grzesiek@zawlodzki.pl | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/o-mnie` y=3263 | +48 571 088 338 | `tel:+48571088338` | ok | +48 571 088 338 | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/o-mnie` y=5254 | Zapisuję się | `submit` | ok | Zapisuję się | Przycisk wysyła formularz zapisu. Sąsiedni nagłówek wyjaśnia, że chodzi o newsletter. |
| `/program-ai-dla-zespolu-sprzedazy` y=664 | Zapisz się na pierwszą grupę | `/kontakt` | change | Zapytaj o udział w programie | Kontakt nie zapisuje do grupy. Nie powielać niepotwierdzonego terminu. |
| `/program-ai-dla-zespolu-sprzedazy` y=7389 | Zobacz kurs | `/kurs-ai-w-sprzedazy` | ok | Zobacz kurs | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/program-ai-dla-zespolu-sprzedazy` y=7389 | Zapisz się na pierwszą grupę | `/kontakt` | change | Zapytaj o udział w programie | Kontakt nie zapisuje do grupy. Nie powielać niepotwierdzonego terminu. |
| `/program-ai-dla-zespolu-sprzedazy` y=7389 | Zacznijmy wdrożenie | `/wdrozenie-ai-w-sprzedazy-b2b` | change | Zobacz ofertę wdrożenia AI | Kliknięcie pokazuje ofertę. Nie rozpoczyna wdrożenia ani rozmowy. |
| `/program-ai-dla-zespolu-sprzedazy` y=8354 | Zapisz się na pierwszą grupę | `/kontakt` | change | Zapytaj o udział w programie | Kontakt nie zapisuje do grupy. Nie powielać niepotwierdzonego terminu. |
| `/program-ai-dla-zespolu-sprzedazy` y=8800 | Zobacz Sales Atlas System | `/sales-atlas-system` | ok | Zobacz Sales Atlas System | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/program-ai-dla-zespolu-sprzedazy` y=10593 | Wyślij zapytanie | `submit` | ok | Wyślij zapytanie | Formularz wysyła zapytanie, bez zamawiania usługi. |
| `/program-ai-dla-zespolu-sprzedazy` y=10441 | grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | ok | grzesiek@zawlodzki.pl | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/program-ai-dla-zespolu-sprzedazy` y=10489 | +48571088338 | `tel:+48571088338` | ok | +48571088338 | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/program-partnerski` y=505 | Poleć klienta | `/kontakt` | change | Zapytaj o polecenie klienta | Strona kontaktu nie wykonuje formalnego polecenia. |
| `/program-partnerski` y=1626 | grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl?subject=Program%20partnerski%20zg%C5%82oszenie` | ok | grzesiek@zawlodzki.pl | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/program-partnerski` y=1843 | Poleć klienta | `/kontakt` | change | Zapytaj o polecenie klienta | Strona kontaktu nie wykonuje formalnego polecenia. |
| `/program-partnerski` y=2751 | Wyślij zapytanie | `submit` | ok | Wyślij zapytanie | Formularz wysyła zapytanie, bez zamawiania usługi. |
| `/program-partnerski` y=2600 | grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | ok | grzesiek@zawlodzki.pl | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/program-partnerski` y=2648 | +48571088338 | `tel:+48571088338` | ok | +48571088338 | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/sales-atlas-system` y=472 | Umów bezpłatną konsultację | `/kontakt` | ok | Umów bezpłatną konsultację | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/sales-atlas-system` y=1784 | Umów bezpłatną konsultację | `/kontakt` | ok | Umów bezpłatną konsultację | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/sales-atlas-system` y=7729 | kontakt | `/kontakt` | ok | kontakt | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/szkolenie-i-wdrozenie-asana` y=578 | Umów rozmowę o wdrożeniu | `/kontakt` | ok | Umów rozmowę o wdrożeniu | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/szkolenie-i-wdrozenie-asana` y=1923 | Porozmawiajmy o waszych projektach | `/kontakt` | ok | Porozmawiajmy o waszych projektach | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/szkolenie-i-wdrozenie-asana` y=5757 | Zobacz audyt Asany | `/audyt-procesow-asana` | ok | Zobacz audyt Asany | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/szkolenie-i-wdrozenie-asana` y=5757 | Zacznijmy wdrożenie | `/kontakt` | change | Umów rozmowę o wdrożeniu | Pierwszym krokiem jest kontakt, nie decyzja o realizacji projektu. |
| `/szkolenie-i-wdrozenie-asana` y=5757 | Ustalmy zakres i cenę | `/kontakt` | change | Porozmawiajmy o zakresie i cenie | Rozmowa nie zobowiązuje do uzgodnienia oferty. |
| `/szkolenie-i-wdrozenie-asana` y=6984 | Umów rozmowę o wdrożeniu | `/kontakt` | ok | Umów rozmowę o wdrożeniu | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/szkolenie-i-wdrozenie-asana` y=10139 | Wyślij zapytanie | `submit` | ok | Wyślij zapytanie | Formularz wysyła zapytanie, bez zamawiania usługi. |
| `/szkolenie-i-wdrozenie-asana` y=9988 | grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | ok | grzesiek@zawlodzki.pl | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/szkolenie-i-wdrozenie-asana` y=10036 | +48571088338 | `tel:+48571088338` | ok | +48571088338 | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/szkolenie-i-wdrozenie-pipedrive` y=671 | Umów rozmowę o wdrożeniu | `/kontakt` | ok | Umów rozmowę o wdrożeniu | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/szkolenie-i-wdrozenie-pipedrive` y=2098 | Porozmawiajmy o waszym procesie | `/kontakt` | ok | Porozmawiajmy o waszym procesie | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/szkolenie-i-wdrozenie-pipedrive` y=5954 | Zobacz audyt CRM | `/audyt-crm-pipedrive` | ok | Zobacz audyt CRM | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/szkolenie-i-wdrozenie-pipedrive` y=5954 | Zacznijmy wdrożenie | `/kontakt` | change | Umów rozmowę o wdrożeniu | Pierwszym krokiem jest kontakt, nie decyzja o realizacji projektu. |
| `/szkolenie-i-wdrozenie-pipedrive` y=5954 | Ustalmy zakres i cenę | `/kontakt` | change | Porozmawiajmy o zakresie i cenie | Rozmowa nie zobowiązuje do uzgodnienia oferty. |
| `/szkolenie-i-wdrozenie-pipedrive` y=7257 | Umów rozmowę o wdrożeniu | `/kontakt` | ok | Umów rozmowę o wdrożeniu | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/szkolenie-i-wdrozenie-pipedrive` y=8861 | Zobacz Sales Atlas System | `/sales-atlas-system` | ok | Zobacz Sales Atlas System | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/szkolenie-i-wdrozenie-pipedrive` y=9701 | kontakt | `/kontakt` | ok | kontakt | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/szkolenie-i-wdrozenie-pipedrive` y=9964 | kontakt | `/kontakt` | ok | kontakt | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/szkolenie-i-wdrozenie-pipedrive` y=10719 | Wyślij zapytanie | `submit` | ok | Wyślij zapytanie | Formularz wysyła zapytanie, bez zamawiania usługi. |
| `/szkolenie-i-wdrozenie-pipedrive` y=10567 | grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | ok | grzesiek@zawlodzki.pl | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/szkolenie-i-wdrozenie-pipedrive` y=10615 | +48571088338 | `tel:+48571088338` | ok | +48571088338 | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/szkolenie-i-wdrozenie-salesforce` y=547 | Umów rozmowę o wdrożeniu | `/kontakt` | ok | Umów rozmowę o wdrożeniu | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/szkolenie-i-wdrozenie-salesforce` y=1943 | Porozmawiajmy o waszym procesie | `/kontakt` | ok | Porozmawiajmy o waszym procesie | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/szkolenie-i-wdrozenie-salesforce` y=5882 | Umów diagnozę | `/kontakt` | change | Umów rozmowę o diagnozie CRM | Na tym etapie użytkownik pyta o diagnozę, a nie ją kupuje. |
| `/szkolenie-i-wdrozenie-salesforce` y=5882 | Zacznijmy wdrożenie | `/kontakt` | change | Umów rozmowę o wdrożeniu | Pierwszym krokiem jest kontakt, nie decyzja o realizacji projektu. |
| `/szkolenie-i-wdrozenie-salesforce` y=5882 | Ustalmy zakres i cenę | `/kontakt` | change | Porozmawiajmy o zakresie i cenie | Rozmowa nie zobowiązuje do uzgodnienia oferty. |
| `/szkolenie-i-wdrozenie-salesforce` y=7184 | Umów rozmowę o wdrożeniu | `/kontakt` | ok | Umów rozmowę o wdrożeniu | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/szkolenie-i-wdrozenie-salesforce` y=8264 | Zobacz Sales Atlas System | `/sales-atlas-system` | ok | Zobacz Sales Atlas System | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/szkolenie-i-wdrozenie-salesforce` y=9172 | kontakt | `/kontakt` | ok | kontakt | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/szkolenie-i-wdrozenie-salesforce` y=9401 | kontakt | `/kontakt` | ok | kontakt | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/szkolenie-i-wdrozenie-salesforce` y=10122 | Wyślij zapytanie | `submit` | ok | Wyślij zapytanie | Formularz wysyła zapytanie, bez zamawiania usługi. |
| `/szkolenie-i-wdrozenie-salesforce` y=9971 | grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | ok | grzesiek@zawlodzki.pl | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/szkolenie-i-wdrozenie-salesforce` y=10019 | +48571088338 | `tel:+48571088338` | ok | +48571088338 | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/wdrozenie-ai-w-sprzedazy-b2b` y=578 | Umów rozmowę o wdrożeniu AI | `/kontakt` | ok | Umów rozmowę o wdrożeniu AI | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/wdrozenie-ai-w-sprzedazy-b2b` y=6467 | Zobacz audyt AI | `/audyt-ai-sprzedaz` | ok | Zobacz audyt AI | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/wdrozenie-ai-w-sprzedazy-b2b` y=6467 | Zacznijmy wdrożenie | `/kontakt` | change | Umów rozmowę o wdrożeniu AI | Pierwszym krokiem jest kontakt, nie decyzja o realizacji projektu. |
| `/wdrozenie-ai-w-sprzedazy-b2b` y=6467 | Ustalmy zakres i cenę | `/kontakt` | change | Porozmawiajmy o zakresie i cenie | Rozmowa nie zobowiązuje do uzgodnienia oferty. |
| `/wdrozenie-ai-w-sprzedazy-b2b` y=7229 | Umów bezpłatną konsultację | `/kontakt` | ok | Umów bezpłatną konsultację | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/wdrozenie-ai-w-sprzedazy-b2b` y=7674 | Zobacz Sales Atlas System | `/sales-atlas-system` | ok | Zobacz Sales Atlas System | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/wdrozenie-ai-w-sprzedazy-b2b` y=9467 | Wyślij zapytanie | `submit` | ok | Wyślij zapytanie | Formularz wysyła zapytanie, bez zamawiania usługi. |
| `/wdrozenie-ai-w-sprzedazy-b2b` y=9315 | grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | ok | grzesiek@zawlodzki.pl | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/wdrozenie-ai-w-sprzedazy-b2b` y=9363 | +48571088338 | `tel:+48571088338` | ok | +48571088338 | Adres lub numer jasno wskazuje bezpośredni kanał kontaktu. |
| `/wspolpraca` y=497 | Umów wstępną rozmowę | `/kontakt` | ok | Umów wstępną rozmowę | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/wspolpraca` y=3246 | Zacznijmy współpracę | `/kontakt` | change | Porozmawiajmy o współpracy | Najpierw odbywa się rozmowa, przed decyzją o współpracy. |
| `/wspolpraca` y=4246 | wypełnij formularz | `/kontakt` | ok | wypełnij formularz | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/wspolpraca` y=4246 | kontakt | `/kontakt` | ok | kontakt | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/wspolpraca` y=4345 | kontakt | `/kontakt` | ok | kontakt | W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie. |
| `/wspolpraca` y=5105 | Wyślij zapytanie | `submit` | ok | Wyślij zapytanie | Formularz wysyła zapytanie, bez zamawiania usługi. |
| `/404` y=135 | Wróć na stronę główną | `/` | ok | Wróć na stronę główną | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/podziekowanie-konsultacja` y=375 | przejdź do mojego kalendarza ↗︎ | `https://cal.com/zawlodzki/30min` | ok | przejdź do mojego kalendarza ↗︎ | Otwiera kalendarz, w którym dopiero wybiera się termin. |
| `/blog/strona/2` y=2291 | Następne wpisy | `/blog/strona/3` | ok | Następne wpisy | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/blog/strona/2` y=2613 | Zapisuję się | `submit` | ok | Zapisuję się | Przycisk wysyła formularz zapisu. Sąsiedni nagłówek wyjaśnia, że chodzi o newsletter. |
| `/blog/strona/3` y=2291 | Następne wpisy | `/blog/strona/4` | ok | Następne wpisy | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/blog/strona/3` y=2613 | Zapisuję się | `submit` | ok | Zapisuję się | Przycisk wysyła formularz zapisu. Sąsiedni nagłówek wyjaśnia, że chodzi o newsletter. |
| `/blog/strona/4` y=2193 | Następne wpisy | `/blog/strona/5` | ok | Następne wpisy | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/blog/strona/4` y=2515 | Zapisuję się | `submit` | ok | Zapisuję się | Przycisk wysyła formularz zapisu. Sąsiedni nagłówek wyjaśnia, że chodzi o newsletter. |
| `/blog/strona/5` y=2193 | Następne wpisy | `/blog/strona/6` | ok | Następne wpisy | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/blog/strona/5` y=2515 | Zapisuję się | `submit` | ok | Zapisuję się | Przycisk wysyła formularz zapisu. Sąsiedni nagłówek wyjaśnia, że chodzi o newsletter. |
| `/blog/strona/6` y=2259 | Następne wpisy | `/blog/strona/7` | ok | Następne wpisy | Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania. |
| `/blog/strona/6` y=2581 | Zapisuję się | `submit` | ok | Zapisuję się | Przycisk wysyła formularz zapisu. Sąsiedni nagłówek wyjaśnia, że chodzi o newsletter. |
| `/blog/strona/7` y=2071 | Zapisuję się | `submit` | ok | Zapisuję się | Przycisk wysyła formularz zapisu. Sąsiedni nagłówek wyjaśnia, że chodzi o newsletter. |

Pokrycie: 187 wystąpień CTA w treści oraz wspólny przycisk nagłówka. Nie wykonano zmian tekstów w aplikacji ani Sanity.

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

Najdłuższy odcinek bez powyższych CTA: y=530–3488 px, około 3.3 ekranu. Nagłówki i pozycje sekcji w facts.json.

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

Najdłuższy odcinek bez powyższych CTA: y=547–5816 px, około 5.9 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 10691 px wobec 9424 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Umów rozmowę o audycie" → `/kontakt` przy y=690. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet wysoki: Po "Dla kogo jest audyt AI w sprzedaży", przed "Dwa tygodnie pracy. Pięć kroków do decyzji.".

- Typ: CtaBand.
- Tekst: "Porozmawiajmy o audycie AI w Waszej firmie".
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
| Zobacz wdrożenie Pipedrive | `/szkolenie-i-wdrozenie-pipedrive` | 6050 px |
| Ustalmy zakres i cenę | `/kontakt` | 6050 px |
| Umów audyt Pipedrive | `/kontakt` | 7352 px |
| Zobacz Sales Atlas System | `/sales-atlas-system` | 8956 px |
| kontakt | `/kontakt` | 9763 px |
| kontakt | `/kontakt` | 10026 px |
| Wyślij zapytanie | `submit` | 10814 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 10663 px |
| +48571088338 | `tel:+48571088338` | 10711 px |

Najdłuższy odcinek bez powyższych CTA: y=1943–6050 px, około 4.6 ekranu. Nagłówki i pozycje sekcji w facts.json.

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
| Zobacz wdrożenie Asany | `/szkolenie-i-wdrozenie-asana` | 5931 px |
| Ustalmy zakres i cenę | `/kontakt` | 5931 px |
| Umów audyt Asany | `/kontakt` | 7158 px |
| Wyślij zapytanie | `submit` | 10281 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 10130 px |
| +48571088338 | `tel:+48571088338` | 10178 px |

Najdłuższy odcinek bez powyższych CTA: y=1861–5931 px, około 4.5 ekranu. Nagłówki i pozycje sekcji w facts.json.

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
| Zobacz audyt CRM | `/audyt-crm-pipedrive` | 6015 px |
| Umów audyt sprzedaży | `/kontakt` | 6015 px |
| Porozmawiajmy o wdrożeniu | `/kontakt` | 6015 px |
| Umów audyt sprzedaży | `/kontakt` | 6725 px |
| Sales Atlas System | `/sales-atlas-system` | 7377 px |
| Umów rozmowę | `/kontakt` | 7377 px |
| Zobacz Sales Atlas System | `/sales-atlas-system` | 8319 px |
| Wyślij zapytanie | `submit` | 10177 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 10026 px |
| +48571088338 | `tel:+48571088338` | 10074 px |

Najdłuższy odcinek bez powyższych CTA: y=1895–6015 px, około 4.6 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 12194 px wobec 10981 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Umów audyt sprzedaży" → `/kontakt` przy y=630. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet średni: Po "Proces sprzedaży", przed "Zespół i wynagradzanie".

- Typ: Przycisk inline.
- Tekst: "Porozmawiajmy o zakresie diagnozy sprzedaży".
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
| Program partnerski | `/program-partnerski` | 5498 px |
| Opisz swój proces | `/kontakt` | 5784 px |
| Zobacz Sales Atlas System | `/sales-atlas-system` | 6755 px |
| Wyślij zapytanie | `submit` | 8416 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 8264 px |
| +48571088338 | `tel:+48571088338` | 8312 px |

Najdłuższy odcinek bez powyższych CTA: y=6755–8264 px, około 1.7 ekranu. Nagłówki i pozycje sekcji w facts.json.

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

Najdłuższy odcinek bez powyższych CTA: y=1948–5331 px, około 3.8 ekranu. Nagłówki i pozycje sekcji w facts.json.

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

Najdłuższy odcinek bez powyższych CTA: y=0–2713 px, około 3.0 ekranu. Nagłówki i pozycje sekcji w facts.json.

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

Najdłuższy odcinek bez powyższych CTA: y=0–6075 px, około 6.8 ekranu. Nagłówki i pozycje sekcji w facts.json.

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

Najdłuższy odcinek bez powyższych CTA: y=0–16300 px, około 18.1 ekranu. Nagłówki i pozycje sekcji w facts.json.

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

Najdłuższy odcinek bez powyższych CTA: y=0–13610 px, około 15.1 ekranu. Nagłówki i pozycje sekcji w facts.json.

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

Najdłuższy odcinek bez powyższych CTA: y=0–14428 px, około 16.0 ekranu. Nagłówki i pozycje sekcji w facts.json.

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

Najdłuższy odcinek bez powyższych CTA: y=0–1159 px, około 1.3 ekranu. Nagłówki i pozycje sekcji w facts.json.

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

Najdłuższy odcinek bez powyższych CTA: y=1738–2587 px, około 0.9 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 2749 px wobec 2587 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Wyślij zapytanie" → `submit` przy y=910. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać. Formularz i kalendarz są dostępne od początku. Dodatkowa akcja konkurowałaby z wyborem sposobu kontaktu.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/kurs-ai-w-sprzedazy`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Kup w przedsprzedaży | `https://cart.easy.tools/checkout/53466467/kurs-ai-w-sprzedazy` | 664 px |
| Kup w przedsprzedaży | `https://cart.easy.tools/checkout/53466467/kurs-ai-w-sprzedazy` | 12171 px |
| Zobacz program grupowy | `/program-ai-dla-zespolu-sprzedazy` | 12171 px |
| Zacznijmy wdrożenie | `/wdrozenie-ai-w-sprzedazy-b2b` | 12171 px |
| Zadaj pytanie o kurs | `/kontakt` | 13103 px |
| Zobacz Sales Atlas System | `/sales-atlas-system` | 13548 px |
| Wyślij zapytanie | `submit` | 15472 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 15321 px |
| +48571088338 | `tel:+48571088338` | 15369 px |

Najdłuższy odcinek bez powyższych CTA: y=664–12171 px, około 12.8 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 17144 px wobec 16276 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Kup w przedsprzedaży" → `https://cart.easy.tools/checkout/53466467/kurs-ai-w-sprzedazy` przy y=749. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet wysoki: Po sekcji "Sprawdź, czy ten kurs jest dla ciebie", przed "Osiem modułów, osiem rozwiązań na koniec". Drugi, opcjonalny punkt po "Pierwszy skill w Claude albo ChatGPT", przed "Automatyzacje CRM i porządek w danych".

- Typ: Przycisk inline.
- Tekst: "Zapytaj, czy kurs pasuje do Twojego procesu; drugi: Zapytaj o pracę na Twoim CRM".
- Cel: `/kontakt`. To wejście na stronę kontaktu, nie bezpośrednie wysłanie formularza.
- Wdrożenie: Kod dla przycisku między elementami tabs; pierwszy punkt może być osobnym CtaBand w Sanity.
- Powód: Czytelnik może zweryfikować dopasowanie, zanim przeczyta cały program. Nie kopiować linku zakupu bez potwierdzenia aktualności przedsprzedaży.

### `/newsletter`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Zapisuję się | `submit` | 281 px |

Najdłuższy odcinek bez powyższych CTA: y=281–1630 px, około 1.5 ekranu. Nagłówki i pozycje sekcji w facts.json.

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

Najdłuższy odcinek bez powyższych CTA: y=0–2765 px, około 3.1 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 6621 px wobec 6102 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Porozmawiajmy o wdrożeniu" → `/kontakt` przy y=2940. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać. Po opisie rezultatów jest już "Porozmawiajmy o wdrożeniu", potem kanały kontaktu. CTA po opiniach byłoby blisko obecnego kontaktu i newslettera.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/polityka-prywatnosci`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Brak wezwań sprzedażowych | — | — |

Najdłuższy odcinek bez powyższych CTA: y=0–20363 px, około 22.6 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 12971 px wobec 20363 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "/* Sales Atlas System — badge z pulsującym promieniem. Pierścień z gradientu stożkowego przycięty maską do samej ramki plakietki, plus jego rozmyta kopia jako poświata. Rozmiar: --sas-szer / --sas-wys. */ .sas-beam{--sas-czas:11s;--sas-moc:1.15;--sas-rozmycie:2.6cqw;--sas-ramka:3.099%;--sas-szer:3.4135rem;--sas-wys:5rem;position:relative;display:block;width:var(--sas-szer);height:var(--sas-wys);border-radius:14.648% / 10%;container-type:inline-size;isolation:isolate} .sas-beam__plyta{position:absolute;inset:0;width:100%;height:100%;display:block} .sas-beam__ring{position:absolute;inset:0;display:block;overflow:hidden;border-radius:inherit;padding:var(--sas-ramka);pointer-events:none;mix-blend-mode:screen;-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude;animation:sas-iskra 6.7s ease-in-out infinite} .sas-beam__ring>i{position:absolute;left:50%;top:50%;width:170%;aspect-ratio:1;display:block;transform:translate(-50%,-50%) rotate(0deg);animation:sas-obieg var(--sas-czas) linear infinite,sas-oddech 4.4s ease-in-out infinite;background:conic-gradient(from 0deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0) 56%,rgba(182,241,255,.05) 60%,rgba(182,241,255,.22) 64.5%,rgba(235,237,250,.6) 68%,#fff 69.8%,rgba(235,237,250,.6) 71.5%,rgba(10,207,254,.3) 75%,rgba(10,207,254,.08) 80%,rgba(255,255,255,0) 85%)} .sas-beam__glow{position:absolute;inset:0;border-radius:inherit;pointer-events:none;mix-blend-mode:screen;opacity:.75;filter:blur(2px) saturate(1.25)} @supports (width:1cqw){.sas-beam__glow{filter:blur(var(--sas-rozmycie)) saturate(1.25)}} .sas-beam__glow .sas-beam__ring{mix-blend-mode:normal} @keyframes sas-obieg{to{transform:translate(-50%,-50%) rotate(360deg)}} @keyframes sas-oddech{0%,100%{opacity:calc(var(--sas-moc)*.32)}38%{opacity:calc(var(--sas-moc)*1)}62%{opacity:calc(var(--sas-moc)*.78)}} @keyframes sas-iskra{0%,62%,100%{filter:brightness(1)}74%{filter:brightness(1.45)}86%{filter:brightness(1.05)}} @media (prefers-reduced-motion:reduce){.sas-beam__ring{animation:none}.sas-beam__ring>i{animation:none;opacity:var(--sas-moc);transform:translate(-50%,-50%) rotate(288deg)}}" → `/sales-atlas-system` przy y=12359. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać promocyjnego CTA. Dokument prawny, potwierdzenie zapisu lub widok błędu powinien prowadzić do zakończenia swojej podstawowej czynności.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/program-ai-dla-zespolu-sprzedazy`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Zapisz się na pierwszą grupę | `/kontakt` | 664 px |
| Zobacz kurs | `/kurs-ai-w-sprzedazy` | 7389 px |
| Zapisz się na pierwszą grupę | `/kontakt` | 7389 px |
| Zacznijmy wdrożenie | `/wdrozenie-ai-w-sprzedazy-b2b` | 7389 px |
| Zapisz się na pierwszą grupę | `/kontakt` | 8354 px |
| Zobacz Sales Atlas System | `/sales-atlas-system` | 8800 px |
| Wyślij zapytanie | `submit` | 10593 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 10441 px |
| +48571088338 | `tel:+48571088338` | 10489 px |

Najdłuższy odcinek bez powyższych CTA: y=664–7389 px, około 7.5 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 12233 px wobec 11397 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Zapisz się na pierwszą grupę" → `/kontakt` przy y=749. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet średni: Po "Sprawdź, czy ten program pasuje do twojej firmy", przed "Pięć kroków w osiem tygodni".

- Typ: CtaBand.
- Tekst: "Zapytaj o udział zespołu w programie".
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

Najdłuższy odcinek bez powyższych CTA: y=505–1626 px, około 1.2 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 3927 px wobec 3555 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Poleć klienta" → `/kontakt` przy y=569. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać. Hero, opis kroków i formularz już zapewniają trzy miejsca kontaktu.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/regulamin`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Brak wezwań sprzedażowych | — | — |

Najdłuższy odcinek bez powyższych CTA: y=0–15732 px, około 17.5 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 12458 px wobec 15732 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "/* Sales Atlas System — badge z pulsującym promieniem. Pierścień z gradientu stożkowego przycięty maską do samej ramki plakietki, plus jego rozmyta kopia jako poświata. Rozmiar: --sas-szer / --sas-wys. */ .sas-beam{--sas-czas:11s;--sas-moc:1.15;--sas-rozmycie:2.6cqw;--sas-ramka:3.099%;--sas-szer:3.4135rem;--sas-wys:5rem;position:relative;display:block;width:var(--sas-szer);height:var(--sas-wys);border-radius:14.648% / 10%;container-type:inline-size;isolation:isolate} .sas-beam__plyta{position:absolute;inset:0;width:100%;height:100%;display:block} .sas-beam__ring{position:absolute;inset:0;display:block;overflow:hidden;border-radius:inherit;padding:var(--sas-ramka);pointer-events:none;mix-blend-mode:screen;-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude;animation:sas-iskra 6.7s ease-in-out infinite} .sas-beam__ring>i{position:absolute;left:50%;top:50%;width:170%;aspect-ratio:1;display:block;transform:translate(-50%,-50%) rotate(0deg);animation:sas-obieg var(--sas-czas) linear infinite,sas-oddech 4.4s ease-in-out infinite;background:conic-gradient(from 0deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0) 56%,rgba(182,241,255,.05) 60%,rgba(182,241,255,.22) 64.5%,rgba(235,237,250,.6) 68%,#fff 69.8%,rgba(235,237,250,.6) 71.5%,rgba(10,207,254,.3) 75%,rgba(10,207,254,.08) 80%,rgba(255,255,255,0) 85%)} .sas-beam__glow{position:absolute;inset:0;border-radius:inherit;pointer-events:none;mix-blend-mode:screen;opacity:.75;filter:blur(2px) saturate(1.25)} @supports (width:1cqw){.sas-beam__glow{filter:blur(var(--sas-rozmycie)) saturate(1.25)}} .sas-beam__glow .sas-beam__ring{mix-blend-mode:normal} @keyframes sas-obieg{to{transform:translate(-50%,-50%) rotate(360deg)}} @keyframes sas-oddech{0%,100%{opacity:calc(var(--sas-moc)*.32)}38%{opacity:calc(var(--sas-moc)*1)}62%{opacity:calc(var(--sas-moc)*.78)}} @keyframes sas-iskra{0%,62%,100%{filter:brightness(1)}74%{filter:brightness(1.45)}86%{filter:brightness(1.05)}} @media (prefers-reduced-motion:reduce){.sas-beam__ring{animation:none}.sas-beam__ring>i{animation:none;opacity:var(--sas-moc);transform:translate(-50%,-50%) rotate(288deg)}}" → `/sales-atlas-system` przy y=11846. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać promocyjnego CTA. Dokument prawny, potwierdzenie zapisu lub widok błędu powinien prowadzić do zakończenia swojej podstawowej czynności.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/regulamin-newslettera`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Brak wezwań sprzedażowych | — | — |

Najdłuższy odcinek bez powyższych CTA: y=0–7092 px, około 7.9 ekranu. Nagłówki i pozycje sekcji w facts.json.

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

Najdłuższy odcinek bez powyższych CTA: y=1784–7729 px, około 6.6 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 5838 px wobec 8352 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Umów bezpłatną konsultację" → `/kontakt` przy y=1898. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet wysoki: Po "Sprawdź, czy masz już system", przed "Skąd wziął się system sprzedaży".

- Typ: CtaBand.
- Tekst: "Umów konsultację o swoim systemie sprzedaży".
- Cel: `/kontakt`. To wejście na stronę kontaktu, nie bezpośrednie wysłanie formularza.
- Wdrożenie: Tylko Sanity: ctaBand.
- Powód: Wynik samooceny powinien prowadzić do rozmowy, bez szukania kontaktu w FAQ.

### `/szkolenie-i-wdrozenie-asana`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Umów rozmowę o wdrożeniu | `/kontakt` | 578 px |
| Porozmawiajmy o waszych projektach | `/kontakt` | 1923 px |
| Zobacz audyt Asany | `/audyt-procesow-asana` | 5757 px |
| Zacznijmy wdrożenie | `/kontakt` | 5757 px |
| Ustalmy zakres i cenę | `/kontakt` | 5757 px |
| Umów rozmowę o wdrożeniu | `/kontakt` | 6984 px |
| Wyślij zapytanie | `submit` | 10139 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 9988 px |
| +48571088338 | `tel:+48571088338` | 10036 px |

Najdłuższy odcinek bez powyższych CTA: y=1923–5757 px, około 4.3 ekranu. Nagłówki i pozycje sekcji w facts.json.

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
| Zobacz audyt CRM | `/audyt-crm-pipedrive` | 5954 px |
| Zacznijmy wdrożenie | `/kontakt` | 5954 px |
| Ustalmy zakres i cenę | `/kontakt` | 5954 px |
| Umów rozmowę o wdrożeniu | `/kontakt` | 7257 px |
| Zobacz Sales Atlas System | `/sales-atlas-system` | 8861 px |
| kontakt | `/kontakt` | 9701 px |
| kontakt | `/kontakt` | 9964 px |
| Wyślij zapytanie | `submit` | 10719 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 10567 px |
| +48571088338 | `tel:+48571088338` | 10615 px |

Najdłuższy odcinek bez powyższych CTA: y=2098–5954 px, około 4.3 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 12956 px wobec 11523 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Umów rozmowę o wdrożeniu" → `/kontakt` przy y=795. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet średni: Po "Struktura danych i migracja", przed "Konfiguracja, automatyzacje i integracje".

- Typ: Przycisk inline.
- Tekst: "Porozmawiajmy o migracji Twoich danych".
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

Najdłuższy odcinek bez powyższych CTA: y=1943–5882 px, około 4.4 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 12347 px wobec 10926 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Umów rozmowę o wdrożeniu" → `/kontakt` przy y=630. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet średni: Po "Struktura danych i migracja", przed "Konfiguracja, automatyzacje i integracje".

- Typ: Przycisk inline.
- Tekst: "Porozmawiajmy o migracji do Salesforce".
- Cel: `/kontakt`. To wejście na stronę kontaktu, nie bezpośrednie wysłanie formularza.
- Wdrożenie: Tylko Sanity: feature.cta.
- Powód: Odpowiada na ryzyko migracji, zanim czytelnik dojdzie do konfiguracji.

### `/wdrozenie-ai-w-sprzedazy-b2b`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Umów rozmowę o wdrożeniu AI | `/kontakt` | 578 px |
| Zobacz audyt AI | `/audyt-ai-sprzedaz` | 6467 px |
| Zacznijmy wdrożenie | `/kontakt` | 6467 px |
| Ustalmy zakres i cenę | `/kontakt` | 6467 px |
| Umów bezpłatną konsultację | `/kontakt` | 7229 px |
| Zobacz Sales Atlas System | `/sales-atlas-system` | 7674 px |
| Wyślij zapytanie | `submit` | 9467 px |
| grzesiek@zawlodzki.pl | `mailto:grzesiek@zawlodzki.pl` | 9315 px |
| +48571088338 | `tel:+48571088338` | 9363 px |

Najdłuższy odcinek bez powyższych CTA: y=578–6467 px, około 6.5 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 11334 px wobec 10271 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Umów rozmowę o wdrożeniu AI" → `/kontakt` przy y=665. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet wysoki: Po "Sprawdź czy moja usługa pasuje do Twojej firmy", przed "Pięć kroków do pierwszych procesów sprzedaży obsługiwanych przez AI".

- Typ: CtaBand.
- Tekst: "Porozmawiajmy o pierwszym procesie dla AI".
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

Najdłuższy odcinek bez powyższych CTA: y=497–3246 px, około 3.1 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 5111 px wobec 5909 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "Umów wstępną rozmowę" → `/kontakt` przy y=580. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać. Kroki współpracy zawierają ścieżkę do rozmowy, a FAQ kończy się formularzem.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/lista-cookies-i-identyfikatorow`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Brak wezwań sprzedażowych | — | — |

Najdłuższy odcinek bez powyższych CTA: y=0–5348 px, około 5.9 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 3620 px wobec 5348 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "/* Sales Atlas System — badge z pulsującym promieniem. Pierścień z gradientu stożkowego przycięty maską do samej ramki plakietki, plus jego rozmyta kopia jako poświata. Rozmiar: --sas-szer / --sas-wys. */ .sas-beam{--sas-czas:11s;--sas-moc:1.15;--sas-rozmycie:2.6cqw;--sas-ramka:3.099%;--sas-szer:3.4135rem;--sas-wys:5rem;position:relative;display:block;width:var(--sas-szer);height:var(--sas-wys);border-radius:14.648% / 10%;container-type:inline-size;isolation:isolate} .sas-beam__plyta{position:absolute;inset:0;width:100%;height:100%;display:block} .sas-beam__ring{position:absolute;inset:0;display:block;overflow:hidden;border-radius:inherit;padding:var(--sas-ramka);pointer-events:none;mix-blend-mode:screen;-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude;animation:sas-iskra 6.7s ease-in-out infinite} .sas-beam__ring>i{position:absolute;left:50%;top:50%;width:170%;aspect-ratio:1;display:block;transform:translate(-50%,-50%) rotate(0deg);animation:sas-obieg var(--sas-czas) linear infinite,sas-oddech 4.4s ease-in-out infinite;background:conic-gradient(from 0deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0) 56%,rgba(182,241,255,.05) 60%,rgba(182,241,255,.22) 64.5%,rgba(235,237,250,.6) 68%,#fff 69.8%,rgba(235,237,250,.6) 71.5%,rgba(10,207,254,.3) 75%,rgba(10,207,254,.08) 80%,rgba(255,255,255,0) 85%)} .sas-beam__glow{position:absolute;inset:0;border-radius:inherit;pointer-events:none;mix-blend-mode:screen;opacity:.75;filter:blur(2px) saturate(1.25)} @supports (width:1cqw){.sas-beam__glow{filter:blur(var(--sas-rozmycie)) saturate(1.25)}} .sas-beam__glow .sas-beam__ring{mix-blend-mode:normal} @keyframes sas-obieg{to{transform:translate(-50%,-50%) rotate(360deg)}} @keyframes sas-oddech{0%,100%{opacity:calc(var(--sas-moc)*.32)}38%{opacity:calc(var(--sas-moc)*1)}62%{opacity:calc(var(--sas-moc)*.78)}} @keyframes sas-iskra{0%,62%,100%{filter:brightness(1)}74%{filter:brightness(1.45)}86%{filter:brightness(1.05)}} @media (prefers-reduced-motion:reduce){.sas-beam__ring{animation:none}.sas-beam__ring>i{animation:none;opacity:var(--sas-moc);transform:translate(-50%,-50%) rotate(288deg)}}" → `/sales-atlas-system` przy y=3008. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać promocyjnego CTA. Dokument prawny, potwierdzenie zapisu lub widok błędu powinien prowadzić do zakończenia swojej podstawowej czynności.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/404`

Akcja naprawcza: "Wróć na stronę główną" → `/`, y=135 px. Zachować ją jako jedyne główne wezwanie.

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Wróć na stronę główną | `/` | 135 px |

Najdłuższy odcinek bez powyższych CTA: y=135–900 px, około 0.8 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 900 px wobec 900 px na stagingu. Brak porównywalnych wezwań w treści. Nie przenosić automatycznie rozmieszczenia z live.

Rekomendacja, priorytet niski: Nie dodawać promocyjnego CTA. Dokument prawny, potwierdzenie zapisu lub widok błędu powinien prowadzić do zakończenia swojej podstawowej czynności.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/podziekowanie-konsultacja`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| przejdź do mojego kalendarza ↗︎ | `https://cal.com/zawlodzki/30min` | 375 px |

Najdłuższy odcinek bez powyższych CTA: y=375–1207 px, około 0.9 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 1547 px wobec 1207 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "przejdź do mojego kalendarza ↗︎" → `https://cal.com/zawlodzki/30min` przy y=648. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać promocyjnego CTA. Dokument prawny, potwierdzenie zapisu lub widok błędu powinien prowadzić do zakończenia swojej podstawowej czynności.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/podziekowanie-newsletter`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Brak wezwań sprzedażowych | — | — |

Najdłuższy odcinek bez powyższych CTA: y=0–1449 px, około 1.6 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 1727 px wobec 1449 px na stagingu. Punkty odniesienia w live: "Newsletter" → `/newsletter` przy y=61; "Bezpłatna konsultacja" → `/kontakt` przy y=61; "/* Sales Atlas System — badge z pulsującym promieniem. Pierścień z gradientu stożkowego przycięty maską do samej ramki plakietki, plus jego rozmyta kopia jako poświata. Rozmiar: --sas-szer / --sas-wys. */ .sas-beam{--sas-czas:11s;--sas-moc:1.15;--sas-rozmycie:2.6cqw;--sas-ramka:3.099%;--sas-szer:3.4135rem;--sas-wys:5rem;position:relative;display:block;width:var(--sas-szer);height:var(--sas-wys);border-radius:14.648% / 10%;container-type:inline-size;isolation:isolate} .sas-beam__plyta{position:absolute;inset:0;width:100%;height:100%;display:block} .sas-beam__ring{position:absolute;inset:0;display:block;overflow:hidden;border-radius:inherit;padding:var(--sas-ramka);pointer-events:none;mix-blend-mode:screen;-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude;animation:sas-iskra 6.7s ease-in-out infinite} .sas-beam__ring>i{position:absolute;left:50%;top:50%;width:170%;aspect-ratio:1;display:block;transform:translate(-50%,-50%) rotate(0deg);animation:sas-obieg var(--sas-czas) linear infinite,sas-oddech 4.4s ease-in-out infinite;background:conic-gradient(from 0deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0) 56%,rgba(182,241,255,.05) 60%,rgba(182,241,255,.22) 64.5%,rgba(235,237,250,.6) 68%,#fff 69.8%,rgba(235,237,250,.6) 71.5%,rgba(10,207,254,.3) 75%,rgba(10,207,254,.08) 80%,rgba(255,255,255,0) 85%)} .sas-beam__glow{position:absolute;inset:0;border-radius:inherit;pointer-events:none;mix-blend-mode:screen;opacity:.75;filter:blur(2px) saturate(1.25)} @supports (width:1cqw){.sas-beam__glow{filter:blur(var(--sas-rozmycie)) saturate(1.25)}} .sas-beam__glow .sas-beam__ring{mix-blend-mode:normal} @keyframes sas-obieg{to{transform:translate(-50%,-50%) rotate(360deg)}} @keyframes sas-oddech{0%,100%{opacity:calc(var(--sas-moc)*.32)}38%{opacity:calc(var(--sas-moc)*1)}62%{opacity:calc(var(--sas-moc)*.78)}} @keyframes sas-iskra{0%,62%,100%{filter:brightness(1)}74%{filter:brightness(1.45)}86%{filter:brightness(1.05)}} @media (prefers-reduced-motion:reduce){.sas-beam__ring{animation:none}.sas-beam__ring>i{animation:none;opacity:var(--sas-moc);transform:translate(-50%,-50%) rotate(288deg)}}" → `/sales-atlas-system` przy y=1115. Pełne dane obu wersji w facts.json.

Rekomendacja, priorytet niski: Nie dodawać promocyjnego CTA. Dokument prawny, potwierdzenie zapisu lub widok błędu powinien prowadzić do zakończenia swojej podstawowej czynności.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/blog/strona/2`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Następne wpisy | `/blog/strona/3` | 2291 px |
| Zapisuję się | `submit` | 2613 px |

Najdłuższy odcinek bez powyższych CTA: y=0–2291 px, około 2.5 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 900 px wobec 3462 px na stagingu. Brak porównywalnych wezwań w treści. Nie przenosić automatycznie rozmieszczenia z live.

Rekomendacja, priorytet niski: Nie dodawać CTA między kartami. Lista służy wyborowi artykułu, a newsletter jest pod paginacją. Zachować ten sam układ na kolejnych stronach.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/blog/strona/3`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Następne wpisy | `/blog/strona/4` | 2291 px |
| Zapisuję się | `submit` | 2613 px |

Najdłuższy odcinek bez powyższych CTA: y=0–2291 px, około 2.5 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 900 px wobec 3462 px na stagingu. Brak porównywalnych wezwań w treści. Nie przenosić automatycznie rozmieszczenia z live.

Rekomendacja, priorytet niski: Nie dodawać CTA między kartami. Lista służy wyborowi artykułu, a newsletter jest pod paginacją. Zachować ten sam układ na kolejnych stronach.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/blog/strona/4`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Następne wpisy | `/blog/strona/5` | 2193 px |
| Zapisuję się | `submit` | 2515 px |

Najdłuższy odcinek bez powyższych CTA: y=0–2193 px, około 2.4 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 900 px wobec 3364 px na stagingu. Brak porównywalnych wezwań w treści. Nie przenosić automatycznie rozmieszczenia z live.

Rekomendacja, priorytet niski: Nie dodawać CTA między kartami. Lista służy wyborowi artykułu, a newsletter jest pod paginacją. Zachować ten sam układ na kolejnych stronach.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/blog/strona/5`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Następne wpisy | `/blog/strona/6` | 2193 px |
| Zapisuję się | `submit` | 2515 px |

Najdłuższy odcinek bez powyższych CTA: y=0–2193 px, około 2.4 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 900 px wobec 3364 px na stagingu. Brak porównywalnych wezwań w treści. Nie przenosić automatycznie rozmieszczenia z live.

Rekomendacja, priorytet niski: Nie dodawać CTA między kartami. Lista służy wyborowi artykułu, a newsletter jest pod paginacją. Zachować ten sam układ na kolejnych stronach.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/blog/strona/6`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Następne wpisy | `/blog/strona/7` | 2259 px |
| Zapisuję się | `submit` | 2581 px |

Najdłuższy odcinek bez powyższych CTA: y=0–2259 px, około 2.5 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 900 px wobec 3429 px na stagingu. Brak porównywalnych wezwań w treści. Nie przenosić automatycznie rozmieszczenia z live.

Rekomendacja, priorytet niski: Nie dodawać CTA między kartami. Lista służy wyborowi artykułu, a newsletter jest pod paginacją. Zachować ten sam układ na kolejnych stronach.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.

### `/blog/strona/7`

Obecne CTA w treści:

| Etykieta | Cel | Pozycja y |
| --- | --- | --- |
| Zapisuję się | `submit` | 2071 px |

Najdłuższy odcinek bez powyższych CTA: y=0–2071 px, około 2.3 ekranu. Nagłówki i pozycje sekcji w facts.json.

Porównanie live: wysokość 900 px wobec 2920 px na stagingu. Brak porównywalnych wezwań w treści. Nie przenosić automatycznie rozmieszczenia z live.

Rekomendacja, priorytet niski: Nie dodawać CTA między kartami. Lista służy wyborowi artykułu, a newsletter jest pod paginacją. Zachować ten sam układ na kolejnych stronach.

Nowe miejsce, typ, tekst i cel: nie dotyczy, brak rekomendowanego dodatku. Kod i Sanity: bez zmian.
