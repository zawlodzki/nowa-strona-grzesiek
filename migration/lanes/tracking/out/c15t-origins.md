# Dopuść staging w backendzie c15t

T06. Stan sprawdzony 2026-10-21. Instrukcja dla właściciela backendu. T06 nie zmienia konfiguracji, DNS ani wdrożenia.

## Ustal miejsce zmiany

Publiczny loader `https://consent.zawlodzki.com/assets/cmp-v1.js` używa backendu `https://consent.zawlodzki.com/api/c15t` w trybie `hosted`. Snapshot nagłówków i ponowny odczyt `/init` wskazują Cloudflare przed Caddy. To potwierdza warstwy proxy, nie dostawcę serwera, kontener, repozytorium ani ścieżkę konfiguracji. Publiczne dowody nie pozwalają ustalić tych ostatnich informacji.

[Dokumentacja integracji c15t](https://github.com/c15t/c15t/blob/canary/docs/self-host/guides/framework-integration.mdx) opisuje listę `trustedOrigins` w konfiguracji backendu. [Quickstart backendu](https://c15t.com/docs/self-host/quickstart) pokazuje konfigurację w `c15t-backend.config.ts`. To przykłady dla aktualnej biblioteki, nie dowód nazwy pliku ani wersji wdrożonego backendu.

1. Otwórz prywatne repozytorium lub panel wdrożenia obsługujący `consent.zawlodzki.com`.
2. Ustal usługę, do której Caddy przekazuje `/api/c15t`, i wersję pakietu backendu.
3. Znajdź `trustedOrigins` w konfiguracji instancji backendu, jej pliku konfiguracyjnym albo źródle zmiennych środowiskowych.
4. Jeżeli istnieje osobny handler edge, sprawdź także jego konfigurację originów. [Dokumentacja edge](https://c15t.com/docs/self-host/guides/edge-deployment) wymaga zgodności konfiguracji z backendem.
5. Zapisz prywatnie nazwę usługi, ścieżkę konfiguracji i poprzednią wartość listy. Nie kopiuj konfiguracji, tokenów ani zmiennych środowiskowych do publicznego repozytorium.

Samo `Access-Control-Allow-Origin: *` dla pliku JavaScript nie dopuszcza klienta do API. Zmiana nagłówków pliku statycznego nie zastępuje konfiguracji backendu.

## Przygotuj listę originów

Origin zawiera protokół, host i port, jeżeli port jest niestandardowy. Nie zawiera ścieżki ani końcowego ukośnika. Dla używanej wersji c15t sprawdź reguły dopasowania. Nie zakładaj, że wpis z `https` wyklucza `http`, ani że wariant `www` wymaga osobnego wpisu.

| Origin wysyłany przez przeglądarkę | Rola | GET `/init`, bez cache |
|---|---|---|
| `https://www.zawlodzki.pl` | Produkcja kanoniczna, zachowaj | 200, ACAO odpowiada originowi |
| `https://zawlodzki.pl` | Apex, zachowaj obecną obsługę | 200, ACAO odpowiada originowi |
| `https://zawlodzki-web.zawlodzki.workers.dev` | Staging z T02, dodaj | 403, brak ACAO |
| `http://localhost:4321` | Opcjonalny lokalny QA | 403, brak ACAO |
| `https://invalid.example` | Kontrola odmowy, nie dodawaj | 403, brak ACAO |
| Brak nagłówka `Origin` | Kontrola odmowy | 403, brak ACAO |

ACAO oznacza `Access-Control-Allow-Origin`. Te wyniki pochodzą z odczytów 2026-10-21, nie z testu przeglądarki. Nie dodawaj wildcardu dla całego `workers.dev`. Dla preview dopuszczaj tylko konkretne originy wybrane do QA.

1. Zachowaj działające wpisy produkcji.
2. Dopisz staging w formacie obsługiwanym przez zainstalowaną wersję backendu.
3. Jeżeli testujesz lokalnie, dodaj osobno faktyczny origin z portem. Nie dodawaj localhost na zapas.
4. Przygotuj diff konfiguracji i sposób przywrócenia poprzedniej listy.
5. Uzyskaj od użytkownika zgodę na tę konkretną zmianę w c15t i ewentualne wdrożenie. Reguła repozytorium traktuje ten system jako tylko do odczytu.
6. Po zgodzie zastosuj zmianę i przeładuj wyłącznie właściwą usługę, jeżeli tego wymaga wdrożenie.
7. Wykonaj poniższy odczyt i [checklistę QA](consent-qa.md). Dopiero po sukcesie dopuść staging do bramki G3.

Nie zmieniaj nazwy odbiorcy tokenu tylko dlatego, że zawiera słowo Webflow. Snapshot wskazuje nazwę odbiorcy związaną z poprzednią stroną, ale nie dowodzi ograniczenia do tego frameworka. Zgodność musi potwierdzić test inicjalizacji i zapisu zgody po zatwierdzeniu QA. Nie publikuj tokenu snapshotu.

## Sprawdź API bez wypisywania treści odpowiedzi

Uruchom odczyt dla każdego originu z tabeli. Zmień tylko wartość `ORIGIN`.

```sh
ORIGIN='https://zawlodzki-web.zawlodzki.workers.dev'
curl --silent --show-error --output /dev/null --dump-header - \
  --header "Origin: $ORIGIN" --header 'Cache-Control: no-cache' \
  "https://consent.zawlodzki.com/api/c15t/init?t06=$(date +%s)" \
  | awk 'BEGIN {IGNORECASE=1} /^HTTP\/|^access-control-allow-origin:|^vary:|^cf-cache-status:|^via:/'
```

Dla braku originu pomiń `--header "Origin: $ORIGIN"`. Unikalny parametr zmienia klucz cache. Podczas T06 żądania bez parametru zwracały 403 nawet dla produkcji. Żądania z unikalnym parametrem zwracały 200 dla obu hostów produkcji i 403 dla pozostałych originów. Przyczyna wcześniejszych odpowiedzi 403 nie jest rozstrzygnięta. Nagłówki świeżych odpowiedzi zawierały `CF-Cache-Status: DYNAMIC` i `Via: 1.1 Caddy`.

Po zmianie staging musi zwracać 200 z pasującym ACAO. Kontrola `invalid.example` ma pozostać odrzucona. Jeśli przeglądarka wysyła preflight przed zapisem, sprawdź w Network odpowiedź `OPTIONS` dla faktycznej metody i nagłówków klienta. Sam sukces curl nie dowodzi działania CORS w przeglądarce ani zapisu zgody.

Jeżeli zapis zgody nie działa, zachowaj odmowę dla opcjonalnych kategorii i przerwij QA. Po zgodzie właściciela przywróć poprzednią listę, przeładuj usługę i powtórz odczyt produkcji. Nie zmieniaj GTM jako obejścia błędu c15t.

## Dowody i ograniczenia

Prywatne źródła lokalne, nieprzeznaczone do publikacji:

- `migration/00-inventory/live-site/third-party.md` i `third-party-raw/cmp-v1.headers.txt` potwierdzają warstwy proxy.
- `migration/00-inventory/live-site/third-party-raw/cmp-v1.js` wskazuje adres API i ustawienia klienta.
- `migration/00-inventory/live-site/third-party-raw/c15t-init.json` dokumentuje snapshot polityki. Nie kopiuj jego treści do raportów.
- `migration/tasks/T02.md` wskazuje rzeczywisty origin stagingu.

T06 dostarcza procedurę. Nie ustala niepublicznej lokalizacji usługi i nie potwierdza jeszcze dopuszczenia stagingu. Właściciel backendu musi wykonać opisane kroki po zgodzie użytkownika.

## Zakres odbioru po zmianie originów

Sprawdź w [macierzy QA](consent-qa.md) każdą pozycję z `gtm/tags.csv`:

- Tag łączący konwersje.
- Microsoft Clarity konfiguracja.
- Google Analytics konfiguracja GA4.
- Google Ads konfiguracja.
- Meta piksel.
- Albacross konfiguracja.
- Attribution — formularz i cleanup (inferred mapping).
- Attribution — measurement (inferred mapping).
- Attribution — marketing click IDs (inferred mapping).
- Leadfeeder konfiguracja OR Leadfeeder(Pipedrive) konfiguracja (mapping uncertain).
- Leadfeeder(Pipedrive) konfiguracja OR Leadfeeder konfiguracja (mapping uncertain).

Niepewności nazw pochodzą ze snapshotu. Dodanie originu nie rozstrzyga mapowania dwóch tagów Leadfeeder ani nie zmienia ich konfiguracji.
