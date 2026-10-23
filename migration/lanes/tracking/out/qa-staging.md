# T21. Wyniki QA zgód na stagingu

Stan z 2026-10-22, odczyty i testy od 18:29 do 18:35 UTC. Wynik całego zadania jest **blocked**. API c15t działa dla stagingu po zatwierdzonej zmianie. Wdrożona witryna nadal pokazuje szkielet bez integracji CMP i formularza.

## Zgoda i zakres zmiany

Użytkownik zezwolił w tej sesji na zmianę konfiguracji c15t, dopuszczenie originu i aktywne QA. Dopisano wyłącznie `https://zawlodzki-web.zawlodzki.workers.dev` do `trustedOrigins` w `src/server/c15t.ts` i `legacyOrigins` w `src/server/consent-router.ts` instancji VPS. Nie dodano wildcardu ani localhost.

Źródło konfiguracji na VPS znajduje się w `/opt/stacks/c15t`. Tę samą zmianę zapisano w lokalnym katalogu projektu VPS wskazanym przez użytkownika. Sekrety pozostały poza publicznym repozytorium.

Zbudowano obraz `zawlodzki/c15t:2.3.0-t21-origin-20261022`, ustawiono go jako `C15T_IMAGE` i odtworzono wyłącznie backend przez `docker compose up -d --no-deps backend`. Build TypeScript i widgetu oraz `docker compose config --quiet` zakończyły się powodzeniem. Kontener backendu ma status healthy. PostgreSQL działa bez restartu.

Kopia źródeł, Compose i poprzedniego `.env` pozostaje wyłącznie na VPS pod `/opt/stacks/update-backups/20261022T183233Z-t21-c15t-origin`. Cofnięcie wymaga przywrócenia obu plików źródłowych i `.env` z tej kopii oraz odtworzenia samego backendu. Poprzedni obraz zachowano.

## Odczyty HTTP

Żądania do `/api/c15t/init` miały unikalny parametr `t21` i `Cache-Control: no-cache`. Nie zapisano tokenów odpowiedzi w raporcie.

| Origin | Przed zmianą | Po zmianie | Access-Control-Allow-Origin po zmianie |
|---|---|---|---|
| `https://zawlodzki-web.zawlodzki.workers.dev` | 403, brak ACAO | 200 | Dokładnie origin stagingu |
| `https://www.zawlodzki.pl` | 200 | 200 | Dokładnie origin www |
| `https://zawlodzki.pl` | Nie badano | 200 | Dokładnie origin apex |
| `https://invalid.example` | 403, brak ACAO | 403 | Brak |

Odpowiedzi po zmianie miały `CF-Cache-Status: DYNAMIC`. Odczyty dowodzą działania HTTP, nie zachowania przeglądarki.

## Aktywny test API

Wykonano rzeczywiste żądania HTTPS z originem stagingu. `OPTIONS /api/c15t/subjects` dla POST z `content-type` zwróciło 204 z pasującym ACAO. Każdy POST miał pasujący ACAO. Nagłówków odczytu GET nie objęto asercją.

| Stan | POST `/subjects` | GET `/subjects/<syntetyczny podmiot>` | Zgodność preferencji |
|---|---|---|---|
| Odmowa obu kategorii | 200 | 200 | Pass |
| Tylko measurement | 200 | 200 | Pass |
| Tylko marketing | 200 | 200 | Pass |
| Obie kategorie | 200 | 200 | Pass |
| Cofnięcie obu kategorii | 200 | 200 | Pass |

Odczyt c15t pomija kategorie denied. Porównanie traktowało brak kategorii jako false. Test używał syntetycznych identyfikatorów i domeny stagingu, bez danych kontaktowych. Powstały trzy syntetyczne podmioty. Dwie próby zakończyły się po pierwszym zapisie podczas dopasowania asercji do formatu odpowiedzi. Trzecia przeszła całą macierz. Rekordy pozostały zgodnie z normalną retencją dowodów. Nie usuwano danych.

Poniżej zanonimizowane wyjście zakończonego testu sesji. Skrypt roboczy `/tmp/t21-consent-api.py` nie jest trwałym narzędziem repozytorium. Ponowienie pełnego QA wymaga nowego wykonania, w tym testów przeglądarkowych.

```text
preflight 204 matching ACAO
denied POST 200 GET 200 preferences match
measurement POST 200 GET 200 preferences match
marketing POST 200 GET 200 preferences match
both POST 200 GET 200 preferences match
revoked POST 200 GET 200 preferences match
```

Pierwszy odczyt klientem Python otrzymał 403 przed zapisem. Udany test wykonano przez curl. Nie ustalono przyczyny różnicy klientów.

## Blokada pełnej checklisty

Sprawdzono wdrożony Worker `https://zawlodzki-web.zawlodzki.workers.dev`, zgodnie z dopuszczoną w verify-web ścieżką odczytu stagingu.

| Przypadek | Wynik | Dowód |
|---|---|---|
| GET `/` | 200 | `content-type: text/html`, `x-robots-tag: noindex, nofollow`, title i h1 `Grzegorz Zawłodzki`, meta robots `noindex` |
| Widok w przeglądarce | Szkielet | Tekst `Nowa wersja strony w budowie.`, bez kontrolek |
| Inicjalizacja CMP i GTM | Fail | HTML zawiera zero elementów script. Brak `zawlodzki-consent-default` i loadera `consent.zawlodzki.com/assets/cmp-v1.js` |
| Otwieranie preferencji | Fail | Brak `[data-c15t-open]` |
| GET `/kontakt` | 404 | Brak dostępnego formularza na ścieżce keep |
| 11 tagów w Tag Assistant i brak duplikatów | Blocked | Brak wdrożonej integracji GTM |
| Cztery stany zgód w UI, ponowne wejście i cofnięcie | Blocked | Brak wdrożonego CMP. Test API nie zastępuje testu UI |
| Czyszczenie cookies i storage | Blocked | Brak wdrożonej integracji |
| 32 pola, TTL atrybucji, Turnstile i test dostarczenia | Blocked | Brak dostępnego formularza i atrybucji |

Zrzut widoku zapisano lokalnie jako `/tmp/t21-staging.png`. Odczytany HTML i nagłówki zachowano lokalnie w `/tmp/t21-staging.html` i `/tmp/t21-staging.headers`. Są to pliki sesji, nie trwałe załączniki PR. Nie publikowano HAR, tokenów, identyfikatorów podmiotów ani danych cookies. Nie wykonano formularza ani wysyłki do n8n.

## Wznowienie

1. Wdrożyć na staging obecną implementację witryny z integracją CMP, GTM i formularza po wymaganej zgodzie na publikację. Zmiana backendu c15t nie wdraża witryny.
2. Powtórzyć kontrolę originów i preflight w przeglądarce.
3. Wykonać całą checklistę `consent-qa.md` na stronie głównej, usługowej i formularzu, z Tag Assistant i zanonimizowanymi zrzutami każdego przypadku.
4. Wysłać formularz wyłącznie do lokalnego mocka lub zatwierdzonego testowego workflow n8n.
5. Dopiero po komplecie dowodów oznaczyć kryterium T21 jako zaliczone.
