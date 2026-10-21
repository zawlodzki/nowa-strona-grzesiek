# Sprawdź zgody, GTM i atrybucję na stagingu

T06. Checklista dla operatora QA i autora formularzy. Oczekiwania wynikają ze snapshotu z 2026-10-21, nie z wykonanego testu stagingu. Wykonanie zapisuje zgody w zewnętrznym c15t i może wysyłać zdarzenia do usług pomiarowych. Przed takim testem uzyskaj zgodę użytkownika. T06 wykonało wyłącznie odczyty HTTP i analizę plików.

## Przygotuj sesję

1. Dopuść staging według [instrukcji originów](c15t-origins.md).
2. Otwórz staging w nowym profilu przeglądarki bez rozszerzeń blokujących skrypty.
3. Otwórz DevTools Network, Application i Tag Assistant. Zachowaj log przy przeładowaniu strony.
4. Użyj testowych danych formularza. Nie zapisuj prawdziwych identyfikatorów kliknięć w raporcie.
5. Powtórz przypadki na stronie głównej, podstronie usługowej i stronie formularza po ich wdrożeniu. Obecny szkielet T02 nie dowodzi integracji CMP.
6. Oddziel sesje odmowy, samego pomiaru, samego marketingu i pełnej zgody. Czyść dane wyłącznie własnego testowego profilu.

Zgoda produkcji nie przenosi się automatycznie na staging. Loader ustawia `crossSubdomain: false` i klucz `zawlodzki-consent`. Snapshot wskazuje ważność 365 dni. Zapisz czas testu, origin, stronę, wersję aplikacji i opublikowaną wersję GTM. Snapshot GTM ma wersję 54. Jeśli wersja się zmieniła, porównaj ustawienia przed użyciem tabeli.

## Sprawdź kolejność inicjalizacji

- [ ] W źródle HTML przed loaderem CMP i przed GTM istnieje inline `#zawlodzki-consent-default`.
- [ ] Domyślne `security_storage` ma wartość `granted`.
- [ ] Domyślne `analytics_storage`, `ad_storage`, `ad_user_data` i `ad_personalization` mają wartość `denied`.
- [ ] Loader pochodzi z `https://consent.zawlodzki.com/assets/cmp-v1.js`. Ładuje się raz. Nie dodano drugiego snippetu GTM.
- [ ] API `/api/c15t/init` działa z originu stagingu. Network nie pokazuje błędu CORS.
- [ ] GTM uruchamia się jako skrypt `necessary` z `alwaysLoad`, także przed wyborem użytkownika.
- [ ] `window.__zawlodzkiConsentState` początkowo ma `necessary: true`, `measurement: false`, `marketing: false`.
- [ ] Zmiana preferencji najpierw aktualizuje Consent Mode, a potem emituje `consent-update`.

Loader wywołuje `gtag('event', 'consent-update')`. Jego mostek `dataLayer.push` dodaje również obiekt z `event: 'consent-update'`, `c15t_consent_update`, stanami kategorii, polityką i wersją schematu. Sprawdź rzeczywisty obiekt w dataLayer i wywołania w Tag Assistant. Powtórne wywołanie skryptu przez All Pages i zmianę zgody nie może tworzyć niezamierzonych duplikatów inicjalizacji, odsłon ani listenerów.

Mapowanie kategorii w loaderze jest następujące.

| Kategoria | Sygnały Consent Mode |
|---|---|
| `necessary` | `security_storage` |
| `measurement` | `analytics_storage` |
| `marketing` | `ad_storage`, `ad_user_data`, `ad_personalization` |

Stan `marketing` w `__zawlodzkiConsentState` jest prawdziwy tylko wtedy, gdy wszystkie trzy sygnały reklamowe są `granted`.

## Sprawdź wszystkie 11 tagów

Nazwy poniżej pochodzą z `gtm/tags.csv`. Mapowanie trzech tagów Attribution do kodu jest wnioskowane. Mapowanie dwóch nazw Leadfeeder do konkretnych skryptów pozostaje niepewne. Sprawdź obie pozycje w Tag Assistant, bez usuwania którejkolwiek w ramach migracji.

| Tag | Wyzwalacz | Przed zgodą i przy odmowie | Po samej zgodzie measurement | Po samej zgodzie marketing | Po obu zgodach |
|---|---|---|---|---|---|
| Tag łączący konwersje | All Pages | Uruchamia się, wbudowany Consent Mode ogranicza działanie | Uruchamia się, reklamy nadal denied | Uruchamia się z reklamami granted | Uruchamia się |
| Microsoft Clarity konfiguracja | All Pages + consent-update | Blokada analytics_storage | Dopuszczony | Zablokowany | Dopuszczony |
| Google Analytics konfiguracja GA4 | All Pages | Uruchamia się w stanie analytics denied | Analytics granted | Analytics denied | Analytics granted |
| Google Ads konfiguracja | Initialization | Uruchamia się w stanie reklam denied | Reklamy denied | Reklamy granted | Reklamy granted |
| Meta piksel | All Pages + consent-update | Blokada trzech sygnałów reklamowych | Zablokowany | Dopuszczony | Dopuszczony |
| Albacross konfiguracja | All Pages + consent-update | Blokada analytics_storage | Dopuszczony | Zablokowany | Dopuszczony |
| Attribution — formularz i cleanup (inferred mapping) | All Pages + consent-update | Uruchamia się, usuwa pola i dane bez zgody | Wypełnia grupę measurement | Wypełnia grupę marketing | Wypełnia obie grupy |
| Attribution — measurement (inferred mapping) | All Pages + consent-update | Blokada analytics_storage | Dopuszczony | Zablokowany | Dopuszczony |
| Attribution — marketing click IDs (inferred mapping) | All Pages + consent-update | Blokada ad_storage i ad_user_data, kod wymaga marketing=true | Zablokowany | Dopuszczony | Dopuszczony |
| Leadfeeder konfiguracja OR Leadfeeder(Pipedrive) konfiguracja (mapping uncertain) | All Pages + consent-update | Blokada analytics_storage | Dopuszczony | Zablokowany | Dopuszczony |
| Leadfeeder(Pipedrive) konfiguracja OR Leadfeeder konfiguracja (mapping uncertain) | All Pages + consent-update | Blokada analytics_storage | Dopuszczony | Zablokowany | Dopuszczony |

"Dopuszczony" oznacza spełnienie warunku zgody, nie dowód wysłania zdarzenia. Tylko osiem tagów ma wyzwalacz `consent-update`. Google Ads, GA4 i Conversion Linker nie mają dodatkowych blokad GTM i korzystają z wbudowanego Consent Mode. Mogą wysyłać żądania bez cookies przy odmowie. Sam status Fired ani obecność żądania Google nie dowodzą błędu. Sprawdź stan zgód, cookies i parametry żądania. Nie wymagaj ponownego wyzwolenia tych trzech tagów na `consent-update`.

Dla każdego z czterech stanów zgody:

- [ ] Porównaj Fired i Not fired wszystkich pozycji z tabelą.
- [ ] Sprawdź rzeczywiste żądania dostawców i brak niezamierzonych duplikatów.
- [ ] Przy odmowie sprawdź brak opcjonalnych cookies i trwałej atrybucji.
- [ ] Po zgodzie sprawdź wyłącznie dozwolone kategorie danych.
- [ ] Odśwież stronę. Potwierdź zachowanie preferencji i właściwy stan jeszcze przed uruchomieniem tagów.
- [ ] Otwórz preferencje elementem `[data-c15t-open]`. Potwierdź, że dialog działa z klawiatury.

## Sprawdź kontrakt 32 pól formularza

Formularz musi mieć `name` albo `data-name`. Skrypt ignoruje ścieżki zaczynające się od `/style-guide/`. Wysłanie formularza uruchamia uzupełnienie w fazie capture. Sprawdź dane bezpośrednio przed serializacją i rzeczywisty payload żądania do lokalnego `/api/form`.

| Grupa | Liczba | Dokładne nazwy pól |
|---|---|---|
| Zawsze | 6 | `form_name`, `conversion_timestamp`, `attribution_measurement_consent`, `attribution_marketing_consent`, `attribution_policy_id`, `attribution_schema_version` |
| Measurement, first touch | 7 | `first_touch_source`, `first_touch_medium`, `first_touch_campaign`, `first_touch_content`, `first_touch_landing_page`, `first_touch_referrer_domain`, `first_touch_timestamp` |
| Measurement, last touch | 7 | `last_touch_source`, `last_touch_medium`, `last_touch_campaign`, `last_touch_content`, `last_touch_landing_page`, `last_touch_referrer_domain`, `last_touch_timestamp` |
| Measurement, kontekst | 6 | `utm_id`, `utm_term`, `previous_page`, `current_page`, `cta_id`, `session_page_count` |
| Marketing | 6 | `gclid`, `gbraid`, `wbraid`, `msclkid`, `fbclid`, `li_fat_id` |

32 to liczba nazw w kontrakcie. W obecnym tagu brak zgody usuwa odpowiednie ukryte inputy, zamiast jedynie czyścić ich wartości. Przy odmowie obu kategorii pozostaje sześć pól atrybucji. Przy samym measurement jest ich 26, przy samym marketing 12, a przy obu zgodach 32. Nie licz pól kontaktowych, Turnstile ani innych inputów jako atrybucji.

Wymóg migracji zachowuje wszystkie 32 nazwy po stronie formularza i endpointu. T14 musi obsługiwać brak pól wyłączonej kategorii bez odtwarzania danych z wcześniejszej zgody. Jeżeli formularz wysyła stały zestaw 32 kluczy, wartości wyłączonych grup muszą być puste. Ta różnica względem legacy wymaga udokumentowania w QA T14. Nie zmieniaj publicznego kontraktu w T06.

- [ ] Otwórz stronę z testowymi UTM i syntetycznymi click ID. Przy odmowie potwierdź brak ich utrwalenia i przesłania.
- [ ] Po measurement sprawdź first touch, last touch, kontekst strony i aktualizację po przejściu wewnętrznym.
- [ ] Po marketing sprawdź wyłącznie sześć pól marketingowych, przy nadal pustej lub nieobecnej grupie measurement.
- [ ] Sprawdź, że `conversion_timestamp` i flagi zgody odpowiadają chwili wysłania, a nie chwili załadowania strony.
- [ ] Sprawdź zgodność `attribution_policy_id` ze stanem CMP oraz wersję schematu `1`.
- [ ] Sprawdź przeładowanie i nową sesję. Kod measurement ma 90-dniowy okres ważności i reset sesji po 30 minutach bezczynności.
- [ ] Sprawdź wygasłe dane przez testowe rekordy storage w profilu QA. Marketing ma 90 dni, a `li_fat_id` 30 dni. Nie czekaj na upływ tego okresu.
- [ ] Po integracji T14 sprawdź przejście przez Turnstile i dostarczenie testowej wiadomości do n8n po osobnej zgodzie. Adres webhooka pozostaje wyłącznie sekretem Workera.

## Sprawdź cofnięcie zgody

- [ ] Po pełnej zgodzie cofnij measurement. Potwierdź przeładowanie i zachowanie odmowy po przeładowaniu.
- [ ] Sprawdź usunięcie cookies pasujących do `_ga*`, `_gid`, `_gat*`, `_clck`, `_clsk`, `nQ_*` i `_lfa*`.
- [ ] Sprawdź usunięcie `zaw_attribution_measurement_v1`, danych sesji atrybucji i `lastExternalReferrer*`. Potwierdź brak odtworzenia pól measurement z pamięci.
- [ ] Cofnij marketing. Sprawdź przeładowanie, reklamowe sygnały denied i zatrzymanie tagów wymagających tej zgody.
- [ ] Sprawdź usunięcie `_gcl*`, `_fbp`, `_fbc`, `zaw_attribution_marketing_v1` i `_gcl_ls`. Potwierdź brak starych click ID w payloadzie.
- [ ] Powtórz cofnięcie obu kategorii oraz zamknięcie i ponowne otwarcie przeglądarki.

Loader czyści dane przed przeładowaniem po cofnięciu zgody. Ta ścieżka może pominąć zwykłe zdarzenie `consent-update` w tym samym dokumencie. Weryfikuj zachowany stan denied i brak danych po przeładowaniu. Nie uznawaj braku zdarzenia przed reloadem za samodzielny dowód awarii. Dane sesji atrybucji usuwa także tag formularza po uruchomieniu.

## Zapisz wynik bramki

Dla każdego przypadku zapisz wynik pass, fail albo blocked, oczekiwany i rzeczywisty stan oraz zanonimizowany dowód z Tag Assistant, Network i formularza. Nie publikuj tokenów, pełnych HAR, wartości cookies, click ID, danych osobowych ani adresów webhooków. Stosuj tylko nazwy tagów i pól oraz statusy HTTP.

G3 może przejść dopiero po zaliczeniu macierzy zgód, ponownego wejścia, cofnięcia i formularza. Błąd CORS, niewypełnione pola, niepewne mapowanie tagów bez sprawdzenia UI lub brak zintegrowanego formularza oznacza blocked. T06 nie oznacza tych przypadków jako zaliczone.

## Źródła oczekiwań

Wszystkie poniższe pliki pozostają w prywatnej inwentaryzacji:

- `migration/00-inventory/gtm/tags.csv` i `published-container-v54.json` określają tagi, wyzwalacze i dodatkowe zgody.
- `migration/00-inventory/gtm/custom-html/tag_69.html`, `tag_70.html` i `tag_73.html` określają wypełnianie formularzy, pomiar i click ID.
- `migration/00-inventory/live-site/html/index.html` zawiera inline defaults i ukryte pola.
- `migration/00-inventory/live-site/third-party-raw/cmp-v1.js` określa mapowanie sygnałów, mostek dataLayer i cofnięcie zgody.

To analiza źródeł. Zachowanie przeglądarki i dostarczenie formularza trzeba potwierdzić po wdrożeniu integracji.
