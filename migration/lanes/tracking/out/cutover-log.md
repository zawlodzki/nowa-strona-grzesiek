# T22. Dziennik przełączenia zawlodzki.pl

## Stan przed zmianą, 12 listopada 2026 (CET)

| Godzina | Sprawdzenie | Wynik |
|---|---|---|
| 21:54 | Tablica zadań i prywatna inwentaryzacja | T05, T20 i T21 mają status done. Inwentaryzacja aktualna. T22 zarezerwowane w commicie `940d5d7`. |
| 21:55 | DNS, publiczne HTTP i panel Cloudflare | Delegacja do `elinore.ns.cloudflare.com` i `nash.ns.cloudflare.com`. Brak DS. Pięć rekordów MX Google Workspace. Apex A i www CNAME do Webflow są proxowane, TTL Auto (300 s dla odpowiedzi proxy). |
| 21:55 | Crawl wdrożonego stagingu | 111 adresów HTTP 200, 104 w sitemapie. Wszystkie 108 adresów keep przeszły test. Dziewięć przekierowań z kontraktu działa; próba `/blog?f95bbc04_page=2&t22=1` dała 301 do `/blog?t22=1` po skorygowaniu zapytania testowego. Sześć przypadków GSC kończy się HTTP 200. |
| 21:56 | Porównanie z inwentaryzacją i audyt JSON-LD | 131 różnic ma wpis w decyzjach T20. Jedyna nowa pozycja to liczba słów na `/newsletter`. Porównano tekst obu stron. Zostały tytuł, oferta, zgoda i odnośniki do dokumentów. Webflow ma dodatkową etykietę zgody, której nie ma w prostym formularzu newslettera. Audyt wykrył JSON-LD na 111 stronach. |
| 21:56 | Odczyt wdrożeń produkcji | Cloudflare API zwróciło 10007 dla `zawlodzki-web-production`: Worker nie istnieje. |
| 21:57 | Zachowanie apex przed zmianą | Publiczny apex daje 301 do www. Zachowuje ścieżkę i zapytanie, np. `/blog/raporty-sprzedazowe?test=t22`. Panel nie ma reguł Single Redirect ani Page Rules dla tej strefy. |
| 21:58 | `verify-web` i produkcyjny dry run | Lokalny Worker na hoście www daje 200 bez `X-Robots-Tag`, 404 dla `/O-MNIE`, 301 dla `/blog/?t22=1` i 200 dla robots oraz sitemapy. Lokalny apex daje HTML, więc 301 wymaga reguły strefy. Build z publicznym kluczem Turnstile ze stagingu przechodzi `wrangler deploy --env production --dry-run`. |

Odczyt po crawl wykazał nowsze wdrożenie stagingu o 21:56:42 CET (wersja `8bed0dfa-e4b9-4d20-95c4-93a08f14c7ec`). Powtórz crawl dla wersji użytej do porównania z produkcją. Pakiet lokalny z `940d5d7` używał datasetu `production`.

## Kolejność przełączenia

1. Po zgodzie właściciela wdróż sprawdzony pakiet na `zawlodzki-web-production` bez domen i bez `workers.dev`. Użyj datasetu `production` i wstrzymaj publikacje w Sanity na czas porównania treści. Zapisz commit, wersję stagingu i identyfikator wersji produkcji. Potwierdź parę kluczy Turnstile dla `www.zawlodzki.pl` i hosta testowego. Ustaw `N8N_FORM_WEBHOOK` oraz `TURNSTILE_SECRET_KEY` z zatwierdzonego źródła. Sprawdź tę wersję na `cutover-check.zawlodzki.pl` z nagłówkiem noindex. Przed testową wysyłką do n8n uzyskaj zgodę na konkretną próbę.
2. Po potwierdzeniu przełączenia ustaw w strefie Cloudflare 301 z apexu do www z zachowaniem ścieżki i parametrów. Zweryfikuj HTTP i HTTPS, ścieżkę i zapytanie. Podepnij `www.zawlodzki.pl` jako Custom Domain produkcyjnego Workera, zastępując CNAME do Webflow. Jeżeli panel nie oferuje podmiany istniejącego rekordu, zatrzymaj się przed kasowaniem i przygotuj sekwencję z działającym HTTPS. Podepnij apex do tego samego Workera, zastępując jego stary rekord A po sprawdzeniu reguły 301. Pozostaw MX, SPF, DKIM, DMARC, DNSSEC i delegację bez zmian.
3. Zaraz po zmianie sprawdź TLS, stronę główną, robots, sitemapę, adresy z kontraktu i 404. Porównaj crawl z etapem przed zmianą. Wykonaj uzgodniony test formularza, zgód i wysyłki oraz odbioru poczty. G4 pozostaje otwarte do uzyskania wyników.
4. Po odrębnej zgodzie obsłuż GSC i późniejszą aktywację DNSSEC. Nie anuluj planu Webflow przed potwierdzeniem działania produkcji. Właściciel poprosił o trwałe przejście na Cloudflare. Przy problemie z nowym wydaniem przywróć wcześniej sprawdzoną wersję Workera po uzyskaniu zgody; pierwsze wdrożenie nie ma takiej wersji, dopóki nie zostanie zweryfikowane.

Contract request: utrwalić domeny w konfiguracji produkcyjnej Workera. T22 posiada dziennik, a `apps/web/wrangler.jsonc` jest poza jego `owns`. Do czasu utrwalenia sprawdź, czy następne wdrożenie zachowa przypisania. Zgodnie z T66 publikacje w Sanity przebudowują staging. Wydania produkcji są ręczne, dopóki właściciel nie zmieni tej decyzji.

Przed przełączeniem nie zmieniono DNS, domen Workera, sekretów, Webflow ani rekordów poczty.


## Test wdrożonego Workera, 12 listopada 2026 (CET)

- 22:06. Po zgodzie właściciela uruchomiono `zawlodzki-web-production` na `cutover-check.zawlodzki.pl`. Aktywna wersja `2b68bba0-1ad5-4c6a-bf38-de60e8dcc199` (100%). Pakiet z `940d5d7`, dataset `production`.
- 22:06. Potwierdzono nazwy dwóch sekretów Workera. Adres webhooka zidentyfikowano na podstawie jednego pasującego aktywnego workflow. Klucz publiczny pakietu pasuje do widgetu Turnstile dla `zawlodzki.pl`.
- 22:07. Crawl Workera testowego i aktualnego stagingu obejmuje po 111 stron HTTP 200, w tym 104 z sitemapy. `diff-crawls.mjs` nie wykazał różnic. Na hoście testowym strona główna, kontakt, robots i sitemap dają 200 i nagłówek noindex. `/O-MNIE` daje 404. `/blog/?t22=1` daje 301 z zachowaniem parametru. Formularz bez tokenu zwraca 403.
- Przełączenie głównych hostów i test dostarczenia formularza oczekują na zgodę właściciela.


## Przełączenie produkcji, 12 listopada 2026 (CET)

- 22:09. Po zgodzie właściciela włączono regułę `T22 Apex to www`. Wzorzec `http*://zawlodzki.pl/*` prowadzi do `https://www.zawlodzki.pl/${2}` ze statusem 301 i zachowaniem parametrów. HTTP przechodzi najpierw na HTTPS apexu. HTTPS apexu zwraca 301 do kanonicznego hosta.
- 22:10. Cloudflare odrzucił Custom Domain dla www ze względu na istniejący rekord DNS (100117). Nie usunięto rekordu, żeby nie przerywać dostępu. Na istniejącym proxy wdrożono trasy `www.zawlodzki.pl/*` i `zawlodzki.pl/*` do sprawdzonego Workera. Host testowy pozostaje Custom Domain.
- 22:11. Produkcyjne www zwraca stronę Astro i Sanity bez nagłówka noindex. Crawl wykazał 111 stron, 104 w sitemapie i 0 różnic względem hosta testowego. Produkcyjne robots pozwala na indeksowanie. Sześć przypadków GSC kończy się HTTP 200. `/O-MNIE` daje 404. Osobny test kontraktu potwierdził 108 adresów keep i wszystkie 9 przekierowań.
- 22:12. Próba zapisu zastępczego rekordu A dla www została odrzucona przez automatyczną kontrolę ze względu na zakres zgody i ryzyko przerwy. Zamknięto niezapisany formularz. Ruch produkcyjny przejmuje Worker, a dotychczasowe cele DNS Webflow pozostają zapisane.
- 22:13. Zatwierdzony test formularza na produkcji przeszedł do strony podziękowania. n8n zwrócił sukces wykonania `39262`. Publiczny DNS nadal zwraca pięć rekordów MX Google Workspace. Test wysyłki i odbioru poczty, GSC oraz DNSSEC pozostają otwarte.


## Odłączenie rekordów Webflow, 12 listopada 2026 (CET)

- 22:19. Po osobnej zgodzie właściciela zastąpiono proxowany CNAME www rekordem A `192.0.2.1`. Pierwszy odczyt strony głównej zwrócił jeszcze HTML Webflow. Zmianę apexu wstrzymano do czasu potwierdzenia, że obie trasy są aktywne, a strona główna i kontakt zwracają HTML Workera.
- 22:20. Zastąpiono adres rekordu A dla apexu adresem `192.0.2.1`. Panel potwierdził oba proxowane rekordy A. Cloudflare obsługuje ruch przez Workers Routes, a adresy rekordów nie wskazują na Webflow.
- 22:21. Apex zwraca HTTPS 301 do www z niezmienioną ścieżką i parametrami. Końcowy crawl objął 111 stron HTTP 200, 104 adresy w sitemapie i 0 różnic względem pakietu testowego. Publiczny DNS nadal zwraca pięć rekordów MX Google Workspace. Brakuje testu wysyłki i odbioru poczty. Abonament Webflow nadal oczekuje na decyzję właściciela.

Contract request: zapisać dwie Workers Routes w konfiguracji produkcji w repozytorium. Do tego czasu zachowuj aktualne trasy przy promocji wersji Workera i sprawdzaj je po każdym wdrożeniu.
