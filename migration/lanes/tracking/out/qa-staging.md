# T21. Wyniki QA zgód na stagingu

Stan z 2026-10-23, odczyty od 08:47 do 08:55 UTC. Wynik całego zadania jest **blocked**. Witryna na stagingu jest już pełnym serwisem, a `/kontakt` zwraca 200. Brakuje skryptu zgód i GTM, więc macierz Tag Assistant, baner, zapis wyboru i wypełnienie atrybucji nie mają czego sprawdzać.

Origin c15t dopuszczony 2026-10-22 nadal odpowiada. Szczegóły tamtej zmiany i ścieżka cofnięcia są w sekcji przebiegu 2026-10-22.

## Sesja

| Pole | Wartość |
|---|---|
| Origin | `https://zawlodzki-web.zawlodzki.workers.dev` |
| Rewizja źródła | `99c0c33`, ten sam kod witryny co merge T20 (`852825f`) |
| Przeglądarka | Playwright 1.56.1, headless Chromium, binarka `/usr/bin/google-chrome-stable`, nowy kontekst na każdy przypadek |
| Okno po `DOMContentLoaded` | 4 s, bez `networkidle` (poprzednia próba z `networkidle` przekroczyła 45 s) |
| Tag Assistant | Rozszerzenie nie było podłączone. Zastępstwem jest log żądań, `dataLayer` i `window.__zawlodzkiConsentState` |
| Zrzuty | `/tmp/t21-evidence/*.png`. Nie wchodzą do repozytorium, bo T21 posiada tylko ten plik |

Nie wysłano formularza do n8n. Żądanie `POST /api/form` przeglądarka przerwała lokalnie, zanim doszło do Workera.

## Strony

Trzy odpowiedzi stagingu są bajt w bajt tym samym HTML-em co lokalny Worker `wrangler dev` z rewizji `99c0c33` (`web.sh doctor` zdrowy, port 8790).

| Ścieżka | HTTP | Title | SHA-256 (12) | Długość |
|---|---|---|---|---|
| `/` | 200 | CRM, automatyzacja i AI dla sprzedaży B2B \| Grzegorz Zawłodzki | `1e2045811a17` | 86622 |
| `/szkolenie-i-wdrozenie-pipedrive` | 200 | Wdrożenie Pipedrive CRM z procesem i szkoleniem \| Zawłodzki | `4fe5ada976e2` | 94485 |
| `/kontakt` | 200 | Kontakt \| Grzegorz Zawłodzki | `a1c1b155be7e` | 27297 |

Nagłówek stagingu na każdej z tych ścieżek to `x-robots-tag: noindex, nofollow`. Fraza szkieletu `Nowa wersja strony w budowie.` nie występuje. `/uslugi` zwraca 404. To nie jest ścieżka `keep` w `url-map.csv`.

Lokalne sondy `web.sh probe`:

```text
127.0.0.1  /  200  -  noindex, nofollow  text/html; charset=utf-8  CRM, automatyzacja i AI dla sprzedaży B2B | Grzegorz Zawłodzki
127.0.0.1  /kontakt  200  -  noindex, nofollow  text/html; charset=utf-8  Kontakt | Grzegorz Zawłodzki
127.0.0.1  /szkolenie-i-wdrozenie-pipedrive  200  -  noindex, nofollow  text/html; charset=utf-8  Wdrożenie Pipedrive CRM z procesem i szkoleniem | Zawłodzki
```

## Inicjalizacja

Sprawdzone na `/`, na stronie usługowej i na `/kontakt`, oraz na `/` z testowym `utm_source`, `utm_medium` i syntetycznym `gclid`.

| Punkt checklisty | Wynik | Stan rzeczywisty |
|---|---|---|
| Inline `#zawlodzki-consent-default` przed loaderem | Fail | Brak elementu w HTML i w DOM |
| `security_storage: granted` | Fail | Brak skryptu, który mógłby ustawić sygnał |
| `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization` równe `denied` | Fail | J.w. |
| Loader `https://consent.zawlodzki.com/assets/cmp-v1.js` raz, bez drugiego snippetu GTM | Fail | Zero żądań do `consent.zawlodzki.com` i do `googletagmanager.com` |
| `/api/c15t/init` z originu stagingu, bez błędu CORS | Pass dla samego API | `GET` z nagłówkiem `Origin` zwraca 200 i `access-control-allow-origin` równy dokładnie originowi stagingu. Strona tego adresu nie woła |
| GTM jako skrypt necessary, także przed wyborem | Fail | Brak żądania kontenera. `gtag` jest `undefined` |
| `__zawlodzkiConsentState` na starcie | Fail | Wartość jest `null`, nie `{necessary: true, measurement: false, marketing: false}` |
| Zmiana preferencji, potem Consent Mode, potem `consent-update` | Blocked | Nie ma banera ani przycisku preferencji |
| `[data-c15t-open]` i dialog z klawiatury | Fail / blocked | Liczba węzłów `[data-c15t-open]` to 0. Dialogów i węzłów `c15t` też jest 0. Nie ma czego otworzyć z klawiatury |

Tekst DOM strony głównej, kontaktowej i lokalnego zrzutu po skryptach nie zawiera `Akceptuj`, `cookie`, `plików` ani `c15t`. Dolne 220 pikseli zrzutów `/`, strony usługowej i `/kontakt` mają jasne tło (średnia około 240, 240, 240). To nie jest ciemny baner.

Produkcja `https://www.zawlodzki.pl/` w tym samym oknie czasu nadal ma jeden loader `cmp-v1.js`, jeden `[data-c15t-open]` i inline ze sygnałami `security_storage=granted` oraz czterema pozostałymi `denied`. Snippetu `googletagmanager.com/gtm.js` w HTML produkcji nie ma. GTM ma ładować loader, zgodnie z planem.

Hosty żądań na stagingu, przed jakąkolwiek zgodą, to tylko `zawlodzki-web.zawlodzki.workers.dev`, `cdn.sanity.io` i `challenges.cloudflare.com`. Liczba żądań do hostów pomiaru i reklam (GTM, GA, Ads, DoubleClick, Meta, Clarity, Albacross, Leadfeeder, LinkedIn, Bing) wynosi 0. Ciasteczka i `localStorage` są puste.

Sam brak żądań nie zalicza bramki. Trzy tagi z tabeli (łączący konwersje, GA4, Google Ads) mają wystartować jeszcze przy odmowie, w trybie denied. One też nie wystartowały, bo kontenera nie ma.

## Macierz 11 tagów

| Stan | Wynik | Dowód |
|---|---|---|
| Przed zgodą i przy odmowie | Fail | Kontener GTM nie przychodzi. Nie da się porównać Fired i Not fired z tabelą T06 |
| Sama zgoda measurement | Blocked | Brak banera i brak `dataLayer` |
| Sama zgoda marketing | Blocked | J.w. |
| Obie zgody | Blocked | J.w. |
| Odświeżenie i zachowany wybór | Blocked | Po wejściu z UTM i syntetycznym click ID magazyn zostaje pusty. Nie ma zapisanego wyboru do odtworzenia |
| Cofnięcie measurement, potem marketing, potem obu | Blocked | Brak UI i brak ciasteczek `_ga*`, `_fbp`, `_gcl*` do skasowania |

Wersji opublikowanego kontenera GTM nie odczytano, bo kontener się nie ładuje. Snapshot T06 mówi o wersji 54. Tego nie potwierdzono ani nie obalono na stagingu.

## Formularz

`/kontakt` ma dwa formularze, `main-contact` i `newsletter`. Strona główna i usługowa mają formularz landingowy. W HTML jest komplet 32 nazw atrybucji z checklisty T06. Nie ma braków ani nazw spoza listy. Wartości tych pól są puste także po wejściu z UTM i syntetycznym click ID.

Widoczny widget to Turnstile (`challenges.cloudflare.com/turnstile/v0/api.js`). Pole tokenu jest niepuste przed kliknięciem. Wartości tokenu nie zapisano.

Próba wysłania formularza kontaktowego użyła syntetycznego adresu i tematu. Playwright przerwał `POST /api/form` w przeglądarce (metoda POST, host stagingu, ścieżka `/api/form`, 3801 bajtów treści). Do Workera i do n8n żądanie nie wyszło. Strona została na `/kontakt`. Tekst regionu statusu to `Brak połączenia. Sprawdź internet i spróbuj ponownie.` To jest gałąź błędu klienta, nie dowód dostarczenia.

| Punkt | Wynik |
|---|---|
| 32 nazwy pól w formularzu | Pass |
| Przy odmowie brak utrwalenia UTM i click ID | Niezaliczone jako ścieżka CMP. Pola zostały puste, bo filler `cmp-v1.js` nie działa, a nie dlatego, że użytkownik odmówił |
| Wypełnienie po measurement i po marketing | Blocked |
| `conversion_timestamp` i flagi z chwili wysłania | Blocked. Przed kliknięciem pola atrybucji były puste. Treści POST nie dekodowano, żeby nie zapisywać tokenu Turnstile |
| `attribution_policy_id` i schemat `1` | Blocked |
| TTL 90 dni, sesja 30 minut, wygasłe rekordy testowe | Blocked |
| Turnstile i dostarczenie do n8n | Blocked dla dostarczenia. Widget się ładuje. Wysyłki do produkcyjnego webhooka nie wykonano |

## Przyczyna

Loader nie ginie na etapie wdrożenia. `apps/web/src/layouts/Base.astro` wypisuje charset, viewport, fonty, SEO i favicon. Nie wypisuje `#zawlodzki-consent-default` ani `cmp-v1.js`. `apps/web/src/worker/index.ts` nie przepisuje HTML. `wrangler.jsonc` nie ma zmiennej GTM ani CMP. `git log -S cmp-v1` nie ma commitu, który dodaje loader pod `apps/web`. Jedyny kod zgód w aplikacji to nazwy pól w `apps/web/src/worker/form.ts` i puste inputy w `LeadForm.astro`.

PR #32 to poprzedni raport QA, nie implementacja snippetu. Deploy stagingu po T20 serwuje dokładnie ten HTML, który buduje się z obecnego `main`.

Żadne zadanie nie ma kroku, który wstawia snippet. `Base.astro` jest w `owns` u T18 (`done`) i nadal u T20 (`blocked`, PR #31 zmergowany, bramka G3 otwarta na 22 różnicach treści). T02 utworzyło `apps/web/src/layouts/**` i jest `done`. T12 posiada `apps/web/src/seo/**` i też jest `done`. To są meta i JSON-LD, nie zgody. T21 posiada wyłącznie ten raport i nie może dopisać loadera.

`Base` nie ma slotu w `<head>`. Dopisek musi trafić do `Base.astro`, przed późniejszymi skryptami. `Seo.astro` i Worker są złym miejscem. Worker nie przepisuje HTML. `tasks.py check` pilnuje nakładania się `owns` tylko przy statusach claimed i review. Dziś T20 jest blocked, więc samo sprawdzenie tablicy nowego claimu by przeszło. Gdy T20 wróci do claimed albo review i nadal będzie posiadać `Base.astro`, check padnie. Nowe zadanie ma najpierw dostać ten plik, a T20 ma go oddać.

## Wznowienie

1. Nowe zadanie dostaje `Base.astro` w `owns`. T20 oddaje ten plik, zanim oba będą claimed albo review. Zadanie dodaje w `<head>`, przed innymi skryptami, inline Consent Mode v2 i jeden loader `https://consent.zawlodzki.com/assets/cmp-v1.js`. Bez drugiego snippetu GTM. Sygnały startowe mają być takie jak na produkcji w dniu tego odczytu.
2. Po wdrożeniu na staging powtórzyć tę checklistę w przeglądarce z Tag Assistant. Wysłać formularz tylko do mocka albo do osobno zatwierdzonego flow testowego.
3. Do tego czasu nie traktować macierzy zgód jako zaliczonej. Pole Done when w T21 zostaje puste.

## Przebieg 2026-10-22

Poprzedni agent (`codex-gpt61-q7m2`) zapisał zmianę originu c15t i zablokował zadanie, bo staging był wtedy szkieletem, a `/kontakt` zwracał 404. Ten opis szkieletu i 404 jest nieaktualny od redeployu po T20. Reszta tamtego przebiegu zostaje aktualna.

Użytkownik zezwolił wtedy na dopisanie `https://zawlodzki-web.zawlodzki.workers.dev` do `trustedOrigins` i `legacyOrigins` na VPS. Bez wildcardu i bez localhost. Obraz `zawlodzki/c15t:2.3.0-t21-origin-20261022`. Kopia do cofnięcia jest na VPS pod `/opt/stacks/update-backups/20261022T183233Z-t21-c15t-origin`.

Odczyty `/api/c15t/init` po zmianie to 200 z dokładnym ACAO dla stagingu, `www` i apex. Obcy origin zostaje na 403. Preflight `OPTIONS /api/c15t/subjects` zwrócił 204. Zapisy i odczyty czterech stanów oraz cofnięcia zwróciły 200. Powstały syntetyczne podmioty. Nie usuwano ich. Ten przebieg nie powtarzał zapisów.

Wtedy HTML strony głównej nie miał żadnego `script`, a `/kontakt` zwracał 404. Test API nie zastępował checklisty przeglądarkowej. Tego zdania ten przebieg nie odwołuje.
