"""Rebuild copy verdicts and current CTA tables from the saved public observations."""
import collections
import json
import re
from pathlib import Path
ROOT = Path(__file__).resolve().parent
facts = json.loads((ROOT / 'facts.json').read_text())['facts']

def is_cta(a):
    target = str(a['target'])
    classes = str(a['class']).split()
    return bool(a['text']) and (a['target'] == 'submit' or target.startswith(('mailto:', 'tel:')) or a['target'] in ['/kontakt', '/newsletter', '/sales-atlas-system'] or 'checkout' in target or 'cal.com' in target or 'action' in classes or 'cta' in classes or a['text'] == 'Wróć na stronę główną')

changes = {
 'Umów audyt AI': ('Umów rozmowę o audycie AI', 'Kontakt rozpoczyna rozmowę, nie rezerwację płatnego audytu.'),
 'Umów audyt Pipedrive': ('Umów rozmowę o audycie Pipedrive', 'Najpierw trzeba omówić potrzeby i zakres audytu.'),
 'Umów audyt Asany': ('Umów rozmowę o audycie Asany', 'Kliknięcie otwiera kontakt, nie zamówienie audytu.'),
 'Umów audyt sprzedaży': ('Umów rozmowę o audycie sprzedaży', 'Nie sugerować podjęcia decyzji o zakupie audytu.'),
 'Umów diagnozę': ('Umów rozmowę o diagnozie CRM', 'Na tym etapie użytkownik pyta o diagnozę, a nie ją kupuje.'),
 'Zapisz się na pierwszą grupę': ('Zapytaj o udział w programie', 'Kontakt nie zapisuje do grupy. Nie powielać niepotwierdzonego terminu.'),
 'Zacznijmy współpracę': ('Porozmawiajmy o współpracy', 'Najpierw odbywa się rozmowa, przed decyzją o współpracy.'),
 'Sprawdźmy, co jest zepsute': ('Porozmawiajmy o problemach z Pipedrive', 'Formularz otwiera rozmowę, nie wykonuje diagnozy.'),
 'Sprawdźmy, gdzie utykają projekty': ('Porozmawiajmy o Waszych projektach', 'Nie obiecywać rozpoczęcia analizy po kliknięciu.'),
 'Sprawdźmy, gdzie jest blokada': ('Porozmawiajmy o problemach w sprzedaży', 'To zaproszenie do rozmowy przed audytem.'),
 'Sprawdź, co da się uprościć': ('Porozmawiajmy o automatyzacji', 'Cel nie jest samoobsługowym testem, tylko stroną kontaktową.'),
 'Wskaż swój powtarzalny proces': ('Opisz proces, o którym chcesz porozmawiać', 'Wyjaśnia, po co użytkownik ma opisać proces w formularzu.'),
 'Policzmy, ile czasu to zjada': ('Porozmawiajmy o ręcznej pracy w CRM', 'Nie sugeruje kalkulatora ani wyceny dostępnej po kliknięciu.'),
 'Ustalmy zakres i cenę': ('Porozmawiajmy o zakresie i cenie', 'Rozmowa nie zobowiązuje do uzgodnienia oferty.'),
 'Poleć klienta': ('Zapytaj o polecenie klienta', 'Strona kontaktu nie wykonuje formalnego polecenia.'),
 'Dowiedz się więcej o pipedrive.com': ('Zobacz ofertę wdrożenia Pipedrive', 'Link otwiera ofertę konsultanta, nie stronę producenta.'),
 'Dowiedz się więcej o asana.com': ('Zobacz ofertę wdrożenia Asany', 'Link otwiera usługę, nie domenę Asany.'),
 'umówić 30 minut rozmowy': ('umówić bezpłatną konsultację', 'Usuwa rozbieżną długość rozmowy, zachowując składnię zdania.'),
 'umów 30 minut rozmowy': ('umów bezpłatną konsultację', 'Nie utrwala nieuzgodnionego czasu rozmowy.'),
}

def verdict(text, target, current_path):
    if text == 'Zacznijmy wdrożenie':
        if target == '/wdrozenie-ai-w-sprzedazy-b2b':
            return ('change', 'Zobacz ofertę wdrożenia AI', 'Kliknięcie pokazuje ofertę. Nie rozpoczyna wdrożenia ani rozmowy.')
        return ('change', 'Umów rozmowę o wdrożeniu AI' if target == '/kontakt' and current_path == '/wdrozenie-ai-w-sprzedazy-b2b' else 'Umów rozmowę o wdrożeniu', 'Pierwszym krokiem jest kontakt, nie decyzja o realizacji projektu.')
    if text in changes:
        replacement, reason = changes[text]
        return ('change', replacement, reason)
    if text == 'Kup w przedsprzedaży':
        return ('ok', text, 'Rzeczywisty cel to checkout. Nie maskować zakupu jako rozmowy. Zachować tylko po potwierdzeniu aktywnej przedsprzedaży.')
    if text == 'Zapisuję się':
        return ('ok', text, 'Przycisk wysyła formularz zapisu. Sąsiedni nagłówek wyjaśnia, że chodzi o newsletter.')
    if text == 'Wyślij zapytanie':
        return ('ok', text, 'Formularz wysyła zapytanie, bez zamawiania usługi.')
    if str(target).startswith(('mailto:', 'tel:')):
        return ('ok', text, 'Adres lub numer jasno wskazuje bezpośredni kanał kontaktu.')
    if 'cal.com' in str(target):
        return ('ok', text, 'Otwiera kalendarz, w którym dopiero wybiera się termin.')
    if target in ['/kontakt']:
        return ('ok', text, 'W kontekście sekcji zaprasza do kontaktu lub pytania, bez decyzji o zakupie.')
    return ('ok', text, 'Nazywa oglądanie treści lub przejście do kolejnego widoku, bez dużego zobowiązania.')

s = (ROOT / 'README.md').read_text()
# Include pricing buttons too: their class is cta rather than action.
for row in facts:
    ac = [a for a in row['staging']['actions'] if is_cta(a)]
    table = 'Obecne CTA w treści:\n\n| Etykieta | Cel | Pozycja y |\n| --- | --- | --- |\n'
    for a in ac:
        table += f"| {a['text'].replace('|', '/')} | `{a['target']}` | {a['y']} px |\n"
    if not ac:
        table += '| Brak wezwań sprzedażowych | — | — |\n'
    start = s.index('### `' + row['path'] + '`')
    end = s.find('\n### ', start + 1)
    if end == -1:
        end = len(s)
    chunk = s[start:end]
    chunk = re.sub(r'Obecne CTA w treści:.*?(?=\nNajdłuższy)', table, chunk, flags=re.S)
    points = sorted(set([0, row['staging']['height']] + [a['y'] for a in ac]))
    a,b = max(zip(points, points[1:]), key=lambda ab: ab[1]-ab[0])
    chunk = re.sub(r'Najdłuższy odcinek bez powyższych CTA:.*?\n\nPorównanie', f'Najdłuższy odcinek bez powyższych CTA: y={a}–{b} px, około {(b-a)/900:.1f} ekranu. Nagłówki i pozycje sekcji w facts.json.\n\nPorównanie', chunk, flags=re.S)
    s = s[:start] + chunk + s[end:]

section = '''## Teksty istniejących CTA

CTA nazywa rzeczywisty następny krok i wymaga tylko takiego zobowiązania, jakie wynika z celu linku. "Bezpłatna konsultacja" oraz "Umów rozmowę o wdrożeniu AI" są poprawne. Kontakt poprzedza decyzję o zakupie. Przycisk prowadzący do oferty nazywa obejrzenie oferty. Przycisk checkoutu powinien jawnie nazywać zakup, a przycisk zapisu jawnie nazywać zapis.

Poniżej oceniono każde wystąpienie CTA w treści wszystkich 38 zbadanych ścieżek stagingu, w tym przyciski cenników, odsyłacze kontaktowe, paginację i akcję powrotu z 404. Powtórzenia w obrębie jednej strony rozróżnia y. Tabela dotyczy istniejącego renderu, nie propozycji wdrożonych w aplikacji. Dla `ok` zamiennik powtarza tekst do zachowania. Nawigacja do artykułów, linki prawne, przełączniki zakładek i ustawienia zgód pozostają poza marketingowym audytem copy. Pełny korpus artykułów pozostaje poza zakresem, zgodnie z próbą T41.

Stały przycisk nagłówka "Bezpłatna konsultacja" → `/kontakt`: **ok**. Zamiennik: "Bezpłatna konsultacja". Nazywa znaną, niezobowiązującą formę pierwszego kontaktu. Na live zachować tę samą zasadę; etykiety ze starego Webflow nie są automatycznie wzorcem dla stagingu. Porównawcze dane live są w facts.json.

| Strona i pozycja y | Obecny tekst | Cel | Werdykt | Proponowany tekst | Powód |
| --- | --- | --- | --- | --- | --- |
'''
count = 0
for row in facts:
    current_path = row['path']
    for a in row['staging']['actions']:
        if not is_cta(a):
            continue
        v, replacement, reason = verdict(a['text'], a['target'], current_path)
        section += '| ' + ' | '.join(str(t).replace('|','/').replace('\n',' ') for t in [f'`{current_path}` y={a["y"]}', a['text'], f'`{a["target"]}`', v, replacement, reason]) + ' |\n'
        count += 1
section += f'\nPokrycie: {count} wystąpień CTA w treści oraz wspólny przycisk nagłówka. Nie wykonano zmian tekstów w aplikacji ani Sanity.\n\n'
# Idempotent insertion.
s = re.sub(r'## Teksty istniejących CTA\n.*?(?=## Ocena każdej strony)', '', s, flags=re.S)
s = s.replace('## Ocena każdej strony', section + '## Ocena każdej strony')
(ROOT / 'README.md').write_text(s.rstrip() + '\n')
print(f'Copy audit: {count} occurrences across {len(facts)} paths')
