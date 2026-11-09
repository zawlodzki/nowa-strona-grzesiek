# T21. Wyniki QA zgód na stagingu

Stan z 2026-11-08, przebieg od 21:10 do 21:17 UTC, uzupełniony 2026-11-09 o konfigurację formularzy i dostarczenie do n8n. Wynik całego zadania jest **blocked** z jednego powodu: **czyszczenie przy cofnięciu zgody**. Albacross i piksel Meta zapisują swoje cookies ponownie w starym dokumencie, już po czyszczeniu przez loader. Szczegóły są w sekcji „Cofnięcie zgody”.

Pozostałe punkty checklisty T06 przechodzą: inicjalizacja, macierz czterech stanów, zachowanie wyboru, dialog z klawiatury, kontrakt pól 6/26/12/32 oraz Turnstile i dostarczenie formularza do n8n (od 2026-11-09).

## Sesja

| Pole | Wartość |
|---|---|
| Origin | `https://zawlodzki-web.zawlodzki.workers.dev` |
| Kod | `main` na `06dc06f`, zawiera T26 (loader zgód) i T27 (nawigacja, stopka, `[data-c15t-open]`) |
| Wdrożenie | Wersja Workera `7be7767b`, utworzona 2026-11-08 21:06:51 UTC, minutę po pushu do `main`. Ten przebieg niczego nie wdrażał |
| Przeglądarka | Chrome 157 przez chrome-devtools MCP. Każdy stan w osobnym izolowanym kontekście (`t21-deny`, `t21-meas`, `t21-mkt`, `t21-full`, `t21-kbd`), bez rozszerzeń |
| Tag Assistant | Nieużyty. Izolowany profil nie ma konta Google. Zastępstwem są: `dataLayer`, `window.__zawlodzkiConsentState`, `performance` (hosty zasobów), `cookieStore` (nazwy i domeny cookies) i lista żądań DevTools |
| GTM | `GTM-P5V3CJ5`, opublikowana wersja `54`. Odczyt z `gtm.js` jest zgodny ze snapshotem T06, więc tabela tagów obowiązuje bez zmian |
| Loader | `cmp-v1.js?v=20260821-1`, bajt w bajt taki sam jak `00-inventory/live-site/third-party-raw/cmp-v1.js` |
| Dane testowe | UTM `qa-t21` i syntetyczne `QA-SYNTH-*` dla `gclid`, `fbclid`, `li_fat_id` i `msclkid`. Formularz wysłany z adresem `qa-t21@example.com` |
| Zrzuty | `migration/lanes/tracking/private/t21-20261108/` (gitignored, poza repozytorium) |

Zgodę na ten przebieg użytkownik dał 2026-11-08 w czacie. Obejmowała macierz zgód z zapisami do c15t i odsłonami u dostawców z hosta `workers.dev` oraz jedną testową wysyłkę formularza do n8n.

## Inicjalizacja

Strony `/`, `/szkolenie-i-wdrozenie-pipedrive` i `/kontakt` sprawdzone w źródle HTML (`curl`) i w przeglądarce.

| Punkt checklisty | Wynik | Stan rzeczywisty |
|---|---|---|
| Inline `#zawlodzki-consent-default` przed loaderem i GTM | Pass | Inline jest na bajcie 135, loader na 638. Snippetu GTM w HTML nie ma |
| `security_storage: granted` | Pass | W inline i w `consent default` w `dataLayer` |
| Cztery sygnały analityczne i reklamowe `denied` | Pass | J.w. |
| Loader raz, bez drugiego GTM | Pass | Jeden `cmp-v1.js` z `defer`. Jeden `gtm.js?id=GTM-P5V3CJ5`, wstrzyknięty przez loader |
| `/api/c15t/init` bez CORS | Pass | `GET` 200, preflight `OPTIONS` 204. W konsoli nie ma błędu CORS |
| GTM jako `necessary` przed wyborem | Pass | `gtm.js`, `gtm.dom` i `gtm.load` są w `dataLayer` przy otwartym banerze |
| `__zawlodzkiConsentState` na starcie | Pass | `necessary: true`, `measurement: false`, `marketing: false`, `policyId: zawlodzki_global_opt_in_v2`, `schemaVersion: 1` |
| Najpierw Consent Mode, potem `consent-update` | Pass | Kolejność w każdym stanie: `consent update`, potem `event consent-update` (gtag), potem obiekt `{event: 'consent-update', c15t_consent_update: true}` |
| Zapisany wybór przed tagami | Pass | Po przeładowaniu w stanie measurement drugie `consent default` ma `analytics_storage=granted` przed `gtm.js` |

Baner to `role="dialog"`, `aria-modal="true"`, z nazwą „Ciasteczka na tej stronie”. Ma przyciski „Dostosuj”, „Odrzucam opcjonalne” i „Akceptuję wszystkie”. Zrzut: `01-deny-banner.png`.

## Macierz 11 tagów

Hosty zasobów po wyborze (bez `cdn.sanity.io` i własnego originu):

| Stan | GTM, GA4, Ads | Clarity | Albacross | Leadfeeder (2 skrypty) | Meta | Cookies | Wynik |
|---|---|---|---|---|---|---|---|
| Przed zgodą i odmowa | GA4 tylko z `gcs=G100`, bez cookies | Brak | Brak | Brak | Brak | tylko `zawlodzki-consent` | Pass |
| Sam measurement | GA4 analytics granted, reklamy denied | `clarity.ms/tag/gjd8ua7x7t` | `serve.albacross.com`, `new-collect.albacross.com` | `lftracker_v1_Xbp1…`, `lftracker_v1_p1e0…` | Brak | `_ga`, `_ga_FPQCV0H550`, `nQ_*` | Pass |
| Sam marketing | Ads, remarketing, DoubleClick. Brak `_ga` | Brak | Brak | Brak | `fbevents.js`, config piksela | `_gcl_au`, `_gcl_aw`, `_fbp`, `_fbc` | Pass |
| Obie zgody | GA4 z `gcs=G111`, Ads | Tak | Tak | Tak, oba | Tak | Wszystkie powyższe | Pass |

To zgadza się z tabelą T06, z dwoma zastrzeżeniami:

- Trzy tagi Attribution oceniono po efekcie, czyli po polach formularza i kluczach `zaw_attribution_*`, a nie po statusie Fired.
- Oba skrypty Leadfeeder ładują się razem pod measurement. Mapowanie nazw tagów na identyfikatory pozostaje niepotwierdzone, bo nie było UI Tag Assistant.

Żądania `pagead2.googlesyndication.com/ccm/collect` w tym środowisku kończyły się `ERR_CONNECTION_REFUSED` po stronie lokalnej sieci. To nie jest błąd stagingu.

| Punkt per stan | Wynik |
|---|---|
| Fired / Not fired względem tabeli | Pass, przez hosty i skrypty. Bez statusów Tag Assistant |
| Brak niezamierzonych duplikatów | Pass. Jeden `gtm.js`, jeden loader, po jednym `fbevents.js` i `clarity` |
| Odmowa: brak opcjonalnych cookies i atrybucji | Pass. `gclid` i `fbclid` z URL nie trafiły do storage |
| Zgoda: tylko dozwolone kategorie | Pass |
| Odświeżenie i nowa karta zachowują wybór | Pass. Sprawdzone przeładowaniem i nową kartą w tym samym kontekście. Zamknięcia całej przeglądarki nie symulowano |
| `[data-c15t-open]` i dialog z klawiatury | Pass. Przycisk „Zarządzaj zgodami” w stopce otwiera preferencje. Przełączniki to `role="switch"` z `aria-checked`. Space przełącza „Analityka”, Enter na „Zapisuję wybór” zapisuje. Tab krąży wewnątrz banera |

## Kontrakt 32 pól formularza

| Stan | Pola atrybucji | Wynik |
|---|---|---|
| Odmowa | 6 (grupa „Zawsze”) | Pass |
| Sam measurement | 26, bez grupy marketing | Pass |
| Sam marketing | 12, bez grupy measurement | Pass |
| Obie zgody | 32 | Pass |

- Po measurement `first_touch_*` i `last_touch_*` mają źródło `qa-t21` i kampanię z URL. Po przejściu `/` → `/kontakt` jest `previous_page=/`, `current_page=/kontakt` i `session_page_count=2`. Pass.
- Po marketing wypełnione są `gclid`, `fbclid`, `li_fat_id` i `msclkid` z URL. `gbraid` i `wbraid` są puste, bo nie było ich w URL. Pass.
- `conversion_timestamp` jest pusty do chwili wysłania. W payloadzie ma wartość `21:13:46.773Z`, czyli moment submitu, a nie wejścia na stronę (`21:13:12`). Flagi zgody to `granted`/`granted`, `attribution_policy_id=zawlodzki_global_opt_in_v2`, `attribution_schema_version=1`. Pass.
- Payload `POST /api/form?form=main-contact` (multipart) ma 36 kluczy: 32 pola atrybucji, `email`, `phone`, `message` i `cf-turnstile-response`. Pass.
- TTL 90 dni, reset sesji po 30 minutach i rekordy wygasłe nie były testowane. Blocked, do dopisania w kolejnym przebiegu z ręcznie postarzonymi rekordami storage.

## Dostarczenie formularza

**Pass od 2026-11-09.**

Pierwsza próba 2026-11-08 dała 403. Worker `zawlodzki-web` nie miał wtedy żadnych sekretów, a build nie miał `PUBLIC_TURNSTILE_SITE_KEY`, więc `LeadForm.astro` użył testowego klucza Cloudflare `1x00000000000000000000AA` (pasek „Tylko do testowania”, token `XXXX.DUMMY.TOKEN.XXXX`).

Konfiguracja 2026-11-09, na polecenie użytkownika:

- Nowy widget Turnstile „zawlodzki.pl formularze”, tryb managed, hosty `zawlodzki.pl` (obejmuje `www`) i `zawlodzki-web.zawlodzki.workers.dev`. Klucz witryny jest publiczny: `0x4AAAAAAF5IqU8PTBfaBji9`.
- Sekrety Workera `TURNSTILE_SECRET_KEY` i `N8N_FORM_WEBHOOK`. Wartości nie są w repozytorium. Adres webhooka w `00-inventory/webflow-settings/SUMMARY.md` jest ucięty (`…/webhook/6710778b-...`), więc nie nadaje się do konfiguracji. Pełny adres podał użytkownik.
- Zmienna `PUBLIC_TURNSTILE_SITE_KEY` w Workers Builds (trigger na `main`, build `pnpm --filter web build`), potem nowy build.

Wynik:

- Bez prawdziwego widgetu Turnstile przeglądarka sterowana przez narzędzia (chrome-devtools, panel aplikacji) dostaje interaktywne wyzwanie albo błąd `600010`. To zachowanie antybotowe Cloudflare, nie błąd konfiguracji. Błędny host dałby `110200`. Zrzut: `02-turnstile-live-key.png`.
- Wysyłka z Chrome użytkownika z poprawnym webhookiem: przekierowanie na `/podziekowanie-konsultacja` i udane wykonanie w n8n z `qa-t21@example.com`. Potwierdził to użytkownik.
- Wcześniejsza próba z uciętym webhookiem dała 502 i komunikat „Nie udało się wysłać formularza”. Ścieżka błędu klienta działa.

**Przed cutoverem (T22):** zmienna buildu i sekrety obowiązują dla Workera `zawlodzki-web`. Jeśli produkcja będzie innym Workerem albo innym triggerem buildu, trzeba je przenieść. Widget obejmuje już `zawlodzki.pl`.

## Cofnięcie zgody

Sesja `t21-full`: najpierw cofnięty measurement, potem marketing, oba przez „Zarządzaj zgodami” w stopce.

| Punkt | Wynik | Stan rzeczywisty |
|---|---|---|
| Cofnięcie measurement przeładowuje stronę i zachowuje odmowę | Pass | Po przeładowaniu `analytics_storage=denied`, a Clarity, Albacross i Leadfeeder się nie ładują |
| Usunięcie `_ga*`, `_gid`, `_gat*`, `_clck`, `_clsk`, `nQ_*`, `_lfa*` | **Fail** | Zostały `_ga`, `_ga_FPQCV0H550`, `nQ_cookieId` i `nQ_userVisitId` |
| Usunięcie `zaw_attribution_measurement_v1` i sesji atrybucji | Pass | Klucze zniknęły. Formularz ma 12 pól i nie odtwarza measurement |
| Cofnięcie marketing: przeładowanie, sygnały reklamowe denied, tagi zatrzymane | Pass | Meta i Ads się nie ładują. Formularz ma 6 pól |
| Usunięcie `_gcl*`, `_fbp`, `_fbc`, `zaw_attribution_marketing_v1`, `_gcl_ls` | **Fail** dla cookies, pass dla storage | Klucze `localStorage` zniknęły, łącznie z `lastExternalReferrer*`. Zostały cookies `_gcl_aw`, `_gcl_au`, `_fbp`, `_fbc` |
| Brak starych click ID w payloadzie | Pass | Po cofnięciu formularz ma tylko 6 pól |
| Ponowne otwarcie | Pass | Nowa karta: stan denied, nowy `gclid` z URL się nie zapisał |

Przyczyny, ustalone z kodu loadera i z dat ważności cookies:

- **Domena `workers.dev` (tylko staging).** GA i Google Ads ustawiają cookies na `zawlodzki.workers.dev`. Lista domen czyszczenia w loaderze (`g5()`) to host, `.host` oraz `zawlodzki.pl` i `zawlodzki.com` z kropką i bez. `zawlodzki.workers.dev` na niej nie ma, więc tych cookies nie da się usunąć ze stagingu. Na `www.zawlodzki.pl` GA używa `.zawlodzki.pl`, które jest na liście. To artefakt stagingu, a nie dowód błędu na produkcji.
- **Ponowny zapis po czyszczeniu (prawdopodobnie także produkcja).** Czyszczenie działa w `onBeforeConsentRevocationReload`, tuż przed `location.reload()`. `nQ_userVisitId` (host-only) dostał ważność 30 minut od chwili cofnięcia, a `nQ_cookieId` 365 dni od tej chwili. Ręczne `document.cookie` z wygaśnięciem usuwa `nQ_*` od razu. Wniosek: Albacross zapisał cookies ponownie w starym dokumencie, po czyszczeniu i przed przeładowaniem. Tak samo `_fbp` i `_fbc` przy cofnięciu marketing dostały znacznik czasu z chwili cofnięcia. Przy drugim cofnięciu `nQ_cookieId` zniknął, bo Albacross już się nie ładował.

Ten sam loader i ten sam kontener GTM działają na produkcji. Nie da się tego naprawić w `apps/web`. Poprawka należy do loadera c15t: na przykład wyłączyć `fbq`/Albacross przed czyszczeniem albo ponowić czyszczenie po przeładowaniu, gdy kategoria jest `false`. Loader to zewnętrzny system, tylko do odczytu w tej migracji. Zalecany krok to ten sam test na `https://www.zawlodzki.pl` po osobnej zgodzie użytkownika (zapisuje zgodę w produkcyjnym c15t i wysyła odsłony). To potwierdzi, czy różnica jest regresją migracji, czy istniejącym zachowaniem.

## Wznowienie

1. Decyzja użytkownika co do ponownego zapisu cookies po cofnięciu: test porównawczy na produkcji i zgłoszenie do loadera c15t albo świadoma akceptacja.
2. Opcjonalnie: TTL i rekordy wygasłe przez postarzone wpisy storage, statusy Tag Assistant w profilu z kontem Google.

## Przebieg 2026-10-23 (nieaktualny)

Staging nie miał wtedy loadera zgód ani GTM, bo `Base.astro` ich nie emitował. Naprawiło to T26 (loader w `<head>`), zmergowane przed tym przebiegiem. Wnioski z 2026-10-23 o braku inline Consent Mode, loadera i `[data-c15t-open]` są nieaktualne.

## Przebieg 2026-10-22: origin c15t

Ta zmiana jest nadal aktualna. Użytkownik zezwolił na dopisanie `https://zawlodzki-web.zawlodzki.workers.dev` do `trustedOrigins` i `legacyOrigins` na VPS, bez wildcardu i bez localhost. Obraz `zawlodzki/c15t:2.3.0-t21-origin-20261022`. Kopia do cofnięcia jest na VPS pod `/opt/stacks/update-backups/20261022T183233Z-t21-c15t-origin`.

Odczyty `/api/c15t/init` po zmianie zwracały 200 z dokładnym ACAO dla stagingu, `www` i apex. Obcy origin zostawał na 403. Powstały wtedy syntetyczne podmioty, których nie usuwano. Przebieg 2026-11-08 dopisał kolejne zapisy zgód z izolowanych kontekstów (`POST /api/c15t/subjects` 200).
